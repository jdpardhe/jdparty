# JDParty Development Roadmap

## Version 1.0 MVP ✅ (Current - Week 12)

**Goal:** Core functionality for basic music-reactive lighting control

### Features
- [x] Single DMX universe (USB + Art-Net)
- [x] Basic fixture library (20 common fixtures)
- [x] Static scenes with BPM assignment
- [x] Spotify integration
- [x] BPM detection from Spotify Audio Features
- [x] Beat clock with real-time synchronization
- [x] iOS Progressive Web App controller
- [x] Automatic scene selection based on BPM
- [x] Manual fixture control interface
- [x] WebSocket real-time updates
- [x] REST API for all operations
- [x] SQLite database
- [x] macOS desktop app (Electron wrapper)

### Limitations
- Single universe only
- No animations (static scenes only)
- No custom fixture profiles (use pre-loaded)
- No visual fixture layout
- No MIDI support
- Basic fade engine

---

## Version 1.5: Enhanced Control (Weeks 13-24)

**Goal:** Professional features and better scene control

### Features
- [ ] **4 Universe Support**
  - Universe routing and management
  - sACN/E1.31 protocol
  - Network DMX node discovery

- [ ] **Expanded Fixture Library**
  - 150+ fixture profiles
  - Custom fixture profile creator UI
  - Import/export fixture definitions
  - Fixture grouping system

- [ ] **Animation System**
  - Step animations (2-16 steps)
  - Transition animations with keyframes
  - Timeline-based animation editor
  - BPM-synchronized playback
  - Animation preview at different BPMs

- [ ] **Advanced Scene Features**
  - Scene folders and categories
  - Search and filtering
  - Scene favorites
  - Scene templates
  - Usage analytics and statistics

- [ ] **Multi-Client Support**
  - 5+ simultaneous PWA controllers
  - Optimistic UI updates
  - Conflict resolution
  - Client management dashboard

- [ ] **Enhanced PWA**
  - Gesture controls (swipe, long-press)
  - Offline scene browsing
  - Better mobile performance
  - Haptic feedback

### Technical Improvements
- Improved fade engine with easing curves
- Better DMX frame rate control
- WebSocket message optimization
- Database schema versioning

---

## Version 2.0: Intelligence (Weeks 25-40)

**Goal:** Smart automation and multi-zone support

### Features
- [ ] **Advanced Animations**
  - Wave animations (propagating effects)
  - Strobe/flash effects on beat
  - Animation chaining
  - Symmetry tools

- [ ] **Scene Intelligence**
  - Track scene usage statistics
  - Smart scene recommendations
  - Energy-level matching
  - Genre-based filtering
  - Machine learning scene suggestions

- [ ] **Multi-Zone Support**
  - Define multiple lighting zones
  - Independent scene control per zone
  - Zone synchronization
  - Zone-specific fixture groups

- [ ] **Additional Music Services**
  - Apple Music API integration
  - Generic audio analysis fallback
  - Manual track metadata entry
  - Local file BPM detection

- [ ] **Enhanced Beat Sync**
  - Audio analysis for precise timing
  - Downbeat detection
  - Phrase detection (16/32 bars)
  - Tempo smoothing improvements

### UI Improvements
- Visual beat indicators
- Scene preview thumbnails
- Drag-and-drop scene organization
- Better animation editor

---

## Version 2.5: Professional (Weeks 41-56)

**Goal:** Professional features for live shows and installations

### Features
- [ ] **Timeline/Cue System**
  - Timeline editor interface
  - Time-coded cue list
  - Cue triggers and automation
  - Loop and repeat functionality

- [ ] **Visual Fixture Layout**
  - 2D fixture layout editor
  - Visual fixture representation
  - Spatial effect preview
  - Interactive fixture selection

- [ ] **MIDI Integration**
  - MIDI input device support
  - MIDI learn functionality
  - MIDI scene triggering
  - MIDI controller mapping
  - DAW synchronization

- [ ] **8+ Universe Support**
  - Expand universe capacity
  - Performance optimization
  - Universe grouping

- [ ] **Advanced Effects**
  - Chase effects
  - Random/sparkle effects
  - Matrix effects
  - Pixel mapping

### Professional Tools
- Show recording and playback
- Timecode synchronization (SMPTE)
- Multi-room/venue support
- Network backup and sync

---

## Version 3.0: Ecosystem (Future)

**Goal:** Complete ecosystem with plugins and integrations

### Features
- [ ] **Plugin System**
  - Plugin SDK for developers
  - Music source plugins (YouTube Music, etc.)
  - DMX protocol plugins
  - Effect generator plugins
  - Integration plugins

- [ ] **Public API**
  - RESTful API for third-party apps
  - Webhook support
  - OAuth for secure access
  - GraphQL interface option
  - Client libraries (Python, JS, Swift)

- [ ] **Home Automation**
  - HomeKit integration
  - Home Assistant support
  - Voice control (Siri shortcuts)
  - Calendar integration

- [ ] **Cloud Features**
  - Cloud scene sharing
  - Community scene marketplace
  - Cloud backup and sync
  - Multi-device show sync

- [ ] **Windows Support**
  - Windows desktop application
  - Windows-compatible DMX interfaces

- [ ] **Web-Based Editor**
  - Full-featured web app (not just PWA)
  - Browser-based fixture layout editor
  - Cloud-based show management

---

## Feature Requests & Community Feedback

We track feature requests on GitHub Issues with the `enhancement` label. Vote on features you want to see!

### Top Community Requests
- Android PWA support
- Integration with Hue, Nanoleaf, etc.
- Video content reactive lighting
- Audio input (microphone) reactive mode
- Laser support
- Video projection mapping

---

## Development Priorities

### Performance
- Maintain <10ms DMX latency
- Support 10+ clients without degradation
- Optimize WebSocket bandwidth
- Improve startup time

### Reliability
- 99.9% uptime for DMX output
- Automatic error recovery
- Better logging and diagnostics
- Comprehensive test coverage

### User Experience
- One-click setup wizard
- Better onboarding flow
- More fixture profiles
- Video tutorials
- Better documentation

---

## How to Influence the Roadmap

1. **Vote on Issues** - Add 👍 to issues you want
2. **Submit Feature Requests** - Open a GitHub issue
3. **Contribute Code** - See [DEVELOPMENT.md](./DEVELOPMENT.md)
4. **Join Discussions** - Participate in Discord/forums
5. **Sponsor Development** - Support via GitHub Sponsors

---

## Version History

| Version | Release Date | Status |
|---------|-------------|--------|
| 1.0 MVP | TBD | In Development ✅ |
| 1.5 Enhanced | TBD | Planned |
| 2.0 Intelligence | TBD | Planned |
| 2.5 Professional | TBD | Planned |
| 3.0 Ecosystem | TBD | Planned |

---

**Last Updated:** November 10, 2025
