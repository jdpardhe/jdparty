import { useState } from 'react';
import { useStore } from '../store';

export function ConnectionPage() {
  const [serverUrl, setServerUrlInput] = useState('');
  const [error, setError] = useState('');
  const { setServerUrl: saveServerUrl } = useStore();

  const handleConnect = async () => {
    setError('');

    // Validate URL
    let url = serverUrl.trim();
    if (!url) {
      setError('Please enter a server URL');
      return;
    }

    // Add http:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }

    // Remove trailing slash
    url = url.replace(/\/$/, '');

    try {
      // Test connection
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error('Server not responding');
      }

      // Save and connect
      saveServerUrl(url);
      window.location.reload();
    } catch (err: any) {
      setError('Could not connect to server. Please check the URL and try again.');
      console.error('Connection error:', err);
    }
  };

  const handleQuickConnect = (url: string) => {
    setServerUrlInput(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">JDParty</h1>
          <p className="text-slate-400">Music-reactive lighting controller</p>
        </div>

        {/* Connection Form */}
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Server URL
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="localhost:8080"
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              Enter the IP address or hostname of your JDParty server
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={!serverUrl}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-colors"
          >
            Connect
          </button>
        </div>

        {/* Quick Connect */}
        <div className="bg-slate-800 rounded-lg p-6 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Quick Connect</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleQuickConnect('localhost:8080')}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors text-left px-4"
            >
              💻 localhost:8080
            </button>
            <button
              onClick={() => handleQuickConnect('192.168.1.100:8080')}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors text-left px-4"
            >
              🏠 192.168.1.100:8080
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="text-center text-sm text-slate-500 space-y-2">
          <p>Need help? Make sure:</p>
          <ul className="space-y-1">
            <li>✓ JDParty server is running</li>
            <li>✓ Your device is on the same network</li>
            <li>✓ Firewall allows port 8080</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
