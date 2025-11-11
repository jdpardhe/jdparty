# JDParty

> Music-reactive DMX lighting control system with Spotify integration

## Overview

JDParty is a music-intelligent DMX lighting control system that bridges professional lighting control with consumer music streaming. It consists of:

- **macOS Desktop App**: DMX engine and web server
- **iOS PWA**: Mobile-first lighting controller
- **Spotify Integration**: Automatic BPM detection and beat synchronization

## Features (v1.0 MVP)

- Single universe DMX output (USB + Art-Net)
- 20+ common fixture profiles
- Static scene system with BPM-based triggering
- Spotify integration with real-time BPM detection
- iOS Progressive Web App controller
- Automatic scene selection based on music tempo
- Manual fixture control interface

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    macOS Application                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ DMX Engine   │  │ Web Server   │  │ Music Engine │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Desktop**: Electron + TypeScript + React
- **Server**: Node.js + Express + Socket.IO
- **PWA**: React + Vite + Tailwind CSS
- **Database**: SQLite
- **DMX**: node-dmx + Art-Net

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- macOS 12+ (for desktop app development)

### Setup

```bash
# Install dependencies
pnpm install

# Run all packages in development mode
pnpm dev

# Run individual packages
pnpm desktop  # macOS app
pnpm server   # Backend server
pnpm pwa      # PWA interface
```

### Project Structure

```
JDParty/
├── packages/
│   ├── desktop/      # Electron macOS application
│   ├── server/       # Node.js backend + DMX engine
│   ├── pwa/          # iOS Progressive Web App
│   └── shared/       # Shared types and utilities
├── fixtures/         # DMX fixture library
└── docs/            # Documentation
```

## Roadmap

- **v1.0 (Current)**: MVP with core features
- **v1.5**: 4 universes, animations, multi-client
- **v2.0**: AI scene suggestions, multi-zone
- **v2.5**: Timeline, MIDI, visual layout

## Credits

BPM detection powered by [GetSongBPM](https://getsongbpm.com/) - The #1 source for finding BPM and musical key.

## License

MIT © Joshua Pardhe
