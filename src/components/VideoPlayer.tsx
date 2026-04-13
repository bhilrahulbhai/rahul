import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Loader2,
  RotateCcw,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  url: string;
  thumbnail: string;
  className?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  url, 
  thumbnail, 
  className,
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  useEffect(() => {
    if (autoPlay && !isYouTube) {
      handleStart();
    }
  }, [autoPlay]);

  const handleStart = () => {
    setIsStarted(true);
    setIsPlaying(true);
    if (isYouTube) {
      setIsLoading(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    if (videoRef.current) {
      const newTime = (newProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // YouTube specific URL formatting
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&controls=1`;
  };

  if (!isStarted) {
    return (
      <div 
        className={cn("relative w-full h-full cursor-pointer group overflow-hidden bg-black", className)}
        onClick={handleStart}
      >
        <img 
          src={thumbnail} 
          alt="Thumbnail" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-bhakti-accent flex items-center justify-center shadow-2xl shadow-bhakti-accent/40 transform transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full h-full bg-black group overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-bhakti-accent" />
        </div>
      )}

      {isYouTube ? (
        <iframe
          src={getYouTubeEmbedUrl(url)}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            autoPlay={autoPlay}
          />

          {/* Custom Controls */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-opacity duration-300 z-10",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            {/* Progress Bar */}
            <div className="group/progress relative w-full h-1.5 mb-4 cursor-pointer">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              />
              <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-bhakti-accent transition-all duration-100 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white fill-current" />
                  ) : (
                    <Play className="w-6 h-6 text-white fill-current" />
                  )}
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-bhakti-accent h-1"
                  />
                </div>

                <div className="text-xs font-medium text-white/80 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
