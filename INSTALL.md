# JDParty Installation Guide

## Quickest Start (One Command)

```bash
git clone https://github.com/yourusername/JDParty.git
cd JDParty
./quick-start.sh
```

That's it! The app will build and start automatically.

---

## Step-by-Step Installation

### 1. Prerequisites

Install these first:

- **Node.js** 18 or higher
  ```bash
  node --version  # Should show v18.0.0 or higher
  ```

- **pnpm** 8 or higher
  ```bash
  npm install -g pnpm
  pnpm --version  # Should show 8.0.0 or higher
  ```

### 2. Clone Repository

```bash
git clone https://github.com/yourusername/JDParty.git
cd JDParty
```

### 3. Configure Spotify

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Note your **Client ID** and **Client Secret**
4. Add this Redirect URI: `http://localhost:8080/api/auth/spotify/callback`

5. Create environment file:
   ```bash
   cp packages/server/.env.example packages/server/.env
   ```

6. Edit `packages/server/.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

### 4. Install & Build

#### Option A: Automatic (Recommended)
```bash
./build-only.sh
```

#### Option B: Manual
```bash
pnpm install
pnpm --filter @jdparty/shared build
pnpm --filter @jdparty/server build
pnpm --filter @jdparty/pwa build
```

### 5. Run Application

#### Option A: Interactive
```bash
./start.sh
```

Choose from menu:
1. Development mode (recommended for first run)
2. Production mode
3. Server only
4. PWA only

#### Option B: Development Mode
```bash
pnpm dev
```

Access at:
- Server: http://localhost:8080
- PWA: http://localhost:3000

#### Option C: Production Mode
```bash
cd packages/server
NODE_ENV=production node dist/index.js
```

---

## iOS PWA Installation

### From iPhone/iPad:

1. Make sure JDParty is running on your computer

2. Find your computer's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. On your iOS device, open Safari

4. Go to: `http://YOUR_IP_ADDRESS:3000`

5. Tap the Share button (square with arrow)

6. Tap "Add to Home Screen"

7. Tap "Add"

8. Launch JDParty from your home screen!

---

## DMX Hardware Setup

### USB DMX Interface

1. Connect your USB DMX adapter
2. JDParty will auto-detect FTDI-based devices
3. Check server logs for detected interfaces

### Art-Net (Network DMX)

1. Ensure Art-Net devices are on same network
2. Set DMX interface in `.env`:
   ```env
   DMX_INTERFACE=artnet
   ```
3. Default broadcasts to `255.255.255.255:6454`

---

## Troubleshooting

### "Port 8080 already in use"

```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### "Spotify authentication failed"

1. Check `.env` has correct credentials
2. Verify redirect URI in Spotify dashboard
3. Try reconnecting in Settings

### "pnpm not found"

```bash
npm install -g pnpm
```

### "Build failed"

```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules
pnpm install
./build-only.sh
```

### "Can't connect from iOS"

1. Verify both devices on same Wi-Fi
2. Check firewall allows port 3000/8080
3. Try using computer's hostname instead of IP

---

## Verify Installation

Run these checks:

```bash
# Check Node version
node --version    # Should be 18+

# Check pnpm version
pnpm --version    # Should be 8+

# Check builds completed
ls packages/shared/dist
ls packages/server/dist
ls packages/pwa/dist

# Test server health
curl http://localhost:8080/health
```

Should return:
```json
{
  "status": "ok",
  "version": "1.0.0",
  ...
}
```

---

## Next Steps

After installation:

1. **Connect Spotify** (Settings → Connect Spotify)
2. **Patch Fixtures** (see fixture library)
3. **Test Scenes** (5 sample scenes included)
4. **Enable Auto Mode** (Dashboard → Auto: ON)
5. **Play Music** and watch the lights sync!

---

## Getting Help

- **Documentation**: See `docs/` folder
- **Issues**: https://github.com/yourusername/jdparty/issues
- **Quick Start**: `QUICKSTART.md`
- **Development**: `docs/DEVELOPMENT.md`

---

**Installation complete! Enjoy JDParty! 🎉**
