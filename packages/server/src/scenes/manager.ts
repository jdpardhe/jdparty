/**
 * Scene Manager
 * Manages scenes and scene playback
 */

import { EventEmitter } from 'events';
import type { DB } from '../database/index.js';
import type { DMXEngine } from '../dmx/engine.js';
import type {
  Scene,
  SceneId,
  BPM,
  SceneCategory,
  CreateSceneRequest,
  UpdateSceneRequest,
} from '@jdparty/shared';
import { generateId, isInBPMRange } from '@jdparty/shared';

export class SceneManager extends EventEmitter {
  private db: DB;
  private dmxEngine: DMXEngine;
  private currentSceneId: SceneId | null = null;
  private autoModeEnabled: boolean = false;
  private fadeEngine: FadeEngine;

  constructor(db: DB, dmxEngine: DMXEngine) {
    super();
    this.db = db;
    this.dmxEngine = dmxEngine;
    this.fadeEngine = new FadeEngine(dmxEngine);
  }

  // Scene CRUD operations

  createScene(request: CreateSceneRequest): Scene {
    const id = generateId();
    const now = Date.now();

    const scene: Scene = {
      id,
      name: request.name,
      description: request.description,
      category: request.category,
      colorTag: undefined,
      thumbnail: undefined,
      fixtureStates: request.fixtureStates,
      bpmRange: request.bpmRange,
      energyRange: request.energyRange,
      isFavorite: false,
      usageCount: 0,
      createdAt: now,
      modifiedAt: now,
    };

    this.db
      .prepare(
        `
      INSERT INTO scenes (
        id, name, description, category, color_tag, thumbnail,
        fixture_states, bpm_min, bpm_max, bpm_optimal, energy_min, energy_max,
        is_favorite, usage_count, created_at, modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        scene.id,
        scene.name,
        scene.description || null,
        scene.category,
        scene.colorTag || null,
        scene.thumbnail || null,
        JSON.stringify(scene.fixtureStates),
        scene.bpmRange?.min || null,
        scene.bpmRange?.max || null,
        scene.bpmRange?.optimal || null,
        scene.energyRange?.min || null,
        scene.energyRange?.max || null,
        scene.isFavorite ? 1 : 0,
        scene.usageCount,
        scene.createdAt,
        scene.modifiedAt
      );

    this.emit('sceneCreated', scene);
    return scene;
  }

  getScene(id: SceneId): Scene | null {
    const row = this.db
      .prepare('SELECT * FROM scenes WHERE id = ?')
      .get(id) as any;

    if (!row) {
      return null;
    }

    return this.rowToScene(row);
  }

  getAllScenes(): Scene[] {
    const rows = this.db
      .prepare('SELECT * FROM scenes ORDER BY modified_at DESC')
      .all() as any[];

    return rows.map(this.rowToScene);
  }

  updateScene(id: SceneId, request: UpdateSceneRequest): Scene | null {
    const existing = this.getScene(id);
    if (!existing) {
      return null;
    }

    const updated: Scene = {
      ...existing,
      ...request,
      modifiedAt: Date.now(),
    };

    this.db
      .prepare(
        `
      UPDATE scenes SET
        name = ?, description = ?, category = ?,
        fixture_states = ?, bpm_min = ?, bpm_max = ?, bpm_optimal = ?,
        energy_min = ?, energy_max = ?, is_favorite = ?, modified_at = ?
      WHERE id = ?
    `
      )
      .run(
        updated.name,
        updated.description || null,
        updated.category,
        JSON.stringify(updated.fixtureStates),
        updated.bpmRange?.min || null,
        updated.bpmRange?.max || null,
        updated.bpmRange?.optimal || null,
        updated.energyRange?.min || null,
        updated.energyRange?.max || null,
        updated.isFavorite ? 1 : 0,
        updated.modifiedAt,
        id
      );

    this.emit('sceneUpdated', updated);
    return updated;
  }

  deleteScene(id: SceneId): boolean {
    const result = this.db.prepare('DELETE FROM scenes WHERE id = ?').run(id);
    const deleted = result.changes > 0;

    if (deleted) {
      this.emit('sceneDeleted', id);
    }

    return deleted;
  }

  // Scene triggering

  async triggerScene(id: SceneId, fadeTime: number = 0): Promise<void> {
    const scene = this.getScene(id);
    if (!scene) {
      throw new Error(`Scene ${id} not found`);
    }

    // Update usage count
    this.db
      .prepare('UPDATE scenes SET usage_count = usage_count + 1 WHERE id = ?')
      .run(id);

    // Apply scene
    if (fadeTime > 0) {
      await this.fadeEngine.fadeToScene(scene, fadeTime);
    } else {
      this.applySceneImmediate(scene);
    }

    this.currentSceneId = id;
    this.emit('sceneTriggered', { sceneId: id, sceneName: scene.name });
  }

  private applySceneImmediate(scene: Scene): void {
    for (const [fixtureId, state] of Object.entries(scene.fixtureStates)) {
      // TODO: Look up fixture universe and address
      // For now, assume fixtures are sequential starting at universe 1, address 1
      // This needs to be properly implemented with fixture patching
      const universeId = 1;
      const address = 1; // Placeholder

      this.dmxEngine.setChannels(universeId, address, state.values);
    }
  }

  // Auto mode

  enableAutoMode(): void {
    this.autoModeEnabled = true;
    this.emit('autoModeEnabled');
    console.log('  🤖 Auto mode enabled');
  }

  disableAutoMode(): void {
    this.autoModeEnabled = false;
    this.emit('autoModeDisabled');
    console.log('  ⏸️  Auto mode disabled');
  }

  isAutoModeEnabled(): boolean {
    return this.autoModeEnabled;
  }

  selectSceneForBPM(bpm: BPM, energy?: number): Scene | null {
    // Find scenes matching BPM range
    const scenes = this.getAllScenes().filter((scene) => {
      if (!scene.bpmRange) {
        return false;
      }

      if (!isInBPMRange(bpm, scene.bpmRange.min, scene.bpmRange.max)) {
        return false;
      }

      if (energy !== undefined && scene.energyRange) {
        if (energy < scene.energyRange.min || energy > scene.energyRange.max) {
          return false;
        }
      }

      return true;
    });

    if (scenes.length === 0) {
      return null;
    }

    // Sort by optimal BPM closeness and usage
    scenes.sort((a, b) => {
      const aOptimal = a.bpmRange?.optimal || (a.bpmRange!.min + a.bpmRange!.max) / 2;
      const bOptimal = b.bpmRange?.optimal || (b.bpmRange!.min + b.bpmRange!.max) / 2;

      const aDiff = Math.abs(bpm - aOptimal);
      const bDiff = Math.abs(bpm - bOptimal);

      if (aDiff !== bDiff) {
        return aDiff - bDiff;
      }

      // Favor less-used scenes for variety
      return a.usageCount - b.usageCount;
    });

    return scenes[0];
  }

  getCurrentScene(): Scene | null {
    if (!this.currentSceneId) {
      return null;
    }
    return this.getScene(this.currentSceneId);
  }

  // Helper methods

  private rowToScene(row: any): Scene {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category as SceneCategory,
      colorTag: row.color_tag,
      thumbnail: row.thumbnail,
      fixtureStates: JSON.parse(row.fixture_states),
      bpmRange:
        row.bpm_min !== null
          ? {
              min: row.bpm_min,
              max: row.bpm_max,
              optimal: row.bpm_optimal,
            }
          : undefined,
      energyRange:
        row.energy_min !== null
          ? {
              min: row.energy_min,
              max: row.energy_max,
            }
          : undefined,
      isFavorite: row.is_favorite === 1,
      usageCount: row.usage_count,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
    };
  }
}

/**
 * Fade Engine
 * Handles smooth transitions between scenes
 */
class FadeEngine {
  private dmxEngine: DMXEngine;

  constructor(dmxEngine: DMXEngine) {
    this.dmxEngine = dmxEngine;
  }

  async fadeToScene(scene: Scene, fadeTime: number): Promise<void> {
    const startTime = Date.now();
    const duration = fadeTime * 1000; // Convert to ms
    const frameRate = 30; // 30 fps for fades
    const frameTime = 1000 / frameRate;

    // Capture current state
    const startState = new Map<string, number[]>();
    // TODO: Get current fixture values

    // Target state
    const targetState = scene.fixtureStates;

    return new Promise((resolve) => {
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Apply eased interpolation
        const eased = this.easeInOutQuad(progress);

        // Interpolate each fixture
        for (const [fixtureId, targetFixtureState] of Object.entries(targetState)) {
          const startValues = startState.get(fixtureId) || new Array(targetFixtureState.values.length).fill(0);
          const interpolatedValues = startValues.map((start, i) => {
            const target = targetFixtureState.values[i];
            return Math.round(start + (target - start) * eased);
          });

          // TODO: Apply to fixture
          // This needs proper fixture patching implementation
        }

        if (progress >= 1) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, frameTime);
    });
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}
