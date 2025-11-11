/**
 * API Routes
 * REST API endpoints
 */

import { Router, type Request, type Response } from 'express';
import type { ApiResponse } from '@jdparty/shared';

export const apiRouter: Router = Router();

// Helper to create API response
function createResponse<T>(data?: T, error?: { code: string; message: string }): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    timestamp: Date.now(),
  };
}

// System routes
apiRouter.get('/status', (req: Request, res: Response) => {
  const { dmxEngine, spotifyService, sceneManager, io } = req.app.locals;

  res.json(
    createResponse({
      version: '1.0.0',
      uptime: process.uptime(),
      dmxActive: dmxEngine.isActive(),
      dmxInterfaces: dmxEngine.getInterfaceStatus(),
      spotifyConnected: spotifyService.isConnected(),
      connectedClients: io.engine.clientsCount,
      autoModeEnabled: sceneManager.isAutoModeEnabled(),
      blackoutActive: false, // TODO: Track blackout state
    })
  );
});

apiRouter.post('/blackout', (req: Request, res: Response) => {
  const { dmxEngine } = req.app.locals;

  dmxEngine.blackout();

  res.json(createResponse({ success: true }));
});

// Spotify routes
apiRouter.get('/spotify/status', (req: Request, res: Response) => {
  const { spotifyService } = req.app.locals;

  res.json(createResponse(spotifyService.getConnectionStatus()));
});

apiRouter.get('/spotify/auth-url', (req: Request, res: Response) => {
  const { spotifyService } = req.app.locals;

  res.json(createResponse({ authUrl: spotifyService.getAuthUrl() }));
});

apiRouter.get('/spotify/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const { spotifyService } = req.app.locals;

  if (error) {
    return res.json(
      createResponse(undefined, {
        code: 'AUTH_ERROR',
        message: `Authentication failed: ${error}`,
      })
    );
  }

  if (!code || typeof code !== 'string') {
    return res.json(
      createResponse(undefined, {
        code: 'INVALID_CODE',
        message: 'No authorization code provided',
      })
    );
  }

  try {
    await spotifyService.authenticate(code);
    res.json(createResponse({ success: true }));
  } catch (err: any) {
    res.json(
      createResponse(undefined, {
        code: 'AUTH_FAILED',
        message: err.message,
      })
    );
  }
});

apiRouter.post('/spotify/play', async (req: Request, res: Response) => {
  const { spotifyService } = req.app.locals;
  const status = await spotifyService.play();
  res.status(status).json(createResponse({ status }));
});

apiRouter.post('/spotify/pause', async (req: Request, res: Response) => {
  const { spotifyService } = req.app.locals;
  const status = await spotifyService.pause();
  res.status(status).json(createResponse({ status }));
});

apiRouter.post('/spotify/next', async (req: Request, res: Response) => {
  const { spotifyService } = req.app.locals;
  const status = await spotifyService.next();
  res.status(status).json(createResponse({ status }));
});

apiRouter.post('/spotify/previous', async (req: Request, res: Response) => {
  const { spotifyService } = req.app.locals;
  const status = await spotifyService.previous();
  res.status(status).json(createResponse({ status }));
});

apiRouter.post('/spotify/seek', async (req: Request, res: Response) => {
  const { position_ms } = req.body;
  const { spotifyService } = req.app.locals;
  const status = await spotifyService.seek(position_ms);
  res.status(status).json(createResponse({ status }));
});

// Music routes
apiRouter.get('/music/now-playing', (req: Request, res: Response) => {
  const { spotifyService, beatClock } = req.app.locals;

  const playback = spotifyService.getCurrentPlayback();

  if (!playback) {
    return res.json(createResponse(null));
  }

  const nowPlaying = {
    source: 'spotify',
    track: playback.track,
    audioFeatures: null, // TODO: Cache and return
    beatClock: beatClock.getInfo(),
    isPlaying: playback.isPlaying,
    position: playback.position,
  };

  res.json(createResponse(nowPlaying));
});

apiRouter.get('/music/bpm', (req: Request, res: Response) => {
  const { beatClock } = req.app.locals;

  res.json(createResponse({ bpm: beatClock.getBPM() }));
});

apiRouter.post('/music/manual-bpm', (req: Request, res: Response) => {
  const { bpm } = req.body;
  const { beatClock } = req.app.locals;

  if (typeof bpm !== 'number' || bpm < 40 || bpm > 240) {
    return res.json(
      createResponse(undefined, {
        code: 'INVALID_BPM',
        message: 'BPM must be between 40 and 240',
      })
    );
  }

  beatClock.setBPM(bpm);

  res.json(createResponse({ bpm }));
});

// Scene routes
apiRouter.get('/scenes', (req: Request, res: Response) => {
  const { sceneManager } = req.app.locals;

  const scenes = sceneManager.getAllScenes();

  res.json(createResponse(scenes));
});

