import React from 'react';
import {AbsoluteFill} from 'remotion';

export const CanvasBackground = () => (
  <AbsoluteFill
    style={{
      background: '#0a0d12',
      backgroundImage: 'radial-gradient(circle at 50% 30%, #1b2330 0, #0a0d12 48%)',
    }}
  />
);
