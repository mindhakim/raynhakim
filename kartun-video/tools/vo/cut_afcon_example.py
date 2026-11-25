import json, sys, subprocess, numpy as np
raw_f32, raw_m4a, outdir, tsout = sys.argv[1:5]
a = np.fromfile(raw_f32, dtype=np.float32); SR = 16000
def rms_db(t0, t1):
    s = a[int(t0*SR):int(t1*SR)]
    return 20*np.log10(np.sqrt(np.mean(s**2))+1e-9) if len(s) else -120
def trim(w0, w1, thr=-40):
    hop = 0.01; ts = np.arange(w0, w1, hop)
    lv = [rms_db(t, t+0.03) for t in ts]
    on = [t for t, l in zip(ts, lv) if l > thr]
    s, e = on[0], on[-1] + 0.03
    return max(w0, s - 0.06), min(w1, e + 0.16)
# (line, windows, events{name: absolute time})
spec = [
 (1,  [(2.75, 10.9)], {"away": 6.14, "back": 8.64}),
 (2,  [(14.3, 20.2), (24.3, 27.6)], {}),
 (3,  [(29.3, 41.7)], {"walk": 38.48}),
 (4,  [(42.4, 47.0)], {}),
 (5,  [(47.5, 54.5)], {"contact": 51.92, "save": 53.08}),
 (6,  [(54.8, 56.8)], {}),
 (7,  [(63.9, 71.5)], {"contact": 66.74, "goal": 68.36}),
 (8,  [(74.5, 86.5)], {"paper": 76.78, "move": 83.42}),
 (9,  [(88.1, 92.2)], {}),
 (10, [(92.6, 102.0)], {}),
 (11, [(102.8, 111.6)], {"card1": 103.28, "card2": 106.92}),
 (12, [(112.0, 119.0)], {"sah": 114.98}),
 (13, [(119.6, 124.3)], {}),
 (14, [(127.75, 133.8)], {}),
 (15, [(133.9, 136.88)], {}),
]
FPS = 30
res = []
for line, wins, ev in spec:
    thr = -30 if line in (8, 9) else -40
    parts = [tuple(float(v) for v in trim(*w, thr=thr)) for w in wins]
    out = f"{outdir}/l{line:02d}.wav"
    if len(parts) == 1:
        s, e = parts[0]
        fil = "highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11"
        cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y","-i",raw_m4a,"-ss",f"{s:.3f}","-to",f"{e:.3f}","-af",fil,"-ar","48000","-ac","1",out]
    else:
        inputs = []; fc = ""
        for i,(s,e) in enumerate(parts):
            inputs += ["-ss",f"{s:.3f}","-to",f"{e:.3f}","-i",raw_m4a]
        fc = "".join(f"[{i}:a]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11[o]"
        cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y",*inputs,"-filter_complex",fc,"-map","[o]","-ar","48000","-ac","1",out]
    subprocess.run(cmd, check=True)
    dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",out],capture_output=True,text=True).stdout)
    # map absolute event times into the clip timeline
    def rel(t):
        acc = 0.0
        for s,e in parts:
            if t < s: return acc
            if t <= e: return acc + (t - s)
            acc += e - s
        return acc
    evr = {k: round(rel(v), 3) for k, v in ev.items()}
    # mouth envelope per video frame from the clip itself
    pcm = subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-i",out,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.float32); n = int(np.ceil(len(x)/SR*FPS)); env=[]
    for f in range(n):
        seg = x[int(f/FPS*SR):int((f+1)/FPS*SR)]
        db = 20*np.log10(np.sqrt(np.mean(seg**2))+1e-9) if len(seg) else -120
        env.append(round(float(min(1, max(0, (db + 42) / 26))), 2))
    res.append({"line": line, "file": f"vo/afcon/user/l{line:02d}.wav", "dur": round(dur, 3), "events": evr, "env": env, "parts": [[round(s,2),round(e,2)] for s,e in parts]})
    print(line, [[round(s,2),round(e,2)] for s,e in parts], round(dur,2), evr)
with open(tsout, "w") as f:
    f.write("// Generated from the owner's own voice recording. Do not edit by hand.\n")
    f.write("// Per line: clip file, real duration, key moments (seconds into the clip) and a per-frame mouth envelope.\n")
    f.write("export const USER_VO = " + json.dumps(res) + " as const;\n")
