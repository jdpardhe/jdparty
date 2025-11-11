/**
 * Fixture Library Loader
 * Loads fixture profiles from JSON files
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { FixtureProfile } from '@jdparty/shared';

export class FixtureLibrary {
  private profiles: Map<string, FixtureProfile> = new Map();
  private loaded: boolean = false;

  async loadLibrary(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      // Path to fixtures directory (adjust for production)
      const fixturesPath = join(process.cwd(), '../../fixtures/manufacturers');

      console.log('  📚 Loading fixture library...');

      const files = readdirSync(fixturesPath);

      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filePath = join(fixturesPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const fixtures: FixtureProfile[] = JSON.parse(content);

        for (const fixture of fixtures) {
          this.profiles.set(fixture.id, fixture);
        }
      }

      this.loaded = true;
      console.log(`  ✅ Loaded ${this.profiles.size} fixture profiles`);
    } catch (error: any) {
      console.error(`  ⚠️  Failed to load fixture library: ${error.message}`);
      console.log('  ℹ️  Fixture library will be empty');
    }
  }

  getProfile(id: string): FixtureProfile | undefined {
    return this.profiles.get(id);
  }

  getAllProfiles(): FixtureProfile[] {
    return Array.from(this.profiles.values());
  }

  searchProfiles(query: string): FixtureProfile[] {
    const lowerQuery = query.toLowerCase();

    return this.getAllProfiles().filter((profile) => {
      return (
        profile.manufacturer.toLowerCase().includes(lowerQuery) ||
        profile.model.toLowerCase().includes(lowerQuery) ||
        profile.shortName.toLowerCase().includes(lowerQuery) ||
        profile.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  getProfilesByManufacturer(manufacturer: string): FixtureProfile[] {
    const lowerManufacturer = manufacturer.toLowerCase();

    return this.getAllProfiles().filter(
      (profile) => profile.manufacturer.toLowerCase() === lowerManufacturer
    );
  }

  getProfilesByCategory(category: FixtureProfile['category']): FixtureProfile[] {
    return this.getAllProfiles().filter((profile) => profile.category === category);
  }
}
