import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
for i in range(1, 16):
    f = f"{sys.argv[1]}/l{i:02d}.wav"
    pcm = subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-i",f,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout
    # pad with silence so the first and last words are not swallowed by the model
    x = np.concatenate([np.zeros(8000, np.float32), np.frombuffer(pcm, np.float32), np.zeros(8000, np.float32)])
    segs, _ = m.transcribe(x, language="id", beam_size=5, vad_filter=False)
    print(f"{i:2d}: " + " ".join(s.text.strip() for s in segs), flush=True)
