/**
 * WebSocket Server
 * Real-time communication with clients
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { DMXEngine } from '../dmx/engine.js';
import type { SpotifyService } from '../music/spotify.js';
import type { BeatClock } from '../music/beat-clock.js';
import type { SceneManager } from '../scenes/manager.js';
import type { FixtureManager } from '../fixtures/manager.js';
import {
  WSMessageType,
  type WSMessage,
  type SubscribeChannelsPayload,
  type ControlFixturePayload,
  type TriggerScenePayload,
} from '@jdparty/shared';

interface Services {
  dmxEngine: DMXEngine;
  spotifyService: SpotifyService;
  beatClock: BeatClock;
  sceneManager: SceneManager;
  fixtureManager: FixtureManager;
}

export function setupWebSocket(io: SocketIOServer, services: Services): void {
  const { dmxEngine, spotifyService, beatClock, sceneManager, fixtureManager } = services;

  io.on('connection', (socket: Socket) => {
    console.log(`  🔌 Client connected: ${socket.id}`);

    // Handle client subscription to channel updates
    socket.on(WSMessageType.SUBSCRIBE_CHANNELS, (payload: SubscribeChannelsPayload) => {
      socket.join('channels');
      console.log(`  👂 Client ${socket.id} subscribed to channels`);
    });

    // Handle client subscription to beat updates
    socket.on(WSMessageType.SUBSCRIBE_BEATS, () => {
      socket.join('beats');
      console.log(`  👂 Client ${socket.id} subscribed to beats`);
      console.log(`  ⏰ Beat clock is running: ${beatClock.getRunning()}, BPM: ${beatClock.getBPM()}`);
    });

    // Handle client subscription to fixture updates
    socket.on(WSMessageType.SUBSCRIBE_FIXTURES, () => {
      socket.join('fixtures');
      console.log(`  👂 Client ${socket.id} subscribed to fixtures`);
    });

    // Handle fixture control from client
    socket.on(WSMessageType.CONTROL_FIXTURE, async (payload: ControlFixturePayload) => {
      try {
        fixtureManager.updateFixtureValues(payload.fixtureId, payload.channelValues);
      } catch (error: any) {
        console.error('  ❌ Fixture control error:', error.message);
      }
    });

    // Handle scene trigger from client
    socket.on(WSMessageType.TRIGGER_SCENE, async (payload: TriggerScenePayload) => {
      try {
        await sceneManager.triggerScene(payload.sceneId, payload.fadeTime);
      } catch (error: any) {
        console.error('  ❌ Scene trigger error:', error.message);
      }
    });

    // Handle ping/pong
    socket.on(WSMessageType.PING, () => {
      socket.emit(WSMessageType.PONG, { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      console.log(`  🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Broadcast beat clock updates
  beatClock.on('beat', (info) => {
    const payload = {
      beatNumber: info.beatNumber,
      bpm: info.bpm,
      phase: info.phase,
    };
    console.log(`  🥁 Broadcasting beat ${info.beatNumber} to ${io.sockets.adapter.rooms.get('beats')?.size || 0} clients`);
    io.to('beats').emit(WSMessageType.BEAT_TICK, payload);
  });

  // Broadcast now playing updates
  spotifyService.on('playbackUpdate', (playback) => {
    io.emit(WSMessageType.NOW_PLAYING_UPDATE, {
      nowPlaying: {
        source: 'spotify',
        track: playback.track,
        audioFeatures: null,
        beatClock: beatClock.getInfo(),
        isPlaying: playback.isPlaying,
        position: playback.position,
      },
    });
  });

  // Broadcast scene changes
  sceneManager.on('sceneTriggered', ({ sceneId, sceneName }) => {
    io.emit(WSMessageType.SCENE_CHANGED, {
      sceneId,
      sceneName,
    });
  });

  // Broadcast fixture events
  fixtureManager.on('fixturePatched', (fixture) => {
    io.to('fixtures').emit(WSMessageType.FIXTURE_PATCHED, {
      fixture,
    });
  });

  fixtureManager.on('fixtureUnpatched', (fixtureId) => {
    io.to('fixtures').emit(WSMessageType.FIXTURE_UNPATCHED, {
      fixtureId,
    });
  });

  fixtureManager.on('fixtureValuesUpdated', ({ id, values }) => {
    io.to('fixtures').emit(WSMessageType.FIXTURE_VALUES_CHANGED, {
      fixtureId: id,
      values,
    });
  });

  // Broadcast system status periodically
  setInterval(() => {
    io.emit(WSMessageType.SYSTEM_STATUS, {
      status: {
        version: '1.0.0',
        uptime: process.uptime(),
        dmxActive: dmxEngine.isActive(),
        dmxInterfaces: dmxEngine.getInterfaceStatus(),
        spotifyConnected: spotifyService.isConnected(),
        connectedClients: io.engine.clientsCount,
        autoModeEnabled: sceneManager.isAutoModeEnabled(),
        blackoutActive: false,
      },
    });
  }, 5000); // Every 5 seconds

  // Auto mode: Select scenes based on BPM
  spotifyService.on('audioFeatures', (features) => {
    if (!sceneManager.isAutoModeEnabled()) {
      return;
    }

    const scene = sceneManager.selectSceneForBPM(features.tempo, features.energy);

    if (scene) {
      console.log(`  🤖 Auto-selecting scene: ${scene.name} (BPM: ${features.tempo})`);
      sceneManager.triggerScene(scene.id, 2); // 2 second fade
    }
  });

  // Start beat clock when track changes
  spotifyService.on('audioFeatures', (features) => {
    if (beatClock.getBPM() !== features.tempo) {
      beatClock.start(features.tempo);
    }
  });

  // Stop beat clock when playback stops
  spotifyService.on('playbackStopped', () => {
    beatClock.stop();
  });

  console.log('  ✅ WebSocket server configured');
}
