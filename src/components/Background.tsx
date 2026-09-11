import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

export const Background: React.FC<{src?: string; overlay?: boolean}> = ({
  src = 'background-canvas.png',
  overlay = true,
}) => (
  <AbsoluteFill>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    {overlay ? (
      <AbsoluteFill
        style={{background: 'radial-gradient(circle at 50% 30%, #1b2330 0, #0a0d12 55%)', opacity: 0.72}}
      />
    ) : null}
  </AbsoluteFill>
);
