import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../lib/theme';
import type {SegmentProps} from '../lib/types';

export const DefaultScene: React.FC<SegmentProps> = ({segmentDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inPop = spring({frame, fps, config: {damping: 12, stiffness: 140, mass: 0.7}});
  const width = interpolate(inPop, [0, 1], [40, 240]);
  const opacity = interpolate(frame, [0, 8, segmentDuration - 10, segmentDuration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 300, display: 'grid', placeItems: 'center', opacity}}>
      <div
        style={{
          width,
          height: 8,
          borderRadius: 8,
          background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.bilibili})`,
          boxShadow: `0 0 30px ${theme.colors.accent}66`,
        }}
      />
    </div>
  );
};
