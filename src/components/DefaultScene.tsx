import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {scaleValue, useLayout} from '../lib/layout';
import {theme} from '../lib/theme';
import type {SegmentProps} from '../lib/types';

export const DefaultScene: React.FC<SegmentProps> = ({segmentDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {scale} = useLayout();
  const s = (value: number) => scaleValue(value, scale);
  const inPop = spring({frame, fps, config: {damping: 12, stiffness: 140, mass: 0.7}});
  const width = interpolate(inPop, [0, 1], [s(40), s(240)]);
  const opacity = interpolate(frame, [0, 8, segmentDuration - 10, segmentDuration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: s(300),
        display: 'grid',
        placeItems: 'center',
        opacity,
      }}
    >
      <div
        style={{
          width,
          height: s(8),
          borderRadius: s(8),
          background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.bilibili})`,
          boxShadow: `0 0 ${s(30)}px ${theme.colors.accent}66`,
        }}
      />
    </div>
  );
};
