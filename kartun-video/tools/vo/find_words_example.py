import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
d = sys.argv[1]
for i, keys in [(1,["dicabut","dibalikin"]),(3,["bawa"]),(5,["panenka","tepis","ditepis"]),(7,["nembak","1","satu"]),(8,["banding","kalah"]),(11,["aturan"]),(12,["sah"])]:
    pcm = subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-i",f"{d}/l{i:02d}.wav","-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout
    x = np.concatenate([np.zeros(8000, np.float32), np.frombuffer(pcm, np.float32), np.zeros(8000, np.float32)])
    segs,_ = m.transcribe(x, language="id", word_timestamps=True, beam_size=5)
    ws = [(w.word.strip().lower().strip(",.!?"), w.start-0.5) for s in segs for w in s.words]
    print(i, [(w, round(t,2)) for w,t in ws if any(w.startswith(k) for k in keys)])
