import React, { useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';

interface BhaktiPlayerProps {
  id: string | number;
  url: string;
  thumbnail: string;
  type: 'video' | 'reel';
}

export const BhaktiPlayer: React.FC<BhaktiPlayerProps> = ({ id, url, thumbnail, type }) => {
  useEffect(() => {
    if (id) {
      fetch(`/api/content/${id}/view`, { method: 'POST' }).catch(console.error);
    }
  }, [id]);

  return (
    <VideoPlayer 
      url={url} 
      thumbnail={thumbnail} 
      className={type === 'reel' ? 'aspect-[9/16]' : 'aspect-video'}
    />
  );
};
