import {secondsToFrames} from './timeline';
import type {ManifestItem} from './types';

export const DEFAULT_TAIL = 0.3;

export const segmentFrames = (item: ManifestItem, fps: number, tail = DEFAULT_TAIL) =>
  Math.max(1, secondsToFrames(Math.max(item.duration, 0.4) + tail, fps));

export const manifestFrames = (items: ManifestItem[], fps: number, tail = DEFAULT_TAIL) =>
  items.reduce((sum, item) => sum + segmentFrames(item, fps, tail), 0);
