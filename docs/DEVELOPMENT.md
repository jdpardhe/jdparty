# Development Guide

This guide covers the architecture, development workflow, and how to contribute to JDParty.

## Architecture Overview

JDParty is built as a monorepo with the following packages:

```
┌─────────────────────────────────────────┐
│           @jdparty/shared               │
│     (Types, Utils, Constants)           │
└─────────────────────────────────────────┘
         ↑           ↑           ↑
         │           │           │
    ┌────┴────┐ ┌────┴────┐ ┌───┴────┐
    │ Server  │ │   PWA   │ │Desktop │
    │(Backend)│ │  (Web)  │ │(Electron)
    └─────────┘ └─────────┘ └────────┘
```

### Package Responsibilities

**@jdparty/shared**
- TypeScript type definitions
- Shared utilities and constants
- No runtime dependencies
- Used by all other packages

**@jdparty/server**
- Express REST API
- WebSocket server (Socket.IO)
- DMX engine and output
- Spotify integration
- Scene management
- SQLite database

**@jdparty/pwa**
- React web application
- Progressive Web App features
- iOS-optimized UI
- WebSocket client
- State management (Zustand)

**@jdparty/desktop**
- Electron wrapper
- macOS menu bar integration
- Launches server as child process
- Native dialogs and menus

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express
- **WebSocket:** Socket.IO
- **Database:** better-sqlite3
- **DMX:** node-dmx, artnet, serialport

### Frontend (PWA)
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Router:** React Router v6
- **HTTP Client:** Axios

### Desktop
- **Framework:** Electron 28
- **Build:** electron-forge

## Development Workflow

### Project Structure

```
JDParty/
├── packages/
│   ├── shared/          # Shared types & utils
│   │   ├── src/
│   │   │   ├── types/   # Type definitions
│   │   │   └── utils/   # Utility functions
│   │   └── package.json
│   │
│   ├── server/          # Backend server
│   │   ├── src/
│   │   │   ├── api/     # REST API routes
│   │   │   ├── database/# Database schema
│   │   │   ├── dmx/     # DMX engine
│   │   │   ├── music/   # Spotify & beat clock
│   │   │   ├── scenes/  # Scene manager
│   │   │   ├── websocket/# WebSocket handlers
│   │   │   └── config/  # Configuration
│   │   └── package.json
│   │
│   ├── pwa/             # Web PWA
│   │   ├── src/
│   │   │   ├── components/# React components
│   │   │   ├── pages/   # Page components
│   │   │   ├── services/# API & WebSocket
│   │   │   ├── store/   # State management
│   │   │   └── utils/   # Utilities
│   │   └── package.json
│   │
│   └── desktop/         # Electron app
│       ├── src/
│       │   ├── main.ts  # Main process
│       │   └── preload.ts# Preload script
│       └── package.json
│
├── docs/                # Documentation
├── fixtures/            # Fixture library (JSON)
└── package.json         # Root package
```

### Adding a New Feature

1. **Define Types** (if needed)
   ```typescript
   // packages/shared/src/types/your-feature.ts
   export interface YourFeature {
     id: string;
     // ...
   }
   ```

2. **Backend Implementation**
   ```typescript
   // packages/server/src/your-feature/manager.ts
   export class YourFeatureManager {
     // Implementation
   }
   ```

3. **API Endpoints**
   ```typescript
   // packages/server/src/api/routes.ts
   apiRouter.get('/your-feature', (req, res) => {
     // Handler
   });
   ```

4. **Frontend Service**
   ```typescript
   // packages/pwa/src/services/api.ts
   async getYourFeature(): Promise<YourFeature> {
     // API call
   }
   ```

5. **UI Components**
   ```typescript
   // packages/pwa/src/components/YourFeature.tsx
   export function YourFeature() {
     // Component
   }
   ```

### Code Style

We use Prettier and ESLint for code formatting and linting.

