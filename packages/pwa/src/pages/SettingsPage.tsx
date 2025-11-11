import { useStore } from '../store';
import { api } from '../services/api';

export function SettingsPage() {
  const { serverUrl, systemStatus, disconnect, setServerUrl } = useStore();

  const handleDisconnect = () => {
    if (confirm('Disconnect from server?')) {
      disconnect();
      setServerUrl('');
    }
  };

  const handleConnectSpotify = async () => {
    try {
      const authUrl = await api.getSpotifyAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      alert(`Could not connect to Spotify: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Connection */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">Connection</h2>
        <div className="text-sm text-slate-400">
          <p>Server: {serverUrl}</p>
          <p className="mt-1">
            Status:{' '}
            <span className="text-green-400">✓ Connected</span>
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* System Info */}
      {systemStatus && (
        <div className="bg-slate-800 rounded-lg p-4 space-y-2">
          <h2 className="text-lg font-semibold text-white mb-3">System Information</h2>
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow
            label="DMX Status"
            value={systemStatus.dmxActive ? 'Active' : 'Inactive'}
          />
          <InfoRow
            label="Spotify"
            value={systemStatus.spotifyConnected ? 'Connected' : 'Not Connected'}
          />
          {!systemStatus.spotifyConnected && (
            <button
              onClick={handleConnectSpotify}
              className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Connect to Spotify
            </button>
          )}
          <InfoRow label="Interfaces" value={`${systemStatus.dmxInterfaces.length}`} />
          <InfoRow label="Clients" value={`${systemStatus.connectedClients}`} />
          <InfoRow
            label="Uptime"
            value={formatUptime(systemStatus.uptime)}
          />
        </div>
      )}

      {/* Appearance */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">Appearance</h2>
        <p className="text-sm text-slate-400">Theme: Dark (default)</p>
      </div>

      {/* About */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold text-white mb-3">About</h2>
        <InfoRow label="App" value="JDParty PWA" />
        <InfoRow label="Version" value="1.0.0" />
        <InfoRow label="License" value="MIT" />
        <p className="text-xs text-slate-500 pt-2">
          Music-reactive DMX lighting controller
        </p>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <a
          href="https://github.com/yourusername/jdparty"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-center font-medium transition-colors"
        >
          📚 Documentation
        </a>
        <a
          href="https://github.com/yourusername/jdparty/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-center font-medium transition-colors"
        >
          🐛 Report Issue
        </a>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}:</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
