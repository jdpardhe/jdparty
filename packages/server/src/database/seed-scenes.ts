/**
 * Seed Sample Scenes
 * Creates default scenes for testing
 */

import type { DB } from './index.js';
import { generateId } from '@jdparty/shared';

export function seedSampleScenes(db: DB): void {
  const existingScenes = db.prepare('SELECT COUNT(*) as count FROM scenes').get() as { count: number };

  if (existingScenes.count > 0) {
    console.log('  ℹ️  Scenes already exist, skipping seed');
    return;
  }

  console.log('  🌱 Seeding sample scenes...');

  const scenes = [
    {
      name: 'Ambient Blue',
      description: 'Calm blue wash for slow tempo music',
      category: 'ambient',
      bpmMin: 60,
      bpmMax: 90,
      bpmOptimal: 75,
      energyMin: 0.2,
      energyMax: 0.5,
      // Simple RGB state - all fixtures to blue
      fixtureStates: JSON.stringify({
        all: {
          fixtureId: 'all',
          values: [0, 50, 150, 0, 255, 0] // R, G, B, A, Dimmer, Strobe
        }
      })
    },
    {
      name: 'Medium Energy Purple',
      description: 'Purple/magenta for medium tempo',
      category: 'energetic',
      bpmMin: 90,
      bpmMax: 120,
      bpmOptimal: 105,
      energyMin: 0.5,
      energyMax: 0.7,
      fixtureStates: JSON.stringify({
        all: {
          fixtureId: 'all',
          values: [150, 0, 150, 0, 255, 0]
        }
      })
    },
    {
      name: 'High Energy Red',
      description: 'Intense red for fast tempo music',
      category: 'energetic',
      bpmMin: 120,
      bpmMax: 150,
      bpmOptimal: 135,
      energyMin: 0.7,
      energyMax: 0.9,
      fixtureStates: JSON.stringify({
        all: {
          fixtureId: 'all',
          values: [255, 0, 0, 0, 255, 0]
        }
      })
    },
    {
      name: 'Strobe White',
      description: 'Intense white strobe for very fast music',
      category: 'strobe',
      bpmMin: 150,
      bpmMax: 200,
      bpmOptimal: 170,
      energyMin: 0.8,
      energyMax: 1.0,
      fixtureStates: JSON.stringify({
        all: {
          fixtureId: 'all',
          values: [255, 255, 255, 255, 255, 128] // White with strobe
        }
      })
    },
    {
      name: 'Rainbow Colors',
      description: 'Multi-color for party atmosphere',
      category: 'color',
      bpmMin: 100,
      bpmMax: 140,
      bpmOptimal: 120,
      energyMin: 0.6,
      energyMax: 0.9,
      fixtureStates: JSON.stringify({
        all: {
          fixtureId: 'all',
          values: [255, 100, 200, 50, 255, 0]
        }
      })
    }
  ];

  const now = Date.now();
  const insertScene = db.prepare(`
    INSERT INTO scenes (
      id, name, description, category, fixture_states,
      bpm_min, bpm_max, bpm_optimal, energy_min, energy_max,
      is_favorite, usage_count, created_at, modified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const scene of scenes) {
    insertScene.run(
      generateId(),
      scene.name,
      scene.description,
      scene.category,
      scene.fixtureStates,
      scene.bpmMin,
      scene.bpmMax,
      scene.bpmOptimal,
      scene.energyMin,
      scene.energyMax,
      0, // not favorite
      0, // usage count
      now,
      now
    );
  }

  console.log(`  ✅ Seeded ${scenes.length} sample scenes`);
}
