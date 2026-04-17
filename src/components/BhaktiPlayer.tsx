import React, { useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';

interface BhaktiPlayerProps {
  id: string | number;
  url: string;
  thumbnail: string;
  type: 'video' | 'reel';
  authorName?: string;
  autoPlay?: boolean;
}

export const BhaktiPlayer: React.FC<BhaktiPlayerProps> = ({ id, url, thumbnail, type, authorName, autoPlay }) => {
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
      type={type}
      authorName={authorName}
      autoPlay={autoPlay}
    />
  );
};
