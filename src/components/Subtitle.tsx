import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../lib/theme';
import {secondsToFrames, toCharCues} from '../lib/timeline';
import type {Timeline} from '../lib/types';

export const Subtitle: React.FC<{
  timeline: Timeline;
  top?: number;
  fontSize?: number;
}> = ({timeline, top = theme.subtitle.top, fontSize = theme.subtitle.fontSize}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cues = toCharCues(timeline.words);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 30,
        right: 30,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          maxWidth: theme.subtitle.maxWidth,
          padding: '16px 26px',
          borderRadius: 18,
          background: theme.subtitle.background,
          boxShadow: '0 10px 40px #00000066',
        }}
      >
        {cues.map((cue, i) => {
          const local = frame - secondsToFrames(cue.start, fps);
          const pop = spring({frame: local, fps, config: {damping: 9, stiffness: 230, mass: 0.55}});
          const opacity = interpolate(local, [0, 3], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const y = interpolate(pop, [0, 1], [26, 0]);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize,
                fontWeight: 800,
                color: theme.colors.text,
                marginRight: 2,
                opacity,
                scale: pop,
                translate: `0 ${y}px`,
              }}
            >
              {cue.ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};