apiRouter.get('/scenes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { sceneManager } = req.app.locals;

  const scene = sceneManager.getScene(id);

  if (!scene) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'SCENE_NOT_FOUND',
        message: `Scene ${id} not found`,
      })
    );
  }

  res.json(createResponse(scene));
});

apiRouter.post('/scenes', (req: Request, res: Response) => {
  const { sceneManager } = req.app.locals;

  try {
    const scene = sceneManager.createScene(req.body);
    res.status(201).json(createResponse(scene));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'CREATE_FAILED',
        message: err.message,
      })
    );
  }
});

apiRouter.put('/scenes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { sceneManager } = req.app.locals;

  try {
    const scene = sceneManager.updateScene(id, req.body);

    if (!scene) {
      return res.status(404).json(
        createResponse(undefined, {
          code: 'SCENE_NOT_FOUND',
          message: `Scene ${id} not found`,
        })
      );
    }

    res.json(createResponse(scene));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'UPDATE_FAILED',
        message: err.message,
      })
    );
  }
});

apiRouter.delete('/scenes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { sceneManager } = req.app.locals;

  const deleted = sceneManager.deleteScene(id);

  if (!deleted) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'SCENE_NOT_FOUND',
        message: `Scene ${id} not found`,
      })
    );
  }

  res.json(createResponse({ success: true }));
});

apiRouter.post('/scenes/:id/trigger', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fadeTime = 0 } = req.body;
  const { sceneManager } = req.app.locals;

  try {
    await sceneManager.triggerScene(id, fadeTime);
    res.json(createResponse({ success: true }));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'TRIGGER_FAILED',
        message: err.message,
      })
    );
  }
});

// DMX routes
apiRouter.get('/dmx/universes', (req: Request, res: Response) => {
  const { dmxEngine } = req.app.locals;

  const universes = dmxEngine.getAllUniverses();

  res.json(createResponse(universes));
});

apiRouter.get('/dmx/universes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { dmxEngine } = req.app.locals;

  const universe = dmxEngine.getUniverse(parseInt(id, 10));

  if (!universe) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'UNIVERSE_NOT_FOUND',
        message: `Universe ${id} not found`,
      })
    );
  }

  res.json(createResponse(universe));
});

apiRouter.get('/dmx/universes/:id/channels', (req: Request, res: Response) => {
  const { id } = req.params;
  const { dmxEngine } = req.app.locals;

  try {
    const channels = dmxEngine.getChannels(parseInt(id, 10));
    res.json(createResponse({ channels }));
  } catch (err: any) {
    res.status(404).json(
      createResponse(undefined, {
        code: 'ERROR',
        message: err.message,
      })
    );
  }
});

apiRouter.post('/dmx/universes/:id/channels', (req: Request, res: Response) => {
  const { id } = req.params;
  const { channels } = req.body;
  const { dmxEngine } = req.app.locals;

  try {
    for (const { address, value } of channels) {
      dmxEngine.setChannel(parseInt(id, 10), address, value);
    }
    res.json(createResponse({ success: true }));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'ERROR',
        message: err.message,
      })
    );
  }
});

// Auto mode routes
apiRouter.post('/auto-mode/enable', (req: Request, res: Response) => {
  const { sceneManager } = req.app.locals;

  sceneManager.enableAutoMode();

  res.json(createResponse({ enabled: true }));
});

apiRouter.post('/auto-mode/disable', (req: Request, res: Response) => {
  const { sceneManager } = req.app.locals;

  sceneManager.disableAutoMode();

  res.json(createResponse({ enabled: false }));
});

// Fixture routes
// Note: More specific routes must come before parametrized routes

// Fixture profiles
apiRouter.get('/fixtures/profiles', (req: Request, res: Response) => {
  const { fixtureManager } = req.app.locals;

  const library = fixtureManager.getLibrary();
  const profiles = library.getAllProfiles();

  res.json(createResponse(profiles));
});

apiRouter.get('/fixtures/profiles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fixtureManager } = req.app.locals;

  const library = fixtureManager.getLibrary();
  const profile = library.getProfile(id);

  if (!profile) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'PROFILE_NOT_FOUND',
        message: `Fixture profile ${id} not found`,
      })
    );
  }

  res.json(createResponse(profile));
});

// Fixture groups (must come before /fixtures/:id)
apiRouter.get('/fixtures/groups', (req: Request, res: Response) => {
  const { fixtureManager } = req.app.locals;

  const groups = fixtureManager.getAllGroups();

  res.json(createResponse(groups));
});

apiRouter.get('/fixtures/groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fixtureManager } = req.app.locals;

  const group = fixtureManager.getGroup(id);

  if (!group) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'GROUP_NOT_FOUND',
        message: `Fixture group ${id} not found`,
      })
    );
  }

  res.json(createResponse(group));
});

