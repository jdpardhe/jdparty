#!/bin/bash

# GetSongBPM API Test Script
# Tests the GetSongBPM API with your API key

API_KEY="2f6bea9df8e30cec9670c0c9e03e789b"

echo "🎵 GetSongBPM API Test Script"
echo "============================="
echo ""

# Test with a known song
ARTIST="Daft Punk"
TITLE="Get Lucky"

echo "Testing with:"
echo "  Artist: $ARTIST"
echo "  Title: $TITLE"
echo ""

# Step 1: Search for the song
SEARCH_URL="https://api.getsongbpm.com/search/?api_key=${API_KEY}&type=song&lookup=song:$(echo "$TITLE" | sed 's/ /+/g')+artist:$(echo "$ARTIST" | sed 's/ /+/g')"

echo "🔍 Step 1: Searching for song..."
echo "  URL: $SEARCH_URL"
echo ""

SEARCH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$SEARCH_URL")
HTTP_STATUS=$(echo "$SEARCH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
SEARCH_BODY=$(echo "$SEARCH_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Search successful!"
    echo ""

    # Extract song ID
    SONG_ID=$(echo "$SEARCH_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('search', [{}])[0].get('id', ''))" 2>/dev/null)

    if [ -n "$SONG_ID" ]; then
        echo "Found Song ID: $SONG_ID"
        echo ""

        # Step 2: Get song details
        SONG_URL="https://api.getsongbpm.com/song/?api_key=${API_KEY}&id=${SONG_ID}"

        echo "🎵 Step 2: Getting song details..."
        echo "  URL: $SONG_URL"
        echo ""

        SONG_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$SONG_URL")
        HTTP_STATUS=$(echo "$SONG_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
        SONG_BODY=$(echo "$SONG_RESPONSE" | sed '/HTTP_STATUS/d')

        echo "Status Code: $HTTP_STATUS"
        echo ""

        if [ "$HTTP_STATUS" = "200" ]; then
            echo "✅ Success! Song Details:"
            echo ""

            TEMPO=$(echo "$SONG_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('song', {}).get('tempo', 'N/A'))" 2>/dev/null)
            KEY=$(echo "$SONG_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('song', {}).get('key_of', 'N/A'))" 2>/dev/null)
            TIME_SIG=$(echo "$SONG_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('song', {}).get('time_sig', 'N/A'))" 2>/dev/null)

            echo "  🎵 Title: $TITLE"
            echo "  🎤 Artist: $ARTIST"
            echo "  ⏱️  Tempo: $TEMPO BPM"
            echo "  🎹 Key: $KEY"
            echo "  📊 Time Signature: $TIME_SIG"
        else
            echo "❌ Failed to get song details"
            echo "Response:"
            echo "$SONG_BODY"
        fi
    else
        echo "❌ No song found in search results"
        echo "Search response:"
        echo "$SEARCH_BODY" | python3 -m json.tool 2>/dev/null || echo "$SEARCH_BODY"
    fi
else
    echo "❌ Search failed"
    echo "Response:"
    echo "$SEARCH_BODY"
fi

echo ""
echo "============================="
echo ""

# Now test with current playing track from Spotify
echo "🎵 Test with your current Spotify track"
read -p "Enter track title: " USER_TITLE
read -p "Enter artist name: " USER_ARTIST

if [ -n "$USER_TITLE" ] && [ -n "$USER_ARTIST" ]; then
    echo ""
    echo "Testing with:"
    echo "  Artist: $USER_ARTIST"
    echo "  Title: $USER_TITLE"
    echo ""

    # Step 1: Search
    SEARCH_URL="https://api.getsongbpm.com/search/?api_key=${API_KEY}&type=song&lookup=song:$(echo "$USER_TITLE" | sed 's/ /+/g')+artist:$(echo "$USER_ARTIST" | sed 's/ /+/g')"

    echo "🔍 Searching..."
    SEARCH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$SEARCH_URL")
    HTTP_STATUS=$(echo "$SEARCH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    SEARCH_BODY=$(echo "$SEARCH_RESPONSE" | sed '/HTTP_STATUS/d')

    if [ "$HTTP_STATUS" = "200" ]; then
        SONG_ID=$(echo "$SEARCH_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('search', [{}])[0].get('id', ''))" 2>/dev/null)

        if [ -n "$SONG_ID" ]; then
            echo "Found Song ID: $SONG_ID"

            # Step 2: Get details
            SONG_URL="https://api.getsongbpm.com/song/?api_key=${API_KEY}&id=${SONG_ID}"
            SONG_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$SONG_URL")
            HTTP_STATUS=$(echo "$SONG_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
            SONG_BODY=$(echo "$SONG_RESPONSE" | sed '/HTTP_STATUS/d')

            if [ "$HTTP_STATUS" = "200" ]; then
                echo "✅ Success!"
                echo ""

                TEMPO=$(echo "$SONG_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('song', {}).get('tempo', 'N/A'))" 2>/dev/null)
                KEY=$(echo "$SONG_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('song', {}).get('key_of', 'N/A'))" 2>/dev/null)
                TIME_SIG=$(echo "$SONG_BODY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('song', {}).get('time_sig', 'N/A'))" 2>/dev/null)

                echo "  ⏱️  Tempo: $TEMPO BPM"
                echo "  🎹 Key: $KEY"
                echo "  📊 Time Signature: $TIME_SIG"
            else
                echo "❌ Failed to get song details"
            fi
        else
            echo "❌ Song not found in database"
        fi
    else
        echo "❌ Search failed"
    fi
fi

echo ""
echo "Test complete!"
