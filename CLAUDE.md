# Studio Konten — panduan untuk Claude

Repo ini dipakai sebagai studio konten video. Pemilik repo bukan programmer:
jelaskan semuanya dalam **bahasa Indonesia santai**, tanpa istilah teknis yang
tidak perlu, dan kirim hasil akhirnya sebagai file MP4 (pakai SendUserFile).

`README.md` di root adalah profil GitHub pemilik. Jangan diubah kecuali diminta.

## Default konten

- **Format:** vertikal 9:16, 1080×1920, 30 fps (Shorts / Reels / TikTok).
  Pakai 16:9 (1920×1080) hanya kalau diminta untuk YouTube biasa.
- **Bahasa:** Indonesia santai, gaya konten sosmed.
- **Caption di layar:** teks besar putih tebal di kotak gelap semi transparan,
  di area atas (sekitar 220px dari atas), muncul dengan animasi "pop".
- **Durasi:** short 15–30 detik, kecuali diminta lain.

## Brand guide

> Belum diisi. Kalau pemilik memberikan brand guide (warna, font, logo, gaya
> bahasa, tagline, target audiens), tulis ringkasannya di sini dan ikuti untuk
> semua video berikutnya.

## Suara (ElevenLabs)

- Narator default: **Maliq**, voice_id `EIcz16yo4q5hJFhNay0n`
  (laki-laki, bahasa Indonesia, gaya sosmed yang ekspresif).
- Model: `eleven_v4`, `generations_count: 1`. Tag emosi seperti `[excited]`,
  `[mysterious]`, dan `[laughs]` boleh dipakai.
- Buat satu klip per adegan supaya pas dengan timing video, simpan di
  `kartun-video/public/vo/`, lalu putar dengan `<Audio>` dari `@remotion/media`.
- Host `elevenlabsusercontent.com` sudah diizinkan di environment, jadi audio
  bisa diunduh dengan `curl`.
- Tiap generasi memakai kredit pemilik. Jangan mengulang generasi untuk "retry".
- Akun ElevenLabs pemilik masih paket gratis (kuota 10.000 kredit/bulan, tanpa hak komersial).
  Kuota November 2026 sudah habis. Untuk Vuti dipakai suara **Samsul** (`AfkBqzsATOuueGnLAvJi`).

## Voice over dari rekaman pemilik (cara utama sekarang)

Pemilik merekam sendiri dialognya (satu orang membawakan Vutu yang heboh dan Vuti yang datar),
lalu Claude menyinkronkannya. Tidak memakai kredit ElevenLabs.

1. Buat **lembar rekaman** dari naskah (contoh: `naskah/2026-11-24-afcon-lembar-rekaman.md`):
   nomor, siapa, arahan nada, kalimat. Angka ditulis sebagai kata ("satu-nol").
2. Pemilik merekam di aplikasi perekam bawaan HP, lalu mengirim file m4a ke chat.
   Rekaman **jangan di-commit** (repo publik). Simpan di `kartun-video/public/vo/<episode>/user/` (di-gitignore).
3. Transkrip per kata pakai faster-whisper (model `small`, bahasa `id`):
   - Butuh host Hugging Face yang sudah diizinkan di environment; jalankan dengan `HF_HUB_DISABLE_XET=1`.
   - Pasang di venv scratchpad: `python3 -m venv venv && ./venv/bin/pip install faster-whisper`.
   - Ubah audio ke f32 16 kHz dengan ffmpeg dulu (PyAV bawaan tidak cocok), lalu `tools/vo/transcribe.py`.
4. Petakan kalimat: buang salah mulai dan bacaan dobel (pakai **bacaan terakhir**), sambung bagian kalau perlu.
   Potong per kalimat dengan pemangkasan berbasis energi, plus loudnorm (contoh: `tools/vo/cut_afcon_example.py`).
   Skrip itu juga menulis modul TS berisi durasi, momen kata kunci, dan amplop gerak mulut per frame.
5. **Verifikasi**: transkrip ulang tiap klip (`tools/vo/verify.py`) dan audio video final. Semua kalimat harus ada,
   urut, tanpa kata terpotong dan tanpa dobel.
6. Di animasi: momen penting mengikuti waktu kata (`events`), dan mulut mengikuti amplop suara (`env`).
   Contoh lengkap: `src/vutuvuti/afcon/` (`userVo.ts`, `script.ts`, `EpisodeAfcon.tsx`).

## Karakter tetap

| Karakter | File | Deskripsi |
|---|---|---|
| Monster hutan | `kartun-video/src/MonsterShort.tsx` (komponen `Monster`) | Gempal, berbulu ungu, 3 mata hijau, taring besar, selalu tersenyum, tangan panjang berkuku. Tinggal di hutan dekat gua. |
| Anak kecil | `kartun-video/src/Character.tsx` | Kartun sederhana: kaos kuning, celana biru, rambut cokelat. |
| **Vutu** | `kartun-video/src/vutuvuti/` (`VUTU` di `looks.ts`) | Kulit sawo matang, rahang kotak, rambut ikal pink, jersey pink bertulisan "vutu" (nomor 7). Lucu, riang, aktif, suka jahil ke Vuti. |
| **Vuti** | `kartun-video/src/vutuvuti/` (`VUTI` di `looks.ts`) | Kulit sawo lebih cerah, rahang bulat, rambut punk (mohawk) hijau, jersey hijau bertulisan "vuti" (nomor 10). Kalem, chill, acuh, sering dijahili Vutu. |

### Rig Vutu & Vuti

