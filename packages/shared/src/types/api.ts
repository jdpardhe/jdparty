/**
 * API Types
 * REST API and WebSocket message types
 */

import type { Scene, SceneId } from './scene';
import type { PatchedFixture, FixtureProfile, Universe, DMXInterfaceStatus } from './dmx';
import type { NowPlaying, SpotifyConnectionStatus } from './music';

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

/** System health status */
export interface SystemStatus {
  /** App version */
  version: string;
  /** Server uptime (ms) */
  uptime: number;
  /** Is DMX engine running */
  dmxActive: boolean;
  /** Connected DMX interfaces */
  dmxInterfaces: DMXInterfaceStatus[];
  /** Is Spotify connected */
  spotifyConnected: boolean;
  /** Number of connected clients */
  connectedClients: number;
  /** Is auto mode enabled */
  autoModeEnabled: boolean;
  /** Is blackout active */
  blackoutActive: boolean;
}

/** WebSocket message types */
export enum WSMessageType {
  // Client -> Server
  SUBSCRIBE_CHANNELS = 'subscribe_channels',
  SUBSCRIBE_BEATS = 'subscribe_beats',
  SUBSCRIBE_FIXTURES = 'subscribe_fixtures',
  CONTROL_FIXTURE = 'control_fixture',
  TRIGGER_SCENE = 'trigger_scene',

  // Server -> Client
  CHANNEL_UPDATE = 'channel_update',
  BEAT_TICK = 'beat_tick',
  SCENE_CHANGED = 'scene_changed',
  NOW_PLAYING_UPDATE = 'now_playing_update',
  SYSTEM_STATUS = 'system_status',
  FIXTURE_PATCHED = 'fixture_patched',
  FIXTURE_UNPATCHED = 'fixture_unpatched',
  FIXTURE_VALUES_CHANGED = 'fixture_values_changed',

  // Bidirectional
  PING = 'ping',
  PONG = 'pong',
}

/** Base WebSocket message */
export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

/** WebSocket message payloads */

export interface SubscribeChannelsPayload {
  fixtureIds: string[];
}

export interface ControlFixturePayload {
  fixtureId: string;
  channelValues: number[];
}

export interface TriggerScenePayload {
  sceneId: SceneId;
  fadeTime?: number;
}

export interface ChannelUpdatePayload {
  fixtureId: string;
  values: number[];
}

export interface BeatTickPayload {
  beatNumber: number;
  bpm: number;
  phase: number;
}

export interface SceneChangedPayload {
  sceneId: SceneId;
  sceneName: string;
}

export interface NowPlayingUpdatePayload {
  nowPlaying: NowPlaying;
}

export interface SystemStatusPayload {
  status: SystemStatus;
}

export interface FixturePatchedPayload {
  fixture: PatchedFixture;
}

export interface FixtureUnpatchedPayload {
  fixtureId: string;
}

export interface FixtureValuesChangedPayload {
  fixtureId: string;
  values: number[];
}

/** REST API endpoint payloads */

export interface CreateSceneRequest {
  name: string;
  description?: string;
  category: Scene['category'];
  fixtureStates: Scene['fixtureStates'];
  bpmRange?: Scene['bpmRange'];
  energyRange?: Scene['energyRange'];
}

export interface UpdateSceneRequest {
  name?: string;
  description?: string;
  category?: Scene['category'];
  fixtureStates?: Scene['fixtureStates'];
  bpmRange?: Scene['bpmRange'];
  energyRange?: Scene['energyRange'];
  isFavorite?: boolean;
}

export interface PatchFixtureRequest {
  profileId: string;
  universeId: number;
  address: number;
  mode: number;
  name: string;
  groupId?: string;
}

export interface UpdateFixtureValuesRequest {
  values: number[];
  fadeTime?: number;
}

export interface SetManualBPMRequest {
  bpm: number;
}

export interface SetChannelValuesRequest {
  universeId: number;
  channels: Array<{
    address: number;
    value: number;
  }>;
}

/** API endpoint response types */

export type GetScenesResponse = Scene[];
export type GetSceneResponse = Scene;
export type CreateSceneResponse = Scene;
export type UpdateSceneResponse = Scene;

export type GetFixturesResponse = PatchedFixture[];
export type GetFixtureResponse = PatchedFixture;
export type PatchFixtureResponse = PatchedFixture;

export type GetFixtureProfilesResponse = FixtureProfile[];
export type GetFixtureProfileResponse = FixtureProfile;

export type GetUniversesResponse = Universe[];
export type GetUniverseResponse = Universe;

export type GetNowPlayingResponse = NowPlaying;
export type GetSystemStatusResponse = SystemStatus;
export type GetSpotifyStatusResponse = SpotifyConnectionStatus;
