#!/bin/bash

# Spotify API Test Script
# This script will help you test Spotify API endpoints

CLIENT_ID="e6cc6dfb60b24b5e812be7f0da9e10d3"
CLIENT_SECRET="8d547c041461433c815b8e33fb442f95"

echo "🎵 Spotify API Test Script"
echo "=========================="
echo ""

# Step 1: Get the access token from your running app's database
echo "📝 Step 1: We need your current Spotify access token"
echo "To get it, run this command in another terminal while your server is running:"
echo ""
echo "  sqlite3 packages/server/data/jdparty.db 'SELECT value FROM settings WHERE key=\"spotify_tokens\";'"
echo ""
read -p "Paste your access token here (the value after 'accessToken':): " ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token provided. Exiting."
    exit 1
fi

echo ""
echo "🎵 Testing currently playing track..."
CURRENT_TRACK=$(curl -s -X GET "https://api.spotify.com/v1/me/player/currently-playing" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

# Use Python to parse JSON (more reliable than grep)
TRACK_ID=$(echo "$CURRENT_TRACK" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('item', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TRACK_ID" ]; then
    echo "❌ No track currently playing or couldn't get track ID"
    exit 1
fi

TRACK_NAME=$(echo "$CURRENT_TRACK" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('item', {}).get('name', 'Unknown'))" 2>/dev/null)
echo "✅ Currently playing: $TRACK_NAME"
echo "✅ Track ID: $TRACK_ID"
echo ""

# Test audio-features endpoint
echo "🎵 Testing audio-features endpoint..."
echo "URL: https://api.spotify.com/v1/audio-features/$TRACK_ID"
AUDIO_FEATURES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
    "https://api.spotify.com/v1/audio-features/$TRACK_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$AUDIO_FEATURES" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE=$(echo "$AUDIO_FEATURES" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Audio features retrieved successfully!"
    TEMPO=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"Tempo: {data.get('tempo', 'N/A')} BPM\")" 2>/dev/null)
    echo "$TEMPO"
else
    echo "❌ Failed to get audio features"
    echo "$RESPONSE"
fi

echo ""
echo "🎵 Testing audio-analysis endpoint..."
echo "URL: https://api.spotify.com/v1/audio-analysis/$TRACK_ID"
AUDIO_ANALYSIS=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
    "https://api.spotify.com/v1/audio-analysis/$TRACK_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$AUDIO_ANALYSIS" | grep "HTTP_STATUS" | cut -d: -f2)

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Audio analysis retrieved successfully!"
    echo "Tempo found in analysis"
else
    RESPONSE=$(echo "$AUDIO_ANALYSIS" | sed '/HTTP_STATUS/d')
    echo "❌ Failed to get audio analysis"
    echo "$RESPONSE"
fi

echo ""
echo "=========================="
echo "Test complete!"
echo ""
echo "Summary:"
echo "--------"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Your Spotify app has access to audio features!"
    echo "   The server should work now. Try restarting it."
else
    echo "❌ Your Spotify app is in Development Mode and restricted"
    echo ""
    echo "Solutions:"
    echo "1. Request Extended Quota Mode at: https://developer.spotify.com/dashboard"
    echo "2. Or use the manual BPM setting feature in the app"
fi
