import {useVideoConfig} from 'remotion';
import {theme} from './theme';

export const useLayout = () => {
  const {width, height, fps} = useVideoConfig();
  const scale = Math.min(width / theme.video.width, height / theme.video.height);
  return {width, height, fps, scale};
};

export const scaleValue = (value: number, scale: number) => Math.round(value * scale);
