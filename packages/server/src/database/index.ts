/**
 * Database Module
 * SQLite database initialization and schema
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { serverConfig } from '../config/index.js';

// Wrapper to make sql.js API compatible with better-sqlite3
export class DatabaseWrapper {
  private db: SqlJsDatabase;
  private dbPath: string;

  constructor(db: SqlJsDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  prepare(sql: string) {
    return {
      run: (...params: any[]) => {
        this.db.run(sql, params);
        this.save();
        return { changes: this.db.getRowsModified() };
      },
      get: (...params: any[]) => {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params: any[]) => {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
    };
  }

  exec(sql: string) {
    this.db.exec(sql);
    this.save();
  }

  pragma(pragma: string) {
    this.db.exec(`PRAGMA ${pragma}`);
  }

  close() {
    this.save();
    this.db.close();
  }

  private save() {
    const data = this.db.export();
    writeFileSync(this.dbPath, data);
  }
}

export type DB = DatabaseWrapper;

export async function initDatabase(): Promise<DB> {
  // Ensure data directory exists
  mkdirSync(dirname(serverConfig.database.path), { recursive: true });

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database or create new
  let sqlDb: SqlJsDatabase;
  if (existsSync(serverConfig.database.path)) {
    const buffer = readFileSync(serverConfig.database.path);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  const db = new DatabaseWrapper(sqlDb, serverConfig.database.path);

  // Create tables
  createTables(db);

  console.log(`✅ Database initialized at ${serverConfig.database.path}`);

  return db;
}

function createTables(db: DB): void {
  // Fixture profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fixture_profiles (
      id TEXT PRIMARY KEY,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      short_name TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      modes TEXT NOT NULL,
      default_mode INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Patched fixtures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patched_fixtures (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      universe_id INTEGER NOT NULL,
      address INTEGER NOT NULL,
      mode INTEGER NOT NULL,
      name TEXT NOT NULL,
      group_id TEXT,
      "values" TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES fixture_profiles(id)
    )
  `);

  // Fixture groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fixture_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fixture_ids TEXT NOT NULL,
      color TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Scenes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      color_tag TEXT,
      thumbnail TEXT,
      fixture_states TEXT NOT NULL,
      bpm_min REAL,
      bpm_max REAL,
      bpm_optimal REAL,
      energy_min REAL,
      energy_max REAL,
      is_favorite INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      modified_at INTEGER NOT NULL
    )
  `);

  // Universes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS universes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      protocol TEXT NOT NULL,
      settings TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Track BPM cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS track_bpm_cache (
      spotify_track_id TEXT PRIMARY KEY,
      tempo_bpm REAL NOT NULL,
      key TEXT,
      mode TEXT,
      time_sig INTEGER,
      source TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scenes_bpm ON scenes(bpm_min, bpm_max);
    CREATE INDEX IF NOT EXISTS idx_scenes_category ON scenes(category);
    CREATE INDEX IF NOT EXISTS idx_scenes_favorite ON scenes(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_patched_fixtures_universe ON patched_fixtures(universe_id);
  `);

  // Insert default universe if not exists
  const universeExists = db.prepare('SELECT COUNT(*) as count FROM universes WHERE id = 1').get() as { count: number };
  if (universeExists.count === 0) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO universes (id, name, protocol, settings, enabled, created_at, updated_at)
      VALUES (1, 'Universe 1', 'usb', '{}', 1, ${now}, ${now})
    `).run();
  }

  // Seed sample scenes (call asynchronously after table creation)
  setTimeout(async () => {
    const { seedSampleScenes } = await import('./seed-scenes.js');
    seedSampleScenes(db);
  }, 0);
}
