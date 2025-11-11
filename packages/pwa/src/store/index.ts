/**
 * Global State Store
 * Zustand store for app state
 */

import { create } from 'zustand';
import type { Scene, NowPlaying, SystemStatus, BeatTickPayload } from '@jdparty/shared';
import { api } from '../services/api';
import { websocket } from '../services/websocket';
import { persist } from './persist';

interface AppState {
  // Connection
  serverUrl: string | null;
  connected: boolean;

  // System
  systemStatus: SystemStatus | null;

  // Music
  nowPlaying: NowPlaying | null;

  // Scenes
  scenes: Scene[];
  currentSceneId: string | null;

  // UI state
  isBlackout: boolean;
  masterDimmer: number;

  // Actions
  setServerUrl: (url: string) => void;
  connect: () => void;
  disconnect: () => void;
  loadScenes: () => Promise<void>;
  triggerScene: (sceneId: string, fadeTime?: number) => Promise<void>;
  toggleBlackout: () => Promise<void>;
  setMasterDimmer: (level: number) => void;
  enableAutoMode: () => Promise<void>;
  disableAutoMode: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      serverUrl: null,
      connected: false,
      systemStatus: null,
      nowPlaying: null,
      scenes: [],
      currentSceneId: null,
      isBlackout: false,
      masterDimmer: 1.0,

      // Actions
      setServerUrl: (url) => {
        set({ serverUrl: url });
      },

      connect: async () => {
        const { serverUrl } = get();
        if (!serverUrl) return;

        try {
          // Initialize API client
          api.initialize(serverUrl);

          // Connect WebSocket
          websocket.connect(serverUrl);

          // Set up WebSocket event handlers
          websocket.on('connected', () => {
            set({ connected: true });
            websocket.subscribeToBeats();
          });

          websocket.on('disconnected', () => {
            set({ connected: false });
          });

          websocket.on('nowPlayingUpdate', (nowPlaying: NowPlaying) => {
            set({ nowPlaying });
          });

          websocket.on('beatTick', (beatInfo: BeatTickPayload) => {
            console.log('Received beatTick:', beatInfo);
            const { nowPlaying } = get();
            if (nowPlaying) {
              set({
                nowPlaying: {
                  ...nowPlaying,
                  beatClock: {
                    ...nowPlaying.beatClock,
                    ...beatInfo,
                  },
                },
              });
              console.log('Updated nowPlaying.beatClock:', get().nowPlaying?.beatClock);
            } else {
              console.log('No nowPlaying to update');
            }
          });

          websocket.on('sceneChanged', ({ sceneId }: { sceneId: string }) => {
            set({ currentSceneId: sceneId });
          });

          websocket.on('systemStatus', (systemStatus: SystemStatus) => {
            set({ systemStatus, isBlackout: systemStatus.blackoutActive });
          });

          // Load initial data
          const [scenes, status] = await Promise.all([
            api.getScenes(),
            api.getStatus(),
          ]);

          set({ scenes, systemStatus: status });

          console.log('✅ Connected to server');
        } catch (error) {
          console.error('Failed to connect:', error);
          set({ connected: false });
        }
      },

      disconnect: () => {
        websocket.disconnect();
        set({ connected: false });
      },

      loadScenes: async () => {
        try {
          const scenes = await api.getScenes();
          set({ scenes });
        } catch (error) {
          console.error('Failed to load scenes:', error);
        }
      },

      triggerScene: async (sceneId, fadeTime = 0) => {
        try {
          await api.triggerScene(sceneId, fadeTime);
          set({ currentSceneId: sceneId });
        } catch (error) {
          console.error('Failed to trigger scene:', error);
        }
      },

      toggleBlackout: async () => {
        try {
          await api.blackout();
          set({ isBlackout: !get().isBlackout });
        } catch (error) {
          console.error('Failed to toggle blackout:', error);
        }
      },

      setMasterDimmer: (level) => {
        set({ masterDimmer: level });
        // TODO: Send to server
      },

      enableAutoMode: async () => {
        try {
          await api.enableAutoMode();
        } catch (error) {
          console.error('Failed to enable auto mode:', error);
        }
      },

      disableAutoMode: async () => {
        try {
          await api.disableAutoMode();
        } catch (error) {
          console.error('Failed to disable auto mode:', error);
        }
      },
    }),
    {
      name: 'jdparty-storage',
      partialize: (state) => ({
        serverUrl: state.serverUrl,
      }),
    }
  )
);
