/**
 * Music Integration Types
 * Types for Spotify and music analysis
 */

import type { BPM } from './scene';

/** Spotify track information */
export interface SpotifyTrack {
  /** Track ID */
  id: string;
  /** Track name */
  name: string;
  /** Artist names */
  artists: string[];
  /** Album name */
  album: string;
  /** Album artwork URL */
  albumArt: string;
  /** Track duration (ms) */
  duration: number;
  /** Track URI */
  uri: string;
}

/** Spotify playback state */
export interface SpotifyPlaybackState {
  /** Currently playing track */
  track: SpotifyTrack | null;
  /** Is playing */
  isPlaying: boolean;
  /** Current position (ms) */
  position: number;
  /** Timestamp of state */
  timestamp: number;
}

/** Spotify audio features */
export interface SpotifyAudioFeatures {
  /** Track ID */
  id: string;
  /** Tempo in BPM */
  tempo: BPM;
  /** Time signature (3, 4, 5, etc.) */
  timeSignature: number;
  /** Key (0 = C, 1 = C#, etc.) */
  key: number;
  /** Mode (0 = minor, 1 = major) */
  mode: number;
  /** Energy level (0-1) */
  energy: number;
  /** Danceability (0-1) */
  danceability: number;
  /** Valence/mood (0-1) */
  valence: number;
  /** Loudness (dB) */
  loudness: number;
  /** Acousticness (0-1) */
  acousticness: number;
  /** Instrumentalness (0-1) */
  instrumentalness: number;
}

/** Beat clock information */
export interface BeatClock {
  /** Current BPM */
  bpm: BPM;
  /** Current beat number */
  beatNumber: number;
  /** Time to next beat (ms) */
  timeToNextBeat: number;
  /** Is on beat (within threshold) */
  isOnBeat: boolean;
  /** Current phase (0-1 within beat) */
  phase: number;
  /** Beat subdivision being used */
  subdivision: number;
}

/** Music playback source */
export enum MusicSource {
  SPOTIFY = 'spotify',
  MANUAL = 'manual',
  LOCAL = 'local',
}

/** Now playing information */
export interface NowPlaying {
  /** Music source */
  source: MusicSource;
  /** Track info */
  track: SpotifyTrack | null;
  /** Audio features */
  audioFeatures: SpotifyAudioFeatures | null;
  /** Beat clock */
  beatClock: BeatClock;
  /** Is playing */
  isPlaying: boolean;
  /** Playback position (ms) */
  position: number;
}

/** Spotify authentication tokens */
export interface SpotifyAuthTokens {
  /** Access token */
  accessToken: string;
  /** Refresh token */
  refreshToken: string;
  /** Token expiry timestamp */
  expiresAt: number;
  /** Token type (usually "Bearer") */
  tokenType: string;
  /** Granted scopes */
  scopes: string[];
}

/** Spotify connection status */
export interface SpotifyConnectionStatus {
  /** Is connected */
  connected: boolean;
  /** User display name */
  userName?: string;
  /** User ID */
  userId?: string;
  /** Last error */
  error?: string;
}

/** BPM detection source */
export enum BPMSource {
  SPOTIFY = 'spotify',
  MANUAL = 'manual',
  TAP_TEMPO = 'tap-tempo',
  ANALYSIS = 'analysis',
}

/** BPM information with confidence */
export interface BPMInfo {
  /** BPM value */
  bpm: BPM;
  /** Detection source */
  source: BPMSource;
  /** Confidence (0-1) */
  confidence: number;
  /** Is manually adjusted */
  isManuallyAdjusted: boolean;
}
