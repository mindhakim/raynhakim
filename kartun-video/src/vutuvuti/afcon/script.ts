// Dialogue + timing for the AFCON / CAS episode.
// `dur` is the real clip length in seconds once the voice exists; until then it is an estimate.
// `file` is set only for clips that exist in public/vo/afcon/.

export type Line = {
  who: "vutu" | "vuti";
  text: string; // on-screen subtitle
  file?: string;
  dur: number;
};

export const LINES: Line[] = [
  { who: "vutu", text: "Ada tim yang juara Piala Afrika... gelarnya dicabut... terus DIBALIKIN LAGI!", file: "vo/afcon/l01.mp3", dur: 5.76 },
  { who: "vuti", text: "Final Piala Afrika 2025. Senegal lawan Maroko, tuan rumahnya. Skor 0–0, sampai menit-menit terakhir.", dur: 6.5 },
  {
    who: "vutu",
    text: "Injury time! Gol Senegal sebelumnya dianulir, terus Maroko malah dapet penalti. Pelatihnya, Pape Thiaw, emosi... dan bawa pemainnya KELUAR lapangan!",
    file: "vo/afcon/l03.mp3",
    dur: 10.32,
  },
  { who: "vuti", text: "Sekitar seperempat jam. Satu stadion bingung.", dur: 3.5 },
  { who: "vutu", text: "Mereka balik. Brahim Díaz ambil penalti... Panenka... DITEPIS Mendy!", dur: 5.5 },
  { who: "vuti", text: "...aduh.", dur: 1.4 },
  { who: "vutu", text: "Extra time, Pape Gueye nembak dari luar kotak. 1–0! Senegal JUARA!", dur: 6.0 },
  {
    who: "vuti",
    text: "Tapi Maroko banding. Bulan Maret, Komite Banding CAF bilang: keluar lapangan berarti menyerah. Senegal dianggap kalah WO, 3–0 buat Maroko.",
    dur: 10.0,
  },
  { who: "vutu", text: "Padahal trofinya udah diarak keliling Senegal!", dur: 3.0 },
  { who: "vutu", text: "Senegal bawa ke CAS, pengadilan olahraga dunia. Dan 24 November, putusannya keluar...", dur: 6.5 },
  { who: "vuti", text: "Wasit yang ngelanjutin pertandingan, itu wewenang dia. Aturan kalah WO cuma berlaku kalau laganya dihentikan total.", dur: 7.5 },
  { who: "vutu", text: "Hasil 1–0 SAH! Senegal juara LAGI!", dur: 3.5 },
  { who: "vuti", text: "Jadi... walk-out itu boleh?", dur: 2.4 },
  { who: "vutu", text: "Ya nggak gitu juga! Sanksi disiplinnya dibahas terpisah.", dur: 4.0 },
  { who: "vuti", text: "Kalau menurut kalian?", dur: 1.8 },
];

export const RATE = 1.08; // slightly faster delivery keeps it near one minute
export const GAP = 0.3;
export const LEAD_IN = 0.3;
export const OUTRO = 2.8;

export type Slot = Line & { start: number; end: number; i: number };

// Silent version: no voice clips and a slightly slower pace so the subtitles are easy to read
export const SILENT_RATE = 0.92;

export const schedule = (silent = false): Slot[] => {
  let t = LEAD_IN;
  const rate = silent ? SILENT_RATE : RATE;
  return LINES.map((l, i) => {
    const d = l.dur / rate;
    const s: Slot = { ...l, file: silent ? undefined : l.file, start: t, end: t + d, i };
    t += d + GAP;
    return s;
  });
};

export const totalSeconds = (silent = false) => {
  const s = schedule(silent);
  return s[s.length - 1].end + OUTRO;
};
