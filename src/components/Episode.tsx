import React from 'react';
import {AbsoluteFill, Series, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {segmentFrames} from '../lib/duration';
import {theme} from '../lib/theme';
import type {EpisodeConfig} from '../lib/types';
import {Background} from './Background';
import {Subtitle} from './Subtitle';

export const Episode: React.FC<{episode: EpisodeConfig}> = ({episode}) => {
  const {fps} = useVideoConfig();
  const DefaultScene = episode.defaultScene;

  return (
    <AbsoluteFill
      style={{
        background: theme.colors.bg,
        color: theme.colors.text,
        fontFamily: theme.fontFamily,
        overflow: 'hidden',
      }}
    >
      <Series>
        {episode.manifest.items.map((item) => {
          const Scene = episode.scenes[item.index] ?? DefaultScene;
          const timeline = episode.timelines[item.index];
          const duration = segmentFrames(item, fps, episode.tail);
          return (
            <Series.Sequence key={item.index} durationInFrames={duration}>
              <AbsoluteFill>
                <Background />
                {timeline ? (
                  <Scene
                    timeline={timeline}
                    item={item}
                    segmentIndex={item.index}
                    segmentDuration={duration}
                  />
                ) : null}
                {timeline ? <Subtitle timeline={timeline} /> : null}
              </AbsoluteFill>
              <Audio src={staticFile(`${episode.audioDir}/${item.audio}`)} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
