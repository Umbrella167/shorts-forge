import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {scaleValue, useLayout} from '../lib/layout';
import {theme} from '../lib/theme';

export const CardScene: React.FC<{
  src?: string;
  top?: number;
  width?: number;
  height?: number;
  caption?: string;
  glow?: string;
}> = ({src, top = 58, width = 620, height = 500, caption, glow = theme.colors.bilibili}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {scale} = useLayout();
  const s = (value: number) => scaleValue(value, scale);
  const pop = spring({frame, fps, config: {damping: 13, stiffness: 150, mass: 0.7}});
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const y = interpolate(frame, [0, 22], [s(130), 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: `${top}%`,
        width: s(width),
        translate: `-50% calc(-50% + ${y}px)`,
        opacity,
        scale: pop,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          borderRadius: s(18),
          overflow: 'hidden',
          background: '#fff',
          boxShadow: `0 ${s(28)}px ${s(80)}px #000000aa, 0 0 ${s(46)}px ${glow}22`,
          display: 'grid',
          placeItems: 'center',
          padding: s(12),
          boxSizing: 'border-box',
          minHeight: src ? undefined : s(height),
        }}
      >
        {src ? (
          <Img src={staticFile(src)} style={{maxWidth: '100%', maxHeight: s(height), objectFit: 'contain'}} />
        ) : (
          <div style={{color: '#111', fontSize: s(30), fontWeight: 700, padding: s(24)}}>{caption}</div>
        )}
      </div>
    </div>
  );
};
