# VO otomatis (gratis, tanpa kredit) untuk JesusSuarez

Suara: Piper TTS, model `id_ID-news_tts-medium` dari Hugging Face (rhasspy/piper-voices), jalan offline di sesi.
Dipakai kalau kredit ElevenLabs/vidIQ habis dan pemilik tidak merekam sendiri.

1. `python3 -m venv pv && ./pv/bin/pip install piper-tts`, unduh `id.onnx` + `id.onnx.json`.
2. `piper_pick.py` (jalan di venv faster-whisper): tiap kalimat di `lines.txt` dibuat sampai 6 versi
   (awali teks dengan ", "), lalu dipilih yang transkripnya paling cocok. Piper kadang "menelan" bunyi
   pertama kalimat, jadi pemilihan ini wajib. Jangan pakai `loudnorm` per klip (bunyi awal jadi hilang).
3. `build_vo.py <dir> <kartun-video>`: susun klip + jeda, tulis `public/jesus/vo.mp3` dan `layout.json`.
4. Transkrip ulang `vo16.f32` (tools/vo/transcribe.py) jadi `vo.json`, lalu `jesus_sync.py` menulis `sync.ts`.
