import { useStore } from '../store';
import { api } from '../services/api';
import { useEffect, useState } from 'react';

// Helper to format time from ms to mm:ss
function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

// SVG Icons
const PlayIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
  </svg>
);

const SkipBackIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
  </svg>
);

const SkipForwardIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6h2v12h-2zm-11 6l8.5 6V6z"/>
  </svg>
);

export function NowPlaying() {
  const nowPlaying = useStore((state) => state.nowPlaying);
  const beatNumber = useStore((state) => state.nowPlaying?.beatClock.beatNumber ?? 0);

  const [currentPosition, setCurrentPosition] = useState(nowPlaying?.position || 0);
  const [isSeeking, setIsSeeking] = useState(false);

  const currentBeat = (beatNumber % 4) + 1;

  // Debug logging
  useEffect(() => {
    console.log('Beat number changed:', beatNumber, 'Current beat:', currentBeat);
  }, [beatNumber, currentBeat]);

  useEffect(() => {
    if (nowPlaying?.isPlaying && !isSeeking) {
      const interval = setInterval(() => {
        setCurrentPosition((pos) => pos + 1000);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [nowPlaying?.isPlaying, isSeeking]);

  useEffect(() => {
    if (nowPlaying?.position !== undefined) {
      setCurrentPosition(nowPlaying.position);
    }
  }, [nowPlaying?.position]);


  if (!nowPlaying || !nowPlaying.track) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
        No music playing
      </div>
    );
  }

  const { track, isPlaying, beatClock } = nowPlaying;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value, 10);
    setCurrentPosition(newPosition);
  };

  const handleSeekEnd = () => {
    api.spotifySeek(currentPosition);
    setIsSeeking(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg p-4 text-white flex flex-col space-y-3">
      {/* Top section: Album art and track info */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <img
            src={track.albumArt}
            alt={track.album}
            className="w-16 h-16 rounded-lg shadow-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-md truncate">{track.name}</h3>
          <p className="text-primary-100 text-sm truncate">{track.artists.join(', ')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-medium opacity-80">BPM</span>
            <span className="text-lg font-bold">{Math.round(beatClock.bpm)}</span>
          </div>
          <div className="flex space-x-1.5 items-center">
            {[1, 2, 3, 4].map((beat) => (
              <div
                key={beat}
                className={clsx(
                  'w-2 rounded-full transition-all duration-100',
                  currentBeat === beat
                    ? 'h-7 bg-white shadow-lg shadow-white/50'
                    : 'h-5 bg-white/30'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => api.spotifyPrevious()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all active:scale-95"
          aria-label="Previous track"
        >
          <SkipBackIcon />
        </button>
        <button
          onClick={() => (isPlaying ? api.spotifyPause() : api.spotifyPlay())}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-primary-700 hover:bg-white/90 hover:scale-105 transition-all shadow-lg active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={() => api.spotifyNext()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all active:scale-95"
          aria-label="Next track"
        >
          <SkipForwardIcon />
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={track.duration}
          value={currentPosition}
          onMouseDown={() => setIsSeeking(true)}
          onChange={handleSeek}
          onMouseUp={handleSeekEnd}
          className="w-full h-1 bg-primary-300/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
        <div className="flex justify-between text-xs text-primary-200">
          <span>{formatTime(currentPosition)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>
    </div>
  );
}

function clsx(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
