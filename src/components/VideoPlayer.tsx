import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Loader2,
  Settings,
  Check,
  ChevronRight,
  Subtitles,
  Zap,
  RotateCcw,
  PictureInPicture,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  url: string;
  thumbnail: string;
  className?: string;
  autoPlay?: boolean;
  type?: string;
  authorName?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  url, 
  thumbnail, 
  className,
  autoPlay = false,
  type = 'video',
  authorName
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'speed' | 'quality'>('main');
  const [isLooping, setIsLooping] = useState(type === 'reel');
  const [quality, setQuality] = useState('Auto');
  const [showCaptions, setShowCaptions] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Unmute if user interacts
  useEffect(() => {
    if (isPlaying && !hasInteracted) {
      // Default to unmuted once playback starts via user action
      setIsMuted(false);
      setVolume(1.0);
      setHasInteracted(true);
    }
  }, [isPlaying, hasInteracted]);
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const Player = ReactPlayer as any;

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  useEffect(() => {
    if (autoPlay) {
      setIsStarted(true);
      setIsPlaying(true);
    }
  }, [autoPlay]);

  const handleStart = () => {
    setIsStarted(true);
    setIsPlaying(true);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    setProgress(state.played * 100);
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (d: number) => {
    setDuration(d);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    playerRef.current?.seekTo(newProgress / 100, 'fraction');
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      if (isPlaying && !showSettings) {
        setShowControls(false);
      }
    }, 3000);
  };

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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
      onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
      onClick={() => setShowSettings(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-bhakti-accent" />
        </div>
      )}

      <Player
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={isPlaying}
        volume={volume}
        muted={isMuted}
        playbackRate={playbackRate}
        loop={isLooping}
        onProgress={handleProgress as any}
        onDuration={handleDuration}
        onBuffer={() => setIsLoading(true)}
        onBufferEnd={() => setIsLoading(false)}
        onReady={() => setIsLoading(false)}
        onStart={() => setIsLoading(false)}
        onPlay={() => setIsLoading(false)}
        onError={() => {
          console.error("Video playback error");
          setIsLoading(false);
        }}
        onEnded={() => !isLooping && setIsPlaying(false)}
        config={{
          youtube: {
            rel: 0,
            iv_load_policy: showCaptions ? 1 : 3,
            cc_load_policy: showCaptions ? 1 : 0
          }
        }}
        style={{ pointerEvents: 'none' }}
      />

      {/* Overlay for clicks and double-clicks */}
      <div className="absolute inset-0 z-0 flex" onClick={togglePlay}>
        <div 
          className="flex-1 h-full" 
          onDoubleClick={(e) => {
            e.stopPropagation();
            playerRef.current?.seekTo(currentTime - 10, 'seconds');
          }}
        />
        <div 
          className="flex-1 h-full" 
          onDoubleClick={(e) => {
            e.stopPropagation();
            playerRef.current?.seekTo(currentTime + 10, 'seconds');
          }}
        />
      </div>

      {type === 'reel' && (
        <div className="absolute inset-x-0 bottom-0 p-4 pb-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bhakti-accent flex items-center justify-center font-bold border-2 border-white/20">
              {authorName?.[0]?.toUpperCase() || 'B'}
            </div>
            <div>
              <p className="text-white font-bold text-sm">@{authorName || 'BhaktiSagar'}</p>
              <button className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80 mt-1 border border-white/10">Follow</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 transition-opacity duration-300 z-10",
        showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Progress Bar */}
        <div className="group/progress relative w-full h-1.5 mb-4 cursor-pointer">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
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

          <div className="flex items-center gap-2 relative">
            {/* Settings Menu */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 w-64 bg-bhakti-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeMenu === 'main' && (
                    <div className="p-2">
                      <button 
                        onClick={() => setActiveMenu('speed')}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-bhakti-accent" />
                          <span>Playback Speed</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <span>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveMenu('quality')}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Maximize className="w-4 h-4 text-bhakti-accent" />
                          <span>Quality</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <span>{quality}</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                      <button 
                        onClick={() => setShowCaptions(!showCaptions)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Subtitles className="w-4 h-4 text-bhakti-accent" />
                          <span>Captions</span>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          showCaptions ? "bg-bhakti-accent text-white" : "bg-white/10 text-gray-400"
                        )}>
                          {showCaptions ? 'On' : 'Off'}
                        </div>
                      </button>
                      <button 
                        onClick={() => setIsLooping(!isLooping)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Repeat className="w-4 h-4 text-bhakti-accent" />
                          <span>Loop</span>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          isLooping ? "bg-bhakti-accent text-white" : "bg-white/10 text-gray-400"
                        )}>
                          {isLooping ? 'On' : 'Off'}
                        </div>
                      </button>
                    </div>
                  )}

                  {activeMenu === 'speed' && (
                    <div className="p-2">
                      <button 
                        onClick={() => setActiveMenu('main')}
                        className="w-full flex items-center gap-3 p-3 border-b border-white/5 mb-1 hover:bg-white/5 rounded-t-xl transition-colors text-sm font-bold text-left"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Playback Speed
                      </button>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {playbackRates.map((rate) => (
                          <button 
                            key={rate}
                            onClick={() => {
                              setPlaybackRate(rate);
                              setActiveMenu('main');
                              setShowSettings(false);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-sm text-left"
                          >
                            <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                            {playbackRate === rate && <Check className="w-4 h-4 text-bhakti-accent" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeMenu === 'quality' && (
                    <div className="p-2">
                      <button 
                        onClick={() => setActiveMenu('main')}
                        className="w-full flex items-center gap-3 p-3 border-b border-white/5 mb-1 hover:bg-white/5 rounded-t-xl transition-colors text-sm font-bold text-left"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Quality
                      </button>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {['Auto', '1080p', '720p', '480p', '360p'].map((q) => (
                          <button 
                            key={q}
                            onClick={() => {
                              setQuality(q);
                              setActiveMenu('main');
                              setShowSettings(false);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-sm text-left"
                          >
                            <span>{q}</span>
                            {quality === q && <Check className="w-4 h-4 text-bhakti-accent" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (document.pictureInPictureElement) {
                  document.exitPictureInPicture();
                } else {
                  // For ReactPlayer, we might need to find the internal video element
                  const internalPlayer = playerRef.current?.getInternalPlayer();
                  if (internalPlayer && internalPlayer.requestPictureInPicture) {
                    internalPlayer.requestPictureInPicture();
                  }
                }
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-5 h-5 text-white" />
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
                setActiveMenu('main');
              }}
              className={cn(
                "p-2 hover:bg-white/10 rounded-full transition-all",
                showSettings && "bg-white/10 rotate-90"
              )}
            >
              <Settings className="w-5 h-5 text-white" />
            </button>

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
    </div>
  );
};
