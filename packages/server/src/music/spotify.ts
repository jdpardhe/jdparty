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

      // Try the audio-features endpoint first
      try {
        const response = await this.api.get(`/audio-features/${trackId}`);
        const data = response.data;

        if (!data || !data.tempo) {
          console.log('  ⚠️  No audio features available for this track');
          return null;
        }

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

        console.log(`  ✅ Audio features: ${audioFeatures.tempo} BPM, Energy: ${audioFeatures.energy}`);
        this.emit('audioFeatures', audioFeatures);
        return audioFeatures;
      } catch (audioFeaturesError: any) {
        // If audio-features endpoint fails with 403, try audio-analysis endpoint
        if (audioFeaturesError.response?.status === 403) {
          console.log('  ⚠️  Audio features endpoint restricted, trying audio-analysis...');

          try {
            const analysisResponse = await this.api.get(`/audio-analysis/${trackId}`);
            const analysis = analysisResponse.data;

            if (analysis?.track?.tempo) {
              const audioFeatures: SpotifyAudioFeatures = {
                id: trackId,
                tempo: analysis.track.tempo,
                timeSignature: analysis.track.time_signature || 4,
                key: analysis.track.key || 0,
                mode: analysis.track.mode || 1,
                energy: analysis.track.loudness ? Math.max(0, Math.min(1, (analysis.track.loudness + 60) / 60)) : 0.5,
                danceability: 0.5,
                valence: 0.5,
                loudness: analysis.track.loudness || -5,
                acousticness: 0.5,
                instrumentalness: 0.5,
              };

              console.log(`  ✅ Audio analysis: ${audioFeatures.tempo} BPM`);
              this.emit('audioFeatures', audioFeatures);
              return audioFeatures;
            }
          } catch (analysisError: any) {
            console.error('  ❌ Audio analysis also failed:', analysisError.response?.status, analysisError.response?.data || analysisError.message);
          }
        }

        throw audioFeaturesError;
      }
    } catch (error: any) {
      console.error('  ❌ Failed to fetch audio features:', error.response?.status, error.response?.data || error.message);
      return null;
    }
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
