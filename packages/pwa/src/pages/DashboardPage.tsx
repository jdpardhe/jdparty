import { NowPlaying } from '../components/NowPlaying';
import { SceneCard } from '../components/SceneCard';
import { useStore } from '../store';

export function DashboardPage() {
  const { scenes, systemStatus, toggleBlackout, isBlackout, masterDimmer, setMasterDimmer } =
    useStore();

  // Get favorite scenes or first 4 scenes
  const quickScenes = scenes.filter((s) => s.isFavorite).slice(0, 4);
  if (quickScenes.length === 0) {
    quickScenes.push(...scenes.slice(0, 4));
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">JDParty</h1>
        <div className="flex items-center space-x-2">
          <StatusDot
            active={systemStatus?.dmxActive || false}
            label="DMX"
          />
          <StatusDot
            active={systemStatus?.spotifyConnected || false}
            label="Spotify"
          />
        </div>
      </div>

      {/* Now Playing */}
      <NowPlaying />

      {/* Quick Controls */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white">Quick Controls</h2>

        {/* Master Dimmer */}
        <div>
          <label className="text-sm text-slate-400 mb-2 block">
            Master Dimmer: {Math.round(masterDimmer * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={masterDimmer * 100}
            onChange={(e) => setMasterDimmer(parseInt(e.target.value) / 100)}
            className="w-full"
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={toggleBlackout}
            className={`py-3 rounded-lg font-medium transition-colors ${
              isBlackout
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {isBlackout ? '💡 Lights On' : '🌑 Blackout'}
          </button>

          <button
            onClick={() => {
              if (systemStatus?.autoModeEnabled) {
                useStore.getState().disableAutoMode();
              } else {
                useStore.getState().enableAutoMode();
              }
            }}
            className={`py-3 rounded-lg font-medium transition-colors ${
              systemStatus?.autoModeEnabled
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {systemStatus?.autoModeEnabled ? '🤖 Auto: ON' : '🤖 Auto: OFF'}
          </button>
        </div>
      </div>

      {/* Quick Access Scenes */}
      {quickScenes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Quick Access</h2>
          <div className="space-y-2">
            {quickScenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} compact />
            ))}
          </div>
        </div>
      )}

      {/* System Info */}
      {systemStatus && (
        <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-400">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Version:</span> 1.0.0
            </div>
            <div>
              <span className="text-slate-500">Clients:</span>{' '}
              {systemStatus.connectedClients}
            </div>
            <div>
              <span className="text-slate-500">Uptime:</span>{' '}
              {Math.floor(systemStatus.uptime / 60)}m
            </div>
            <div>
              <span className="text-slate-500">DMX:</span>{' '}
              {systemStatus.dmxInterfaces.length} interfaces
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusDotProps {
  active: boolean;
  label: string;
}

function StatusDot({ active, label }: StatusDotProps) {
  return (
    <div className="flex items-center space-x-1">
      <div
        className={`w-2 h-2 rounded-full ${
          active ? 'bg-green-500 animate-pulse' : 'bg-slate-600'
        }`}
      />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