```bash
# Format all code
pnpm format

# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

**Naming Conventions:**
- Files: `PascalCase.ts` for classes/components, `kebab-case.ts` for utilities
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Testing

### Unit Tests (Coming in v1.1)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage
pnpm test:coverage
```

### Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Spotify authentication works
- [ ] Scenes can be created and triggered
- [ ] Auto mode selects correct scenes
- [ ] PWA connects to server
- [ ] WebSocket events are received
- [ ] DMX output is correct
- [ ] Beat clock synchronizes with music

## Database Schema

The SQLite database contains the following tables:

```sql
-- Fixture profiles (pre-loaded)
fixture_profiles (id, manufacturer, model, modes, ...)

-- User-patched fixtures
patched_fixtures (id, profile_id, universe_id, address, ...)

-- Fixture groups
fixture_groups (id, name, fixture_ids, ...)

-- Scenes
scenes (id, name, category, fixture_states, bpm_range, ...)

-- DMX universes configuration
universes (id, name, protocol, settings, ...)

-- Application settings
settings (key, value, ...)
```

### Adding a New Table

1. Update `packages/server/src/database/index.ts`
2. Add CREATE TABLE statement
3. Create indexes if needed
4. Add migration logic (for existing databases)

## API Endpoints

### REST API

All endpoints are under `/api` and return JSON in this format:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}
```

**Available Endpoints:**

```
GET    /api/status              # System health
POST   /api/blackout            # Toggle blackout
GET    /api/scenes              # List scenes
GET    /api/scenes/:id          # Get scene
POST   /api/scenes              # Create scene
PUT    /api/scenes/:id          # Update scene
DELETE /api/scenes/:id          # Delete scene
POST   /api/scenes/:id/trigger  # Trigger scene
GET    /api/music/now-playing   # Current track
POST   /api/music/manual-bpm    # Set BPM manually
GET    /api/dmx/universes       # List universes
...
```

### WebSocket Events

**Client → Server:**
- `subscribe_channels` - Subscribe to DMX updates
- `subscribe_beats` - Subscribe to beat clock
- `control_fixture` - Send DMX values
- `trigger_scene` - Trigger a scene

**Server → Client:**
- `channel_update` - DMX channel changed
- `beat_tick` - Beat clock tick
- `scene_changed` - Scene was triggered
- `now_playing_update` - Track changed
- `system_status` - System status update

## Debugging

### Server Debugging

```bash
# Enable debug logging
DEBUG=* pnpm server

# Or specific modules
DEBUG=dmx,spotify pnpm server
```

### VSCode Launch Configurations

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "cwd": "${workspaceFolder}/packages/server",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Chrome DevTools

For PWA:
1. Open `http://localhost:3000` in Chrome
2. Open DevTools (F12)
3. Go to Application > Service Workers
4. Check "Update on reload" for development

## Performance Optimization

### Server
- Use SQLite prepared statements
- Batch DMX updates (44fps max)
- Cache Spotify API responses
- Rate limit WebSocket events

### PWA
- Lazy load routes
- Memoize expensive computations
- Debounce user inputs
- Optimize WebSocket listeners

### Desktop
- Use child process for server
- Minimize main process work
- Cache static assets

## Building for Production

### Server
```bash
cd packages/server
pnpm build
pnpm start
```

### PWA
```bash
cd packages/pwa
pnpm build
# Deploy dist/ to web server or serve with server
```

### Desktop
```bash
cd packages/desktop
pnpm build
# Creates distributable in out/
```

## Roadmap & Contributions

See [ROADMAP.md](./ROADMAP.md) for planned features.

To contribute:
1. Check [Issues](https://github.com/yourusername/jdparty/issues)
2. Comment on issue you want to work on
3. Fork the repository
4. Create feature branch
5. Submit pull request

## Resources

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [DMX512 Protocol](https://en.wikipedia.org/wiki/DMX512)
- [Art-Net Specification](https://art-net.org.uk/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
