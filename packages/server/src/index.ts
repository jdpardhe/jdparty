/**
 * JDParty Server
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { serverConfig, validateConfig } from './config/index.js';
import { initDatabase } from './database/index.js';
import { DMXEngine } from './dmx/engine.js';
import { SpotifyService } from './music/spotify.js';
import { BeatClock } from './music/beat-clock.js';
import { SceneManager } from './scenes/manager.js';
import { FixtureManager } from './fixtures/manager.js';
import { apiRouter } from './api/routes.js';
import { setupWebSocket } from './websocket/index.js';

async function bootstrap() {
  console.log('🎉 Starting JDParty Server v1.0.0');

  // Validate configuration
  validateConfig();

  // Initialize Express app
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // TODO: Restrict in production
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database
  console.log('📊 Initializing database...');
  const db = await initDatabase();

  // Initialize DMX engine
  console.log('💡 Initializing DMX engine...');
  const dmxEngine = new DMXEngine();
  await dmxEngine.initialize();

  // Initialize fixture manager
  console.log('🔦 Initializing fixture manager...');
  const fixtureManager = new FixtureManager(db, dmxEngine);
  await fixtureManager.initialize();

  // Initialize music services
  console.log('🎵 Initializing music services...');
  const spotifyService = new SpotifyService(db);
  spotifyService.loadTokens(); // Load saved tokens if available
  const beatClock = new BeatClock();

  // Initialize scene manager
  console.log('🎬 Initializing scene manager...');
  const sceneManager = new SceneManager(db, dmxEngine);

  // Store services in app locals for access in routes
  app.locals.db = db;
  app.locals.dmxEngine = dmxEngine;
  app.locals.fixtureManager = fixtureManager;
  app.locals.spotifyService = spotifyService;
  app.locals.beatClock = beatClock;
  app.locals.sceneManager = sceneManager;
  app.locals.io = io;

  // Setup API routes
  console.log('🛣️  Setting up API routes...');
  app.use('/api', apiRouter);

  // Setup WebSocket
  console.log('🔌 Setting up WebSocket...');
  setupWebSocket(io, {
    dmxEngine,
    spotifyService,
    beatClock,
    sceneManager,
    fixtureManager,
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime(),
      dmxActive: dmxEngine.isActive(),
      spotifyConnected: spotifyService.isConnected(),
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Internal server error',
      },
      timestamp: Date.now(),
    });
  });

  // Start server
  httpServer.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎉 JDParty Server Running                          ║
║                                                       ║
║   📡 HTTP:      http://${serverConfig.host}:${serverConfig.port}           ║
║   🔌 WebSocket: ws://${serverConfig.host}:${serverConfig.port}             ║
║   💡 DMX:       ${dmxEngine.isActive() ? '✅ Active' : '❌ Inactive'}                       ║
║   🎵 Spotify:   ${spotifyService.isConnected() ? '✅ Connected' : '⚠️  Not configured'}              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    // Stop DMX output
    await dmxEngine.stop();

    // Close database
    db.close();

    // Close server
    httpServer.close(() => {
      console.log('👋 Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start server
bootstrap().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
