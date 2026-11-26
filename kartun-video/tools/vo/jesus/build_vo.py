import subprocess, json, numpy as np, sys
D=sys.argv[1]; PROJ=sys.argv[2]
SR=44100; FPS=30; TEMPO=1.06
files=[f'r{i:02d}.wav' for i in range(1,15)]+['r15b.wav','r15c.wav','r16.wav','r17.wav']
TR='silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.1,areverse'
def load(p):
    raw=subprocess.run(['ffmpeg','-loglevel','error','-i',f'{D}/{p}','-af',f'{TR},atempo={TEMPO}','-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.float32).copy()
    x*=0.12/np.sqrt(np.mean(x[np.abs(x)>0.01]**2))
    return x
clips=[load(f) for f in files]
scene_break={3,7,10,14,17}
t=9/FPS+0.15; starts=[]
for i,c in enumerate(clips,1):
    if i>1:
        t+=0.45 if i in scene_break else 0.25
        if i==15: t+=0.45   # beat of silence before "Bro"
        if i==16: t+=0.35   # "Bro..." pause
    starts.append(t); t+=len(c)/SR
total_s=t+1.6
TOTAL=int(np.ceil(total_s*FPS))
mix=np.zeros(int(TOTAL/FPS*SR)+SR,dtype=np.float32)
for s,c in zip(starts,clips):
    i=int(s*SR); mix[i:i+len(c)]+=c
mix=mix[:int(TOTAL/FPS*SR)]
pk=np.max(np.abs(mix)); mix*=0.89/pk if pk>0.89 else 1
open(f'{D}/vo.f32','wb').write(mix.tobytes())
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','f32le','-ar',str(SR),'-ac','1','-i',f'{D}/vo.f32','-ac','2','-b:a','192k',f'{PROJ}/public/jesus/vo.mp3'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','f32le','-ar',str(SR),'-ac','1','-i',f'{D}/vo.f32','-ar','16000','-f','f32le',f'{D}/vo16.f32'],check=True)
shot_line={'1A':1,'1B':2,'2A':3,'2B':4,'2C':5,'2D':6,'3A':7,'3B':8,'3C':9,'4A':10,'4B':11,'4C':13,'5A':14,'5B':15,'6A':17,'6B':18}
ss={k:max(9,int(round(starts[v-1]*FPS))-4) for k,v in shot_line.items()}
json.dump({'starts':ss,'total':TOTAL},open(f'{D}/layout.json','w'),indent=1)
print(TOTAL, round(TOTAL/FPS,1), ss)
