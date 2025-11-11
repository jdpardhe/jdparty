/**
 * WebSocket Service
 * Real-time communication with server
 */

import { io, type Socket } from 'socket.io-client';
import type {
  NowPlayingUpdatePayload,
  SceneChangedPayload,
  BeatTickPayload,
  SystemStatusPayload,
  FixturePatchedPayload,
  FixtureUnpatchedPayload,
  FixtureValuesChangedPayload,
} from '@jdparty/shared';

type EventHandler = (...args: any[]) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  connect(serverUrl: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });

    // Listen to server events
    this.socket.on('now_playing_update', (payload: NowPlayingUpdatePayload) => {
      this.emit('nowPlayingUpdate', payload.nowPlaying);
    });

    this.socket.on('scene_changed', (payload: SceneChangedPayload) => {
      this.emit('sceneChanged', payload);
    });

    this.socket.on('beat_tick', (payload: BeatTickPayload) => {
      this.emit('beatTick', payload);
    });

    this.socket.on('system_status', (payload: SystemStatusPayload) => {
      this.emit('systemStatus', payload.status);
    });

    this.socket.on('fixture_patched', (payload: FixturePatchedPayload) => {
      this.emit('fixturePatched', payload.fixture);
    });

    this.socket.on('fixture_unpatched', (payload: FixtureUnpatchedPayload) => {
      this.emit('fixtureUnpatched', payload.fixtureId);
    });

    this.socket.on('fixture_values_changed', (payload: FixtureValuesChangedPayload) => {
      this.emit('fixtureValuesChanged', payload);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }

  // Client -> Server messages
  subscribeToBeats(): void {
    console.log('📡 Subscribing to beats...');
    this.socket?.emit('subscribe_beats');
  }

  subscribeToChannels(fixtureIds: string[]): void {
    this.socket?.emit('subscribe_channels', { fixtureIds });
  }

  subscribeToFixtures(): void {
    this.socket?.emit('subscribe_fixtures');
  }

  triggerScene(sceneId: string, fadeTime?: number): void {
    this.socket?.emit('trigger_scene', { sceneId, fadeTime });
  }
}

export const websocket = new WebSocketService();
