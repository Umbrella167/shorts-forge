import type {Timeline, Word} from './types';

export const secondsToFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

export const framesToSeconds = (frames: number, fps: number) => frames / fps;

export const lastEnd = (timeline: Timeline) => timeline.duration;

export const activeWord = (words: Word[], seconds: number): Word | null =>
  words.find((word) => seconds >= word.start && seconds < word.end) ?? null;

export const wordIndexAt = (words: Word[], seconds: number): number => {
  for (let i = words.length - 1; i >= 0; i -= 1) {
    if (seconds >= words[i].start) return i;
  }
  return -1;
};

export type CharCue = {ch: string; start: number; end: number};

export const toCharCues = (words: Word[]): CharCue[] => {
  const cues: CharCue[] = [];
  for (const word of words) {
    const chars = Array.from(word.word);
    const span = (word.end - word.start) / Math.max(1, chars.length);
    chars.forEach((ch, i) => {
      cues.push({ch, start: word.start + i * span, end: word.start + (i + 1) * span});
    });
  }
  return cues;
};

export const clampProgress = (seconds: number, start: number, end: number) => {
  if (end <= start) return seconds >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (seconds - start) / (end - start)));
};
