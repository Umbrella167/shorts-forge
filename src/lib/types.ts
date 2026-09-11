import type {ComponentType} from 'react';

export type Word = {word: string; start: number; end: number};

export type Sentence = {text: string; start: number; end: number; words: Word[]};

export type Timeline = {
  index: number;
  text: string;
  instruction: string | null;
  duration: number;
  sentences: Sentence[];
  words: Word[];
};

export type ManifestItem = {
  index: number;
  text: string;
  instruction: string | null;
  duration: number;
  audio: string;
  timeline: string;
};

export type Manifest = {total: number; items: ManifestItem[]};

export type SegmentProps = {
  timeline: Timeline;
  item: ManifestItem;
  segmentIndex: number;
  segmentDuration: number;
};

export type EpisodeConfig = {
  id: string;
  title: string;
  slug: string;
  fps: number;
  width: number;
  height: number;
  tail: number;
  manifest: Manifest;
  timelines: Record<number, Timeline>;
  audioDir: string;
  scenes: Record<number, ComponentType<SegmentProps>>;
  defaultScene: ComponentType<SegmentProps>;
};
