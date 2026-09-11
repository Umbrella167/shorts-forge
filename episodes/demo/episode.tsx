import React from 'react';
import {CardScene} from '../../src/components/CardScene';
import {DefaultScene} from '../../src/components/DefaultScene';
import {theme} from '../../src/lib/theme';
import type {EpisodeConfig, Manifest, SegmentProps, Timeline} from '../../src/lib/types';
import manifest from './timeline/manifest.json';
import timelines from './timeline/timelines.json';

const AngryScene: React.FC<SegmentProps> = () => (
  <CardScene caption="愤怒语气演示" glow={theme.colors.accent} />
);

export const demo: EpisodeConfig = {
  id: 'demo',
  title: '框架演示',
  slug: 'demo',
  fps: 30,
  width: 720,
  height: 1280,
  tail: 0.3,
  manifest: manifest as Manifest,
  timelines: timelines as unknown as Record<number, Timeline>,
  audioDir: 'episodes/demo/voice',
  scenes: {2: AngryScene},
  defaultScene: DefaultScene,
};
