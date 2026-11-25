import sys, json
from faster_whisper import WhisperModel
model = WhisperModel(sys.argv[2], device="cpu", compute_type="int8")
import numpy as np
audio = np.fromfile(sys.argv[1], dtype=np.float32)
segs, info = model.transcribe(audio, language="id", word_timestamps=True, vad_filter=False, beam_size=5)
out = []
for s in segs:
    out.append({"start": s.start, "end": s.end, "text": s.text, "words": [{"w": w.word, "s": w.start, "e": w.end} for w in s.words]})
    print(f"{s.start:7.2f}-{s.end:7.2f} {s.text}", flush=True)
json.dump(out, open(sys.argv[3], "w"), ensure_ascii=False, indent=1)