apiRouter.post('/fixtures/groups', (req: Request, res: Response) => {
  const { name, fixtureIds } = req.body;
  const { fixtureManager } = req.app.locals;

  if (!name || !Array.isArray(fixtureIds)) {
    return res.status(400).json(
      createResponse(undefined, {
        code: 'INVALID_REQUEST',
        message: 'Missing required fields: name, fixtureIds (array)',
      })
    );
  }

  try {
    const group = fixtureManager.createGroup(name, fixtureIds);
    res.status(201).json(createResponse(group));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'CREATE_FAILED',
        message: err.message,
      })
    );
  }
});

apiRouter.delete('/fixtures/groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fixtureManager } = req.app.locals;

  const deleted = fixtureManager.deleteGroup(id);

  if (!deleted) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'GROUP_NOT_FOUND',
        message: `Fixture group ${id} not found`,
      })
    );
  }

  res.json(createResponse({ success: true }));
});

apiRouter.put('/fixtures/groups/:id/values', (req: Request, res: Response) => {
  const { id } = req.params;
  const { values } = req.body;
  const { fixtureManager } = req.app.locals;

  if (!Array.isArray(values)) {
    return res.status(400).json(
      createResponse(undefined, {
        code: 'INVALID_REQUEST',
        message: 'values must be an array',
      })
    );
  }

  try {
    const group = fixtureManager.getGroup(id);
    if (!group) {
      return res.status(404).json(
        createResponse(undefined, {
          code: 'GROUP_NOT_FOUND',
          message: `Fixture group ${id} not found`,
        })
      );
    }

    // Update all fixtures in the group
    for (const fixtureId of group.fixtureIds) {
      fixtureManager.updateFixtureValues(fixtureId, values);
    }

    res.json(createResponse({ success: true }));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'UPDATE_FAILED',
        message: err.message,
      })
    );
  }
});

// Fixture patching (must come before /fixtures/:id)
apiRouter.post('/fixtures/patch', (req: Request, res: Response) => {
  const { profileId, universeId, address, name, mode } = req.body;
  const { fixtureManager } = req.app.locals;

  console.log('  📥 Patch request:', { profileId, universeId, address, name, mode });

  if (!profileId || universeId === undefined || address === undefined || !name) {
    console.log('  ❌ Validation failed:', { profileId: !!profileId, universeId: universeId !== undefined, address: address !== undefined, name: !!name });
    return res.status(400).json(
      createResponse(undefined, {
        code: 'INVALID_REQUEST',
        message: 'Missing required fields: profileId, universeId, address, name',
      })
    );
  }

  try {
    const fixture = fixtureManager.patchFixture(profileId, universeId, address, name, mode || 0);
    console.log('  ✅ Fixture patched:', fixture.id);
    res.status(201).json(createResponse(fixture));
  } catch (err: any) {
    console.log('  ❌ Patch failed:', err.message);
    res.status(400).json(
      createResponse(undefined, {
        code: 'PATCH_FAILED',
        message: err.message,
      })
    );
  }
});

// Patched fixtures list
apiRouter.get('/fixtures', (req: Request, res: Response) => {
  const { fixtureManager } = req.app.locals;

  const fixtures = fixtureManager.getAllFixtures();

  res.json(createResponse(fixtures));
});

// Individual fixture routes
apiRouter.get('/fixtures/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fixtureManager } = req.app.locals;

  const fixture = fixtureManager.getFixture(id);

  if (!fixture) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'FIXTURE_NOT_FOUND',
        message: `Fixture ${id} not found`,
      })
    );
  }

  res.json(createResponse(fixture));
});

apiRouter.delete('/fixtures/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fixtureManager } = req.app.locals;

  const deleted = fixtureManager.unpatchFixture(id);

  if (!deleted) {
    return res.status(404).json(
      createResponse(undefined, {
        code: 'FIXTURE_NOT_FOUND',
        message: `Fixture ${id} not found`,
      })
    );
  }

  res.json(createResponse({ success: true }));
});

apiRouter.put('/fixtures/:id/values', (req: Request, res: Response) => {
  const { id } = req.params;
  const { values } = req.body;
  const { fixtureManager } = req.app.locals;

  if (!Array.isArray(values)) {
    return res.status(400).json(
      createResponse(undefined, {
        code: 'INVALID_REQUEST',
        message: 'values must be an array',
      })
    );
  }

  try {
    fixtureManager.updateFixtureValues(id, values);
    res.json(createResponse({ success: true }));
  } catch (err: any) {
    res.status(400).json(
      createResponse(undefined, {
        code: 'UPDATE_FAILED',
        message: err.message,
      })
    );
  }
});
