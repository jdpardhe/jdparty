import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FixtureProfile {
  id: string;
  manufacturer: string;
  model: string;
  shortName: string;
  category: string;
  modes: Array<{
    name: string;
    channelCount: number;
  }>;
  defaultMode: number;
}

interface PatchedFixture {
  id: string;
  profileId: string;
  universeId: number;
  address: number;
  name: string;
  mode: number;
  values: number[];
}

export function FixturePatchingPage() {
  const [profiles, setProfiles] = useState<FixtureProfile[]>([]);
  const [fixtures, setFixtures] = useState<PatchedFixture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<FixtureProfile | null>(null);
  const [showPatchDialog, setShowPatchDialog] = useState(false);
  const [patchForm, setPatchForm] = useState({
    universeId: 1,
    address: 1,
    name: '',
    mode: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesData, fixturesData] = await Promise.all([
        api.getFixtureProfiles(),
        api.getFixtures(),
      ]);
      setProfiles(profilesData);
      setFixtures(fixturesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const query = searchQuery.toLowerCase();
    return (
      profile.manufacturer.toLowerCase().includes(query) ||
      profile.model.toLowerCase().includes(query) ||
      profile.shortName.toLowerCase().includes(query)
    );
  });

  const handleSelectProfile = (profile: FixtureProfile) => {
    setSelectedProfile(profile);
    setPatchForm({
      ...patchForm,
      name: profile.shortName,
      mode: profile.defaultMode,
    });
    setShowPatchDialog(true);
  };

  const handlePatch = async () => {
    if (!selectedProfile) return;

    try {
      await api.patchFixture({
        profileId: selectedProfile.id,
        universeId: patchForm.universeId,
        address: patchForm.address,
        name: patchForm.name,
        mode: patchForm.mode,
      });
      await loadData();
      setShowPatchDialog(false);
      setSelectedProfile(null);
    } catch (error: any) {
      alert(`Failed to patch fixture: ${error.message}`);
    }
  };

  const handleUnpatch = async (fixtureId: string) => {
    if (!confirm('Are you sure you want to unpatch this fixture?')) return;

    try {
      await api.unpatchFixture(fixtureId);
      await loadData();
    } catch (error: any) {
      alert(`Failed to unpatch fixture: ${error.message}`);
    }
  };

  const getNextAvailableAddress = () => {
    if (fixtures.length === 0) return 1;
    const addresses = fixtures
      .filter((f) => f.universeId === patchForm.universeId)
      .map((f) => f.address);
    return Math.max(...addresses, 0) + 1;
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Fixture Patching</h1>
        <p className="text-slate-400 text-sm mt-1">
          Patch fixtures to DMX universes and addresses
        </p>
      </div>

      {/* Patched Fixtures */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Patched Fixtures ({fixtures.length})</h2>
        {fixtures.length === 0 ? (
          <p className="text-slate-400 text-center py-4">
            No fixtures patched yet. Select a fixture profile below to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {fixtures.map((fixture) => {
              const profile = profiles.find((p) => p.id === fixture.profileId);
              return (
                <div
                  key={fixture.id}
                  className="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-medium">{fixture.name}</div>
                    <div className="text-slate-400 text-sm">
                      {profile?.manufacturer} {profile?.model} • Universe {fixture.universeId} @ {fixture.address}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnpatch(fixture.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Unpatch
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixture Library */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Fixture Library</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search fixtures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
        />

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="text-white font-medium">{profile.shortName}</div>
              <div className="text-slate-400 text-sm">
                {profile.manufacturer} {profile.model}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {profile.modes.length} modes • {profile.category}
              </div>
            </button>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <p className="text-slate-400 text-center py-8">No fixtures found matching your search.</p>
        )}
      </div>

      {/* Patch Dialog */}
      {showPatchDialog && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-white">
              Patch {selectedProfile.shortName}
            </h3>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Fixture Name
                </label>
                <input
                  type="text"
                  value={patchForm.name}
                  onChange={(e) => setPatchForm({ ...patchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Universe */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Universe
                </label>
                <select
                  value={patchForm.universeId}
                  onChange={(e) => setPatchForm({ ...patchForm, universeId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>Universe 1</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  DMX Address
                </label>
                <input
                  type="number"
                  min={1}
                  max={512}
                  value={patchForm.address}
                  onChange={(e) => setPatchForm({ ...patchForm, address: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => setPatchForm({ ...patchForm, address: getNextAvailableAddress() })}
                  className="text-xs text-primary-400 hover:text-primary-300 mt-1"
                >
                  Use next available: {getNextAvailableAddress()}
                </button>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Mode
                </label>
                <select
                  value={patchForm.mode}
                  onChange={(e) => setPatchForm({ ...patchForm, mode: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {selectedProfile.modes.map((mode, index) => (
                    <option key={index} value={index}>
                      {mode.name} ({mode.channelCount} channels)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowPatchDialog(false);
                  setSelectedProfile(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePatch}
                disabled={!patchForm.name}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                Patch Fixture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
