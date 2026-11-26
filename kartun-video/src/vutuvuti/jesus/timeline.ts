import { SYNC_STARTS, SYNC_TOTAL, SYNC_WORDS } from "./sync";

// Shot timeline for "Gabriel Jesus Nyalip Suárez" (frames at 30 fps).
// ORIG is the frame table from the shot list. Once the voice over exists, sync.ts holds the
// real shot starts (taken from the VO sentence timestamps) and every in-shot moment is
// stretched to match through at().

export const FPS = 30;
export const ORIG_TOTAL = 1569;
export const TOTAL = SYNC_TOTAL ?? ORIG_TOTAL;

export const SHOT_IDS = ["C", "1A", "1B", "2A", "2B", "2C", "2D", "3A", "3B", "3C", "4A", "4B", "4C", "5A", "5B", "6A", "6B"] as const;
export type ShotId = (typeof SHOT_IDS)[number];

export const ORIG: Record<ShotId, number> = {
  C: 0,
  "1A": 9,
  "1B": 99,
  "2A": 189,
  "2B": 249,
  "2C": 339,
  "2D": 429,
  "3A": 519,
  "3B": 609,
  "3C": 699,
  "4A": 789,
  "4B": 879,
  "4C": 1009,
  "5A": 1119,
  "5B": 1239,
  "6A": 1359,
  "6B": 1479,
};

export const STARTS: Record<ShotId, number> = { ...ORIG, ...SYNC_STARTS };

const endOf = (starts: Record<ShotId, number>, id: ShotId, total = TOTAL) => {
  const i = SHOT_IDS.indexOf(id);
  return i === SHOT_IDS.length - 1 ? total : starts[SHOT_IDS[i + 1]];
};

export const shotStart = (id: ShotId) => STARTS[id];
export const shotEnd = (id: ShotId) => endOf(STARTS, id);
export const shotDur = (id: ShotId) => shotEnd(id) - shotStart(id);

export const shotAt = (f: number): ShotId => {
  let cur: ShotId = "C";
  for (const id of SHOT_IDS) if (f >= STARTS[id]) cur = id;
  return cur;
};

// Progress 0..1 through a shot
export const kOf = (id: ShotId, f: number) => Math.min(1, Math.max(0, (f - shotStart(id)) / shotDur(id)));

// A moment given in shot-list frames, moved to the synced timeline
export const at = (id: ShotId, origFrame: number) => {
  const od = endOf(ORIG, id, ORIG_TOTAL) - ORIG[id];
  return shotStart(id) + ((origFrame - ORIG[id]) * shotDur(id)) / od;
};

// ---------------------------------------------------------------------------
// One-word captions. *word* = pink keyword, +word+ = green (good figures for Jesus).
// ---------------------------------------------------------------------------

export const CAPTIONS: Record<ShotId, string[]> = {
  C: [],
  "1A": ["Top", "skor", "nomor", "*tiga*", "*Barsa*", "Luis", "Suares"],
  "1B": ["baru", "aja", "*disalip*", "sama", "pemain", "*cadangan*"],
  "2A": ["Namanya", "*Gabriel*", "*Jisus*"],
  "2B": ["Barsa", "menang", "+empat-satu+", "di", "Sabah", "Azerbaijan"],
  "2C": ["*starter*", "Yamal", "*absen*", "Rafinya", "dicadangin"],
  "2D": ["Menit", "+60+", "Kunde", "ditepis", "*nyocol*"],
  "3A": ["Gol", "ke-+28+", "Liga", "Champions"],
  "3B": ["Suares?", "*27*", "gol", "*73*", "laga"],
  "3C": ["Jisus", "+61+", "+dua belas+", "laga", "+lebih sedikit+"],
  "4A": ["Padahal", "Suares", "trio", "*MSN*"],
  "4B": ["Tapi", "*di bawah*", "Jisus", "sejajar", "Ryan", "*Giggs*"],
  "4C": ["*145*", "laga", "buat", "+28+", "gol"],
  "5A": ["lucunya", "Jisus", "malah", "*belum*", "*puas*"],
  "5B": ["Bro...", "*puas*", "dikit", "nggak", "*dosa*"],
  "6A": ["Jisus", "+tajam+", "atau", "Suares", "*kurang ganas*"],
  "6B": ["tulis", "di", "*komen*", "*follow*", "vutbaler"],
};

export type CaptionWord = { text: string; from: number; to: number };

// Every caption word with its frame window. With a synced VO, SYNC_WORDS gives real word times.
export const captionWords = (): CaptionWord[] => {
  if (SYNC_WORDS) return SYNC_WORDS;
  const out: CaptionWord[] = [];
  for (const id of SHOT_IDS) {
    const words = CAPTIONS[id];
    if (!words.length) continue;
    const a = shotStart(id) + 4;
    const b = shotEnd(id) - 3;
    const step = (b - a) / words.length;
    words.forEach((w, i) => out.push({ text: w, from: Math.round(a + i * step), to: Math.round(a + (i + 1) * step) }));
  }
  return out;
};
