# JDParty Quick Start

Get JDParty running in 5 minutes!

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Spotify Premium** account

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/JDParty.git
cd JDParty

# Install dependencies
pnpm install

# Build packages
pnpm build
```

## Configuration

### Spotify Setup (Required)

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `http://localhost:8080/api/auth/spotify/callback`
4. Copy `.env.example` to `.env` in `packages/server/`
5. Add your Spotify Client ID and Secret to `.env`

```bash
cp packages/server/.env.example packages/server/.env
# Edit .env and add your credentials
```

## Running

### Option 1: All-in-One (Recommended)

```bash
pnpm dev
```

This starts:
- Server: `http://localhost:8080`
- PWA: `http://localhost:3000`
- Desktop app

### Option 2: Individual Services

**Terminal 1:**
```bash
pnpm server
```

**Terminal 2:**
```bash
pnpm pwa
```

**Terminal 3:**
```bash
pnpm desktop
```

## First Use

1. **Connect Spotify**
   - Open app → Settings → Connect Spotify
   - Authorize the application

2. **Create a Scene**
   - Play a song
   - Adjust lighting manually
   - Save as scene with BPM range

3. **Enable Auto Mode**
   - Dashboard → Toggle Auto Mode
   - Scenes auto-switch based on BPM

## iOS PWA Setup

1. On your iPhone/iPad, open Safari
2. Go to `http://YOUR_COMPUTER_IP:3000`
3. Tap Share → Add to Home Screen
4. Launch from home screen

## Troubleshooting

**Port 8080 in use?**
```bash
lsof -ti:8080 | xargs kill -9
```

**Spotify won't connect?**
- Check redirect URI in Spotify dashboard
- Verify credentials in `.env`

**PWA can't connect?**
- Ensure same Wi-Fi network
- Check firewall allows port 8080

## What's Next?

- [Full Documentation](./docs/GETTING_STARTED.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Roadmap](./docs/ROADMAP.md)

Enjoy! 🎉
