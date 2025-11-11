/**
 * Spotify Service
 * Handles Spotify authentication and API calls
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import type {
  SpotifyAuthTokens,
  SpotifyPlaybackState,
  SpotifyAudioFeatures,
  SpotifyConnectionStatus,
} from '@jdparty/shared';
import { serverConfig } from '../config/index.js';
import type { DB } from '../database/index.js';

export class SpotifyService extends EventEmitter {
  private tokens: SpotifyAuthTokens | null = null;
  private api: AxiosInstance;
  private pollInterval: NodeJS.Timeout | null = null;
  private connected: boolean = false;
  private currentPlaybackState: SpotifyPlaybackState | null = null;
  private db: DB | null = null;

  constructor(db?: DB) {
    super();
    this.db = db || null;

    this.api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 5000,
    });

    // Add request interceptor for auth
    this.api.interceptors.request.use(async (config) => {
      if (this.tokens) {
        // Check if token expired
        if (Date.now() >= this.tokens.expiresAt) {
          await this.refreshAccessToken();
        }

        config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
      }
      return config;
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionStatus(): SpotifyConnectionStatus {
    return {
      connected: this.connected,
      userName: undefined, // TODO: Fetch user profile
      userId: undefined,
    };
  }

  async authenticate(code: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: serverConfig.spotify.redirectUri,
          client_id: serverConfig.spotify.clientId,
          client_secret: serverConfig.spotify.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        tokenType: response.data.token_type,
        scopes: response.data.scope.split(' '),
      };

      // Save tokens to database
      this.saveTokens();

      this.connected = true;
      this.startPolling();
      this.emit('connected');

      console.log('  ✅ Spotify authenticated');
    } catch (error: any) {
      console.error('  ❌ Spotify authentication failed:', error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.tokens) {
      throw new Error('No tokens to refresh');
    }

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refreshToken,
          client_id: serverConfig.spotify.clientId,
          client_secret: serverConfig.spotify.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.tokens.accessToken = response.data.access_token;
      this.tokens.expiresAt = Date.now() + response.data.expires_in * 1000;

      // Save updated tokens
      this.saveTokens();

      console.log('  🔄 Spotify token refreshed');
    } catch (error: any) {
      console.error('  ❌ Failed to refresh Spotify token:', error.message);
      this.connected = false;
      this.stopPolling();
      this.emit('disconnected');
    }
  }

  private startPolling(): void {
    if (this.pollInterval) {
      return;
    }

    // Poll every 2 seconds
    this.pollInterval = setInterval(() => {
      this.pollCurrentPlayback();
    }, 2000);

    console.log('  ▶️  Spotify polling started');
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('  ⏸️  Spotify polling stopped');
    }
  }

  private async pollCurrentPlayback(): Promise<void> {
    try {
      const response = await this.api.get('/me/player/currently-playing');

      if (response.status === 204 || !response.data) {
        // Nothing playing
        if (this.currentPlaybackState?.isPlaying) {
          this.currentPlaybackState = null;
          this.emit('playbackStopped');
        }
        return;
      }

      const item = response.data.item;
      const playbackState: SpotifyPlaybackState = {
        track: {
          id: item.id,
          name: item.name,
          artists: item.artists.map((a: any) => a.name),
          album: item.album.name,
          albumArt: item.album.images[0]?.url || '',
          duration: item.duration_ms,
          uri: item.uri,
        },
        isPlaying: response.data.is_playing,
        position: response.data.progress_ms,
        timestamp: Date.now(),
      };

      const trackChanged =
        !this.currentPlaybackState ||
        this.currentPlaybackState.track?.id !== playbackState.track?.id;

      this.currentPlaybackState = playbackState;

      if (trackChanged && playbackState.track) {
        this.emit('trackChanged', playbackState.track);
        // Fetch audio features for new track
        this.fetchAudioFeatures(playbackState.track.id);
      }

      this.emit('playbackUpdate', playbackState);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, will be refreshed on next request
        return;
      }
      console.error('  ⚠️  Spotify polling error:', error.message);
    }
  }

  async fetchAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
    try {
      console.log(`  🎵 Fetching audio features for track: ${trackId}`);

      // Check cache first
      if (this.db) {
        const cached = this.db.prepare('SELECT * FROM track_bpm_cache WHERE spotify_track_id = ?').get(trackId) as {
          tempo_bpm: number;
          key: string | null;
          mode: string | null;
          time_sig: number | null;
          source: string;
        } | undefined;

        if (cached) {
          console.log(`  💾 Using cached BPM: ${cached.tempo_bpm} (source: ${cached.source})`);

          const audioFeatures: SpotifyAudioFeatures = {
            id: trackId,
            tempo: cached.tempo_bpm,
            timeSignature: cached.time_sig || 4,
            key: this.keyToNumber(cached.key),
            mode: cached.mode === 'minor' ? 0 : 1,
            energy: 0.5,
            danceability: 0.5,
            valence: 0.5,
            loudness: -5,
            acousticness: 0.5,
            instrumentalness: 0.5,
          };

          this.emit('audioFeatures', audioFeatures);
          return audioFeatures;
        }
      }

      // Get track info for GetSongBPM API
      const trackInfo = await this.getTrackInfo(trackId);
      if (!trackInfo) {
        console.log('  ⚠️  Could not get track info');
        return null;
      }

      // Try ReccoBeats API (free, no auth required)
      try {
        const reccoData = await this.fetchFromReccoBeats(trackId);

        if (reccoData) {
          const keyName = this.numberToKey(reccoData.key);
          const modeName = reccoData.mode === 1 ? 'major' : 'minor';

          // Cache the result
          this.cacheBPM(trackId, reccoData.tempo, keyName, modeName, 4, 'reccobeats');

          const audioFeatures: SpotifyAudioFeatures = {
            id: trackId,
            tempo: reccoData.tempo,
            timeSignature: 4,
            key: reccoData.key,
            mode: reccoData.mode,
            energy: reccoData.energy,
            danceability: reccoData.danceability,
            valence: reccoData.valence,
            loudness: reccoData.loudness,
            acousticness: reccoData.acousticness,
            instrumentalness: reccoData.instrumentalness,
          };

          console.log(`  ✅ ReccoBeats: ${audioFeatures.tempo} BPM, Key: ${keyName} ${modeName}, Energy: ${audioFeatures.energy}`);
          this.emit('audioFeatures', audioFeatures);
          return audioFeatures;
        }
      } catch (error: any) {
        console.log('  ⚠️  ReccoBeats failed, trying Spotify API...', error.message);
      }

      // Fallback to Spotify API
      try {
        const response = await this.api.get(`/audio-features/${trackId}`);
        const data = response.data;

        if (data && data.tempo) {
          const keyName = this.numberToKey(data.key);
          const modeName = data.mode === 1 ? 'major' : 'minor';

          // Cache the result
          this.cacheBPM(trackId, data.tempo, keyName, modeName, data.time_signature, 'spotify');

          const audioFeatures: SpotifyAudioFeatures = {
            id: data.id,
            tempo: data.tempo,
            timeSignature: data.time_signature,
            key: data.key,
            mode: data.mode,
            energy: data.energy,
            danceability: data.danceability,
            valence: data.valence,
            loudness: data.loudness,
            acousticness: data.acousticness,
            instrumentalness: data.instrumentalness,
          };

          console.log(`  ✅ Spotify audio features: ${audioFeatures.tempo} BPM`);
          this.emit('audioFeatures', audioFeatures);
          return audioFeatures;
        }
      } catch (error: any) {
        console.log('  ❌ Spotify audio features not available:', error.response?.status);
      }

      return null;
    } catch (error: any) {
      console.error('  ❌ Failed to fetch audio features:', error.message);
      return null;
    }
  }

  private async fetchFromReccoBeats(spotifyTrackId: string): Promise<{
    tempo: number;
    key: number;
    mode: number;
    energy: number;
    danceability: number;
    valence: number;
    loudness: number;
    acousticness: number;
    instrumentalness: number;
  } | null> {
    try {
      const url = `https://api.reccobeats.com/v1/audio-features?ids=${spotifyTrackId}`;

      const response = await axios.get(url, { timeout: 5000 });

      if (response.data?.content && response.data.content.length > 0) {
        const features = response.data.content[0];
        return {
          tempo: features.tempo,
          key: features.key,
          mode: features.mode,
          energy: features.energy,
          danceability: features.danceability,
          valence: features.valence,
          loudness: features.loudness,
          acousticness: features.acousticness,
          instrumentalness: features.instrumentalness,
        };
      }

      return null;
    } catch (error: any) {
      throw error;
    }
  }

  private async getTrackInfo(trackId: string): Promise<{ name: string; artists: string[] } | null> {
    try {
      const response = await this.api.get(`/tracks/${trackId}`);
      return {
        name: response.data.name,
        artists: response.data.artists.map((a: any) => a.name),
      };
    } catch (error) {
      return null;
    }
  }

  private cacheBPM(trackId: string, tempo: number, key: string | null, mode: string | null, timeSig: number | null, source: string): void {
    if (!this.db) return;

    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO track_bpm_cache
        (spotify_track_id, tempo_bpm, key, mode, time_sig, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(trackId, tempo, key, mode, timeSig, source, Date.now());

      console.log(`  💾 Cached BPM for track ${trackId}`);
    } catch (error: any) {
      console.error('  ⚠️  Failed to cache BPM:', error.message);
    }
  }

  private keyToNumber(key: string | null): number {
    if (!key) return 0;
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys.indexOf(key.toUpperCase()) || 0;
  }

  private numberToKey(num: number): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[num] || 'C';
  }

  getCurrentPlayback(): SpotifyPlaybackState | null {
    return this.currentPlaybackState;
  }

  // Playback control
  async play() {
    return this.spotifyRequest('put', '/me/player/play');
  }

  async pause() {
    return this.spotifyRequest('put', '/me/player/pause');
  }

  async next() {
    return this.spotifyRequest('post', '/me/player/next');
  }

  async previous() {
    return this.spotifyRequest('post', '/me/player/previous');
  }

  async seek(position_ms: number) {
    return this.spotifyRequest('put', `/me/player/seek?position_ms=${position_ms}`);
  }

  private async spotifyRequest(method: 'get' | 'post' | 'put', endpoint: string, data?: any) {
    try {
      const response = await this.api[method](endpoint, data);
      // Force a poll to get immediate feedback
      setTimeout(() => this.pollCurrentPlayback(), 100);
      return response.status;
    } catch (error: any) {
      console.error(`  ⚠️  Spotify ${method} ${endpoint} failed:`, error.message);
      // Don't throw here, just log the error
      return error.response?.status;
    }
  }

  disconnect(): void {
    this.stopPolling();
    this.tokens = null;
    this.connected = false;
    this.currentPlaybackState = null;
    this.emit('disconnected');
    console.log('  👋 Spotify disconnected');
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: serverConfig.spotify.clientId,
      response_type: 'code',
      redirect_uri: serverConfig.spotify.redirectUri,
      scope: serverConfig.spotify.scopes.join(' '),
      show_dialog: 'true',
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  private saveTokens(): void {
    if (!this.db || !this.tokens) return;

    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('spotify_tokens', JSON.stringify(this.tokens), Date.now());

      console.log('  💾 Spotify tokens saved to database');
    } catch (error: any) {
      console.error('  ⚠️  Failed to save tokens:', error.message);
    }
  }

  loadTokens(): void {
    if (!this.db) return;

    try {
      const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('spotify_tokens') as { value: string } | undefined;

      if (row) {
        this.tokens = JSON.parse(row.value);
        this.connected = true;
        this.startPolling();
        this.emit('connected');
        console.log('  ✅ Spotify tokens loaded from database');
      }
    } catch (error: any) {
      console.error('  ⚠️  Failed to load tokens:', error.message);
    }
  }
}
