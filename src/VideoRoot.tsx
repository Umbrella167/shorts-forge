import React from 'react';
import {Composition} from 'remotion';
import {CanvasBackground} from './CanvasBackground';
import {EpisodeComposition} from './components/EpisodeComposition';
import {manifestFrames} from './lib/duration';
import {episodes} from '../episodes/registry';

export const VideoRoot = () => (
  <>
    <Composition
      id="CanvasBackground"
      component={CanvasBackground}
      durationInFrames={1}
      fps={30}
      width={720}
      height={1280}
      defaultProps={{}}
    />
    {episodes.map((episode) => (
      <Composition
        key={episode.id}
        id={episode.id}
        component={EpisodeComposition}
        defaultProps={{episodeId: episode.id}}
        durationInFrames={manifestFrames(episode.manifest.items, episode.fps, episode.tail)}
        fps={episode.fps}
        width={episode.width}
        height={episode.height}
      />
    ))}
  </>
);
