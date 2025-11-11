/**
 * API Service
 * REST API client for JDParty server
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Scene,
  SystemStatus,
  NowPlaying,
  CreateSceneRequest,
  UpdateSceneRequest,
} from '@jdparty/shared';

class ApiService {
  private client: AxiosInstance | null = null;

  initialize(baseURL: string): void {
    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      timeout: 10000,
    });
  }

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('API client not initialized');
    }
    return this.client;
  }

  // System
  async getStatus(): Promise<SystemStatus> {
    const response = await this.ensureClient().get<ApiResponse<SystemStatus>>('/status');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get status');
    }
    return response.data.data;
  }

  async blackout(): Promise<void> {
    await this.ensureClient().post('/blackout');
  }

  // Scenes
  async getScenes(): Promise<Scene[]> {
    const response = await this.ensureClient().get<ApiResponse<Scene[]>>('/scenes');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get scenes');
    }
    return response.data.data;
  }

  async getScene(id: string): Promise<Scene> {
    const response = await this.ensureClient().get<ApiResponse<Scene>>(`/scenes/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get scene');
    }
    return response.data.data;
  }

  async createScene(request: CreateSceneRequest): Promise<Scene> {
    const response = await this.ensureClient().post<ApiResponse<Scene>>('/scenes', request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create scene');
    }
    return response.data.data;
  }

  async updateScene(id: string, request: UpdateSceneRequest): Promise<Scene> {
    const response = await this.ensureClient().put<ApiResponse<Scene>>(`/scenes/${id}`, request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update scene');
    }
    return response.data.data;
  }

  async deleteScene(id: string): Promise<void> {
    await this.ensureClient().delete(`/scenes/${id}`);
  }

  async triggerScene(id: string, fadeTime: number = 0): Promise<void> {
    await this.ensureClient().post(`/scenes/${id}/trigger`, { fadeTime });
  }

  // Music
  async getNowPlaying(): Promise<NowPlaying | null> {
    const response = await this.ensureClient().get<ApiResponse<NowPlaying | null>>('/music/now-playing');
    return response.data.data || null;
  }

  async spotifyPlay(): Promise<void> {
    await this.ensureClient().post('/spotify/play');
  }

  async spotifyPause(): Promise<void> {
    await this.ensureClient().post('/spotify/pause');
  }

  async spotifyNext(): Promise<void> {
    await this.ensureClient().post('/spotify/next');
  }

  async spotifyPrevious(): Promise<void> {
    await this.ensureClient().post('/spotify/previous');
  }

  async spotifySeek(position_ms: number): Promise<void> {
    await this.ensureClient().post('/spotify/seek', { position_ms });
  }

  async getSpotifyAuthUrl(): Promise<string> {
    const response = await this.ensureClient().get<ApiResponse<{ authUrl: string }>>('/spotify/auth-url');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get Spotify auth URL');
    }
    return response.data.data.authUrl;
  }

  async setManualBPM(bpm: number): Promise<void> {
    await this.ensureClient().post('/music/manual-bpm', { bpm });
  }

  // Auto mode
  async enableAutoMode(): Promise<void> {
    await this.ensureClient().post('/auto-mode/enable');
  }

  async disableAutoMode(): Promise<void> {
    await this.ensureClient().post('/auto-mode/disable');
  }

  // Fixtures
  async getFixtureProfiles(): Promise<any[]> {
    const response = await this.ensureClient().get<ApiResponse<any[]>>('/fixtures/profiles');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get fixture profiles');
    }
    return response.data.data;
  }

  async getFixtureProfile(id: string): Promise<any> {
    const response = await this.ensureClient().get<ApiResponse<any>>(`/fixtures/profiles/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get fixture profile');
    }
    return response.data.data;
  }

  async getFixtures(): Promise<any[]> {
    const response = await this.ensureClient().get<ApiResponse<any[]>>('/fixtures');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get fixtures');
    }
    return response.data.data;
  }

  async getFixture(id: string): Promise<any> {
    const response = await this.ensureClient().get<ApiResponse<any>>(`/fixtures/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get fixture');
    }
    return response.data.data;
  }

  async patchFixture(request: { profileId: string; universeId: number; address: number; name: string; mode?: number }): Promise<any> {
    const response = await this.ensureClient().post<ApiResponse<any>>('/fixtures/patch', request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to patch fixture');
    }
    return response.data.data;
  }

  async unpatchFixture(id: string): Promise<void> {
    await this.ensureClient().delete(`/fixtures/${id}`);
  }

  async updateFixtureValues(id: string, values: number[]): Promise<void> {
    await this.ensureClient().put(`/fixtures/${id}/values`, { values });
  }

  async getFixtureGroups(): Promise<any[]> {
    const response = await this.ensureClient().get<ApiResponse<any[]>>('/fixtures/groups');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get fixture groups');
    }
    return response.data.data;
  }

  async getFixtureGroup(id: string): Promise<any> {
    const response = await this.ensureClient().get<ApiResponse<any>>(`/fixtures/groups/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get fixture group');
    }
    return response.data.data;
  }

  async createFixtureGroup(request: { name: string; fixtureIds: string[] }): Promise<any> {
    const response = await this.ensureClient().post<ApiResponse<any>>('/fixtures/groups', request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create fixture group');
    }
    return response.data.data;
  }

  async deleteFixtureGroup(id: string): Promise<void> {
    await this.ensureClient().delete(`/fixtures/groups/${id}`);
  }

  async updateFixtureGroupValues(id: string, values: number[]): Promise<void> {
    await this.ensureClient().put(`/fixtures/groups/${id}/values`, { values });
  }
}

export const api = new ApiService();