- `Person.tsx` menggambar karakter dari pose dengan sendi kepala, leher, badan, bahu,
  siku, tangan, pinggul, lutut, dan kaki, dalam 4 tampilan: `front`, `back`, `left`, `right`.
- `poses.ts` berisi gerakan siap pakai: `idle`, `talk`, `walk`, `run`, `jump`, `kick`,
  `wave`, `celebrate`, `shrug`, `sneak`, `poke`, `laugh`. Gerakan bisa dicampur dengan `mix()`.
  Gerakan baru ditambahkan di file ini.
- Ganti jersey sesuai cerita dengan `withJersey(VUTU, warna, warnaGelap)` dari `looks.ts`.
- Versi 3D: `Person3D.tsx` (Three.js lewat `@remotion/three`), memakai Pose yang sama. Render 3D wajib
  ditambah `--gl=angle`. Contoh: `src/vutuvuti/Test3D.tsx`.
- Versi 3D manusia (proporsi realistis, satu badan utuh dengan kerangka): `src/human/`.
  `buildHuman.ts` membangun badan, `Human.tsx` menerapkan Pose, `realPoses.ts` berisi gerakan
  realistis (`idleR`, `walkR`, `runR`, `jumpR`, `waveR`). Contoh: `src/human/StreetTest.tsx`.
- Contoh pemakaian: `src/vutuvuti/Showcase.tsx` (composition `VutuVutiShowcase` dan still `VutuVutiSheet`).

**Gaya yang disukai pemilik: kartun 2D seperti video monster (brand 1).** Untuk episode Vutu & Vuti,
pakai rig 2D (`Person.tsx`) dengan suasana yang digarap: langit dan cahaya, latar berlapis, partikel,
kamera zoom/goyang, dan caption. Contoh acuan: `src/vutuvuti/EpisodePenalti.tsx`. Versi 3D (mainan
dan manusia) hanya eksperimen; jangan dipakai kecuali diminta.

**Shot sinematik:** pakai pola `src/vutuvuti/cinematic/PenaltiCinematic.tsx`. Set dibangun dari bidang CSS 3D
(`perspective` + `preserve-3d`), karakter 2D jadi billboard yang menghadap kamera, kamera diatur per shot
dengan `lookAt`. Hindari bidang yang saling memotong di dekat karakter (jaring samping/atap gawang bikin
karakter terpotong di Chrome). Render ini lambat, jalankan di latar belakang.

Untuk episode baru dengan karakter yang sama, pakai ulang komponennya. Jangan
menggambar ulang dari nol supaya bentuknya tetap konsisten.

## Proyek Remotion

Semua video ada di `kartun-video/` (Remotion 4). Setiap video didaftarkan
sebagai `<Composition>` di `src/Root.tsx`.

| Composition | Isi |
|---|---|
| `Kartun` | Demo 12 detik, anak kecil menyapa (16:9) |
| `MonsterShort` | Monster bakar ayam, 24 detik, dengan voice over (9:16) |
| `VutuVutiShowcase` | Showcase gerakan Vutu & Vuti, 37 detik (16:9) |
| `VutuVutiSheet` | Lembar karakter 4 sisi (gambar diam) |
| `VutuVuti3DTest` | Tes versi 3D Vutu & Vuti, 10,5 detik (16:9) |
| `EpisodePenalti` | **Gaya utama.** Vutu & Vuti episode "Penalti" di lapangan kampung saat senja, 20 detik (9:16) |
| `EpisodeAfcon` / `EpisodeAfconSilent` | Vutu (jersey ala Senegal) & Vuti (jersey ala Maroko) bahas final AFCON 2025 dan putusan CAS. Versi bersuara memakai rekaman suara pemilik (±94 detik); versi tanpa suara ±92 detik (9:16) |
| `PenaltiCinematic` | Demo sinematik 2,5D: panggung 3D (lapangan, gawang, tribun) dengan karakter 2D, kamera dolly/orbit/low-angle/crane, slow-mo dan fokus kabur, 15 detik (9:16) |
| `JesusSuarez` | Vutu (= Gabriel Jesus) & Vuti (= Suárez) berjersey garis Barça di lapangan kampung malam: podium, bangku bambu, papan tulis, poster MSN, tangga peringkat, papan dukungan. 52 detik (9:16). Caption satu kata, logo vutbaler, musik samba original. Timeline di `src/vutuvuti/jesus/timeline.ts`; setelah VO ada, isi `sync.ts` lalu taruh suara di `public/jesus/vo.mp3` (otomatis dipakai). Logo klub asli: taruh `public/fcb.png` (otomatis dipakai, kalau tidak ada pakai lencana generik) |
| `VutuVutiStreet` | Vutu & Vuti versi 3D manusia (gaya game era 2000-an) di jalanan kota, 13 detik (16:9) |

### Render di sesi cloud

Browser bawaan Remotion tidak bisa diunduh di sini. Selalu pakai Chromium
yang sudah terpasang:

```bash
cd kartun-video
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
# Cek beberapa frame dulu
npx remotion still <Composition> out/cek.png --frame=120 --scale=0.5 --browser-executable=$B
# Render video penuh
npx remotion render <Composition> out/<nama>.mp4 --browser-executable=$B
```

### Alur kerja

1. Tulis atau ubah composition di `kartun-video/src/`.
2. Render beberapa frame, lalu periksa hasilnya sebelum render penuh.
3. Render MP4 dan kirim ke pemilik dengan SendUserFile.
4. Commit kode dan audio, lalu push. Folder `out/` (MP4) memang tidak ikut
   ke git.
