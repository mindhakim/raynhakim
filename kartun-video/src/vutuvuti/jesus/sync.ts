// Filled in once the voice over exists: shot starts taken from the VO sentence timestamps,
// and caption word times from the word-level transcript. Empty = use the shot-list estimates.

import type { CaptionWord, ShotId } from "./timeline";

export const SYNC_STARTS: Partial<Record<ShotId, number>> = {};
export const SYNC_WORDS: CaptionWord[] | null = null;
