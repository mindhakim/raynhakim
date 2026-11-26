import subprocess, numpy as np, difflib, re, sys, shutil
from faster_whisper import WhisperModel
m=WhisperModel("small",device="cpu",compute_type="int8")
lines=[l.strip() for l in open('lines.txt') if l.strip()]
def norm(s):
    s=s.lower()
    rep={'suares':'suarez','jisus':'jesus','barsa':'barca','rafinya':'rafinha','kunde':'kunde'}
    for a,b in rep.items(): s=s.replace(a,b)
    return re.sub(r'[^a-z ]','',s)
nums={'dua puluh delapan':'28','dua puluh tujuh':'27','tujuh puluh tiga':'73','enam puluh satu':'61','enam puluh':'60','dua belas':'12','seratus empat puluh lima':'145','empat satu':'41','tiga':'3'}
def target(l):
    s=l.lower()
    for a,b in nums.items(): s=s.replace(a,b)
    return norm(s.replace('barsa','barca'))
for i,l in enumerate(lines,1):
    best=None
    for k in range(6):
        w=f'cand{i:02d}_{k}.wav'
        subprocess.run(['./pv/bin/piper','-m','id.onnx','-c','id.onnx.json','-f',w,'--length-scale','0.86','--noise-scale','0.5'],input=(', '+l).encode(),capture_output=True)
        raw=subprocess.run(['ffmpeg','-loglevel','error','-i',w,'-af','silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.12,areverse,adelay=400,apad=pad_dur=0.4','-ar','16000','-ac','1','-f','f32le','-'],capture_output=True).stdout
        segs,_=m.transcribe(np.frombuffer(raw,dtype=np.float32),language='id')
        txt=' '.join(s.text for s in segs)
        hyp=norm(txt); tgt=target(l)
        # first word must be right; overall similarity
        fw=tgt.split()[0][:4]; first=1.0 if hyp.replace(' ','').startswith(fw) else 0.0
        sc=first*0.5+difflib.SequenceMatcher(None,hyp.replace(' ',''),tgt.replace(' ','')).ratio()
        if best is None or sc>best[0]: best=(sc,w,txt)
        if first and sc>1.35: break
    shutil.copy(best[1],f'r{i:02d}.wav')
    print(i, round(best[0],2), best[2], flush=True)
