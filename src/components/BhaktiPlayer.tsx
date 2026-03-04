import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface BhaktiPlayerProps {
  url: string;
  thumbnail: string;
  type: 'video' | 'reel';
}

export const BhaktiPlayer: React.FC<BhaktiPlayerProps> = ({ url, thumbnail, type }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const handlePlay = () => {
    setIsPlaying(true);
    if (isYouTube) {
      setIsLoading(true);
    }
  };

  if (!isPlaying) {
    return (
      <div 
        className="relative w-full h-full cursor-pointer group"
        onClick={handlePlay}
      >
        <img 
          src={thumbnail} 
          alt="Thumbnail" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-bhakti-accent flex items-center justify-center shadow-2xl shadow-bhakti-accent/40 transform transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>
        {/* Native Label to make it look uploaded */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-bhakti-accent animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">BhaktiSagar Native</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-bhakti-bg">
          <Loader2 className="w-8 h-8 animate-spin text-bhakti-accent" />
        </div>
      )}
      
      {isYouTube ? (
        <div className="w-full h-full overflow-hidden relative">
          {/* 
            Hiding YouTube Logo Hack: 
            We make the iframe slightly larger (110%) and center it to crop the edges 
            where logos usually appear.
          */}
          <iframe
            src={`${url}${url.includes('?') ? '&' : '?'}autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&controls=1&disablekb=1`}
            className="absolute top-[-5%] left-[-5%] w-[110%] h-[110%]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
          {/* Overlay to block top-right YouTube buttons if needed, but we want controls */}
        </div>
      ) : (
        <video 
          src={url} 
          controls 
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
};
