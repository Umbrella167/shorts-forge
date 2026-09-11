import React from 'react';
import {interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {scaleValue, useLayout} from '../lib/layout';
import {theme} from '../lib/theme';

export const PhoneFrame: React.FC<{
  src: string;
  width?: number;
  zoomFrom?: number;
  zoomTo?: number;
  zoomDuration?: number;
}> = ({src, width = 420, zoomFrom = 0.38, zoomTo = 1.84, zoomDuration = 30}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {scale} = useLayout();
  const s = (value: number) => scaleValue(value, scale);
  const inPop = spring({frame, fps, config: {damping: 14, stiffness: 120, mass: 0.7}});
  const zoom = interpolate(frame, [0, zoomDuration], [zoomFrom, zoomTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const frameWidth = s(width);
  const frameHeight = Math.round(frameWidth * 1.78);

  return (
    <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity}}>
      <div
        style={{
          width: frameWidth,
          height: frameHeight,
          borderRadius: s(34),
          padding: s(14),
          background: '#1d2530',
          border: `${Math.max(1, s(2))}px solid #596678`,
          boxShadow: `0 ${s(28)}px ${s(90)}px #000000aa`,
          scale: inPop * zoom,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: s(24),
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <Video src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div
            style={{
              position: 'absolute',
              top: s(9),
              left: '50%',
              width: s(86),
              height: s(20),
              borderRadius: s(16),
              background: '#050608',
              translate: '-50% 0',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: `inset 0 0 ${s(60)}px ${theme.colors.bilibili}22`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
