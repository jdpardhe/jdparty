/**
 * Fixture Manager
 * Manages patched fixtures and groups
 */

import { EventEmitter } from 'events';
import type { DB } from '../database/index.js';
import type { DMXEngine } from '../dmx/engine.js';
import type {
  PatchedFixture,
  FixtureGroup,
  UniverseId,
  DMXAddress,
  DMXValue,
} from '@jdparty/shared';
import { generateId } from '@jdparty/shared';
import { FixtureLibrary } from './loader.js';

export class FixtureManager extends EventEmitter {
  private db: DB;
  private dmxEngine: DMXEngine;
  private library: FixtureLibrary;
  private patchedFixtures: Map<string, PatchedFixture> = new Map();
  private groups: Map<string, FixtureGroup> = new Map();

  constructor(db: DB, dmxEngine: DMXEngine) {
    super();
    this.db = db;
    this.dmxEngine = dmxEngine;
    this.library = new FixtureLibrary();
  }

  async initialize(): Promise<void> {
    // Load fixture library
    await this.library.loadLibrary();

    // Load patched fixtures from database
    this.loadPatchedFixtures();

    // Load groups from database
    this.loadGroups();

    // Initialize fixture profiles in database if empty
    await this.initializeProfiles();
  }

  private async initializeProfiles(): Promise<void> {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM fixture_profiles').get() as { count: number };

    if (count.count === 0) {
      console.log('  📥 Initializing fixture profiles in database...');

      const insertProfile = this.db.prepare(`
        INSERT INTO fixture_profiles
        (id, manufacturer, model, short_name, category, tags, modes, default_mode, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Date.now();

      for (const profile of this.library.getAllProfiles()) {
        insertProfile.run(
          profile.id,
          profile.manufacturer,
          profile.model,
          profile.shortName,
          profile.category,
          JSON.stringify(profile.tags),
          JSON.stringify(profile.modes),
          profile.defaultMode,
          now,
          now
        );
      }

      console.log(`  ✅ Initialized ${this.library.getAllProfiles().length} fixture profiles`);
    }
  }

  private loadPatchedFixtures(): void {
    const rows = this.db.prepare('SELECT * FROM patched_fixtures').all() as any[];

    for (const row of rows) {
      const fixture: PatchedFixture = {
        id: row.id,
        profileId: row.profile_id,
        universeId: row.universe_id,
        address: row.address,
        mode: row.mode,
        name: row.name,
        groupId: row.group_id,
        values: JSON.parse(row.values),
      };

      this.patchedFixtures.set(fixture.id, fixture);
    }
  }

  private loadGroups(): void {
    const rows = this.db.prepare('SELECT * FROM fixture_groups').all() as any[];

    for (const row of rows) {
      const group: FixtureGroup = {
        id: row.id,
        name: row.name,
        fixtureIds: JSON.parse(row.fixture_ids),
        color: row.color,
      };

      this.groups.set(group.id, group);
    }
  }

  // Fixture patching

  patchFixture(
    profileId: string,
    universeId: UniverseId,
    address: DMXAddress,
    name: string,
    mode: number = 0
  ): PatchedFixture {
    const profile = this.library.getProfile(profileId);
    if (!profile) {
      throw new Error(`Fixture profile ${profileId} not found`);
    }

    if (mode >= profile.modes.length) {
      throw new Error(`Invalid mode ${mode} for fixture ${profileId}`);
    }

    const selectedMode = profile.modes[mode];
    const id = generateId();
    const now = Date.now();

    // Initialize with default values
    const values: DMXValue[] = selectedMode.channels.map((channel) => channel.default || 0);

    const fixture: PatchedFixture = {
      id,
      profileId,
      universeId,
      address,
      mode,
      name,
      values,
    };

    // Insert into database
    this.db.prepare(`
      INSERT INTO patched_fixtures
      (id, profile_id, universe_id, address, mode, name, group_id, "values", created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fixture.id,
      fixture.profileId,
      fixture.universeId,
      fixture.address,
      fixture.mode,
      fixture.name,
      fixture.groupId || null,
      JSON.stringify(fixture.values),
      now,
      now
    );

    this.patchedFixtures.set(id, fixture);
    this.emit('fixturePatched', fixture);

    return fixture;
  }

  unpatchFixture(id: string): boolean {
    const result = this.db.prepare('DELETE FROM patched_fixtures WHERE id = ?').run(id);
    const deleted = result.changes > 0;

    if (deleted) {
      this.patchedFixtures.delete(id);
      this.emit('fixtureUnpatched', id);
    }

    return deleted;
  }

  getFixture(id: string): PatchedFixture | undefined {
    return this.patchedFixtures.get(id);
  }

  getAllFixtures(): PatchedFixture[] {
    return Array.from(this.patchedFixtures.values());
  }

  updateFixtureValues(id: string, values: DMXValue[]): void {
    const fixture = this.patchedFixtures.get(id);
    if (!fixture) {
      throw new Error(`Fixture ${id} not found`);
    }

    fixture.values = values;

    // Update database
    this.db.prepare('UPDATE patched_fixtures SET "values" = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(values), Date.now(), id);

    // Output to DMX
    this.dmxEngine.setChannels(fixture.universeId, fixture.address, values);

    this.emit('fixtureValuesUpdated', { id, values });
  }

  // Groups

  createGroup(name: string, fixtureIds: string[]): FixtureGroup {
    const id = generateId();
    const now = Date.now();

    const group: FixtureGroup = {
      id,
      name,
      fixtureIds,
    };

    this.db.prepare(`
      INSERT INTO fixture_groups (id, name, fixture_ids, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      group.id,
      group.name,
      JSON.stringify(group.fixtureIds),
      group.color || null,
      now,
      now
    );

    this.groups.set(id, group);
    this.emit('groupCreated', group);

    return group;
  }

  deleteGroup(id: string): boolean {
    const result = this.db.prepare('DELETE FROM fixture_groups WHERE id = ?').run(id);
    const deleted = result.changes > 0;

    if (deleted) {
      this.groups.delete(id);
      this.emit('groupDeleted', id);
    }

    return deleted;
  }

  getGroup(id: string): FixtureGroup | undefined {
    return this.groups.get(id);
  }

  getAllGroups(): FixtureGroup[] {
    return Array.from(this.groups.values());
  }

  // Library access

  getLibrary(): FixtureLibrary {
    return this.library;
  }
}
