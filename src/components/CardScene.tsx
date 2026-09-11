import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
  const pop = spring({frame, fps, config: {damping: 13, stiffness: 150, mass: 0.7}});
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const y = interpolate(frame, [0, 22], [130, 0], {
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
        width,
        translate: `-50% calc(-50% + ${y}px)`,
        opacity,
        scale: pop,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          borderRadius: 18,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: `0 28px 80px #000000aa, 0 0 46px ${glow}22`,
          display: 'grid',
          placeItems: 'center',
          padding: 12,
          boxSizing: 'border-box',
          minHeight: src ? undefined : height,
        }}
      >
        {src ? (
          <Img src={staticFile(src)} style={{maxWidth: '100%', maxHeight: height, objectFit: 'contain'}} />
        ) : (
          <div style={{color: '#111', fontSize: 30, fontWeight: 700, padding: 24}}>{caption}</div>
        )}
      </div>
    </div>
  );
};
