import React from 'react';
import {episodes} from '../../episodes/registry';
import {Episode} from './Episode';

export const EpisodeComposition: React.FC<{episodeId: string}> = ({episodeId}) => {
  const episode = episodes.find((entry) => entry.id === episodeId);
  if (!episode) return null;
  return <Episode episode={episode} />;
};
