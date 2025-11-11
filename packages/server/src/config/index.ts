/**
 * Server Configuration
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config();

export const serverConfig = {
  // Server
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Spotify
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8080/api/spotify/callback',
    scopes: [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
    ],
  },

  // DMX
  dmx: {
    frameRate: parseInt(process.env.DMX_FRAME_RATE || '44', 10),
    interface: process.env.DMX_INTERFACE || 'usb',
  },

  // Database
  database: {
    path: resolve(process.env.DATABASE_PATH || './data/jdparty.db'),
  },

  // API
  api: {
    tokenSecret: process.env.API_TOKEN_SECRET || 'dev-secret-change-in-production',
  },
} as const;

// Validate required config
export function validateConfig(): void {
  if (!serverConfig.spotify.clientId) {
    console.warn('⚠️  SPOTIFY_CLIENT_ID not set - Spotify integration will be disabled');
  }
  if (!serverConfig.spotify.clientSecret) {
    console.warn('⚠️  SPOTIFY_CLIENT_SECRET not set - Spotify integration will be disabled');
  }
}
