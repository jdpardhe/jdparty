# Getting Started with JDParty

Welcome to JDParty! This guide will help you get up and running with the v1.0 MVP.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- **macOS** 12 (Monterey) or higher (for desktop app)
- **Spotify Premium** account (for music integration)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/JDParty.git
cd JDParty
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all packages in the monorepo.

### 3. Build Packages

```bash
pnpm build
```

## Configuration

### Spotify API Setup

1. Go to https://developer.spotify.com/dashboard
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Add `http://localhost:8080/api/auth/spotify/callback` to Redirect URIs
5. Create `.env` file in `packages/server`:

```bash
cp packages/server/.env.example packages/server/.env
```

6. Edit `.env` and add your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### DMX Interface Setup (Optional)

If you have a USB DMX interface:

1. Connect your USB DMX adapter
2. The server will auto-detect FTDI-based devices
3. Check server logs for detected interfaces

For Art-Net (network DMX):

1. Configure your network settings in the app
2. Ensure Art-Net devices are on the same network
3. Default Art-Net port is 6454

## Running the Application

### Development Mode

#### Option 1: Run All Services (Recommended)

```bash
pnpm dev
```

This starts:
- Server (backend) on `http://localhost:8080`
- PWA (web interface) on `http://localhost:3000`
- Desktop app (Electron wrapper)

#### Option 2: Run Services Individually

**Terminal 1 - Server:**
```bash
pnpm server
```

**Terminal 2 - PWA:**
```bash
pnpm pwa
```

**Terminal 3 - Desktop App:**
```bash
pnpm desktop
```

### Production Build

```bash
# Build all packages
pnpm build

# Run server
cd packages/server
pnpm start

# Or run desktop app
cd packages/desktop
pnpm start
```

## First Time Setup

### 1. Connect to Spotify

1. Open the app (desktop or browser at `http://localhost:3000`)
2. Go to Settings
3. Click "Connect Spotify"
4. Authorize the application
5. You should see "Connected" status

### 2. Create Your First Scene

1. Play a song on Spotify
2. Go to the Control tab
3. Adjust lighting (currently manual for MVP)
4. Click "Save Scene"
5. Name it and assign a BPM range

### 3. Enable Auto Mode

1. Go to Dashboard
2. Toggle "Auto Mode" on
3. Scenes will now automatically switch based on BPM

## Using the iOS PWA

### Connect from iPhone/iPad

1. Ensure your iOS device is on the same Wi-Fi network
2. Find your computer's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. Open Safari on iOS
4. Navigate to `http://YOUR_IP:3000`
5. Tap the Share button
6. Select "Add to Home Screen"
7. Launch the app from your home screen

### Quick Connection

The PWA will remember your server URL, so you only need to set it up once.

## Troubleshooting

### Server Won't Start

**Problem:** Port 8080 already in use
**Solution:**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

**Problem:** Database errors
**Solution:**
```bash
# Delete and recreate database
rm packages/server/data/jdparty.db
pnpm server
```

### Spotify Won't Connect

**Problem:** "Invalid redirect URI"
**Solution:** Ensure `http://localhost:8080/api/auth/spotify/callback` is in your Spotify app settings

**Problem:** Token expired
**Solution:** The app will auto-refresh tokens, but you can reconnect manually in Settings

### DMX Not Working

**Problem:** No DMX output
**Solution:**
- Check USB connection
- Verify FTDI drivers are installed
- Check server logs for errors
- Test with a simple scene

**Problem:** Art-Net not detected
**Solution:**
- Verify network connection
- Check firewall settings (allow port 6454)
- Ensure Art-Net devices are on same subnet

### PWA Won't Connect

**Problem:** Can't connect from mobile
**Solution:**
- Verify devices are on same network
- Check IP address is correct
- Disable VPN on mobile device
- Try using computer's hostname instead of IP

## Next Steps

- [User Guide](./USER_GUIDE.md) - Learn how to use all features
- [API Documentation](./API.md) - Integrate with JDParty
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

## Getting Help

- GitHub Issues: https://github.com/yourusername/jdparty/issues
- Documentation: https://docs.jdparty.app
- Discord: https://discord.gg/jdparty

## What's Next?

Now that you're set up, check out:

1. **Create more scenes** - Build a library for different moods
2. **Assign BPM ranges** - Let auto mode do the work
3. **Control from mobile** - Use the PWA for hands-free control
4. **Explore manual control** - Fine-tune your lighting

Enjoy JDParty! 🎉
