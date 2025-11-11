import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { websocket } from '../services/websocket';
import { RGBColorPicker } from '../components/RGBColorPicker';

interface PatchedFixture {
  id: string;
  profileId: string;
  universeId: number;
  address: number;
  name: string;
  mode: number;
  values: number[];
}

interface FixtureProfile {
  id: string;
  manufacturer: string;
  model: string;
  shortName: string;
  channels: Array<{
    type: string;
    name: string;
    defaultValue: number;
  }>;
}

interface FixtureGroup {
  id: string;
  name: string;
  fixtureIds: string[];
}

export function ControlPage() {
  const { masterDimmer, setMasterDimmer, toggleBlackout, isBlackout } = useStore();
  const [fixtures, setFixtures] = useState<PatchedFixture[]>([]);
  const [groups, setGroups] = useState<FixtureGroup[]>([]);
  const [profiles, setProfiles] = useState<Map<string, FixtureProfile>>(new Map());
  const [selectedFixture, setSelectedFixture] = useState<PatchedFixture | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FixtureGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Subscribe to fixture updates via WebSocket
    websocket.subscribeToFixtures();

    // Handle fixture value changes from other clients
    const handleFixtureValuesChanged = ({ fixtureId, values }: { fixtureId: string; values: number[] }) => {
      setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, values } : f));

      // Update selected fixture if it's the one that changed
      setSelectedFixture(prev => prev?.id === fixtureId ? { ...prev, values } : prev);
    };

    const handleFixturePatched = (fixture: PatchedFixture) => {
      setFixtures(prev => [...prev, fixture]);
    };

    const handleFixtureUnpatched = (fixtureId: string) => {
      setFixtures(prev => prev.filter(f => f.id !== fixtureId));
      if (selectedFixture?.id === fixtureId) {
        setSelectedFixture(null);
      }
    };

    websocket.on('fixtureValuesChanged', handleFixtureValuesChanged);
    websocket.on('fixturePatched', handleFixturePatched);
    websocket.on('fixtureUnpatched', handleFixtureUnpatched);

    return () => {
      websocket.off('fixtureValuesChanged', handleFixtureValuesChanged);
      websocket.off('fixturePatched', handleFixturePatched);
      websocket.off('fixtureUnpatched', handleFixtureUnpatched);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fixturesData, groupsData, profilesData] = await Promise.all([
        api.getFixtures(),
        api.getFixtureGroups(),
        api.getFixtureProfiles(),
      ]);
      setFixtures(fixturesData);
      setGroups(groupsData);

      const profileMap = new Map<string, FixtureProfile>();
      profilesData.forEach((profile: FixtureProfile) => {
        profileMap.set(profile.id, profile);
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFixtureValues = async (fixtureId: string, values: number[]) => {
    try {
      await api.updateFixtureValues(fixtureId, values);
      setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, values } : f));
    } catch (error) {
      console.error('Failed to update fixture:', error);
    }
  };

  const updateGroupValues = async (groupId: string, values: number[]) => {
    try {
      await api.updateFixtureGroupValues(groupId, values);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setFixtures(prev => prev.map(f =>
          group.fixtureIds.includes(f.id) ? { ...f, values } : f
        ));
      }
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleColorChange = (color: { r: number; g: number; b: number }) => {
    if (selectedFixture) {
      const profile = profiles.get(selectedFixture.profileId);
      if (!profile) return;

      const newValues = [...selectedFixture.values];
      const channels = profile.channels;

      // Find RGB channels and update them
      channels.forEach((channel, index) => {
        if (channel.type === 'red' || channel.name.toLowerCase().includes('red')) {
          newValues[index] = color.r;
        } else if (channel.type === 'green' || channel.name.toLowerCase().includes('green')) {
          newValues[index] = color.g;
        } else if (channel.type === 'blue' || channel.name.toLowerCase().includes('blue')) {
          newValues[index] = color.b;
        }
      });

      updateFixtureValues(selectedFixture.id, newValues);
    } else if (selectedGroup) {
      const groupFixtures = fixtures.filter(f => selectedGroup.fixtureIds.includes(f.id));
      groupFixtures.forEach(fixture => {
        const profile = profiles.get(fixture.profileId);
        if (!profile) return;

        const newValues = [...fixture.values];
        const channels = profile.channels;

        channels.forEach((channel, index) => {
          if (channel.type === 'red' || channel.name.toLowerCase().includes('red')) {
            newValues[index] = color.r;
          } else if (channel.type === 'green' || channel.name.toLowerCase().includes('green')) {
            newValues[index] = color.g;
          } else if (channel.type === 'blue' || channel.name.toLowerCase().includes('blue')) {
            newValues[index] = color.b;
          }
        });

        updateFixtureValues(fixture.id, newValues);
      });
    }
  };

  const handleChannelChange = (channelIndex: number, value: number) => {
    if (selectedFixture) {
      const newValues = [...selectedFixture.values];
      newValues[channelIndex] = value;
      updateFixtureValues(selectedFixture.id, newValues);
    } else if (selectedGroup) {
      const groupFixtures = fixtures.filter(f => selectedGroup.fixtureIds.includes(f.id));
      groupFixtures.forEach(fixture => {
        const newValues = [...fixture.values];
        newValues[channelIndex] = value;
        updateFixtureValues(fixture.id, newValues);
      });
    }
  };

  const getCurrentRGB = (): { r: number; g: number; b: number } => {
    if (selectedFixture) {
      const profile = profiles.get(selectedFixture.profileId);
      if (!profile) return { r: 0, g: 0, b: 0 };

      let rgb = { r: 0, g: 0, b: 0 };
      profile.channels.forEach((channel, index) => {
        if (channel.type === 'red' || channel.name.toLowerCase().includes('red')) {
          rgb.r = selectedFixture.values[index] || 0;
        } else if (channel.type === 'green' || channel.name.toLowerCase().includes('green')) {
          rgb.g = selectedFixture.values[index] || 0;
        } else if (channel.type === 'blue' || channel.name.toLowerCase().includes('blue')) {
          rgb.b = selectedFixture.values[index] || 0;
        }
      });
      return rgb;
    }
    return { r: 0, g: 0, b: 0 };
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
      <h1 className="text-2xl font-bold text-white">Manual Control</h1>

      {/* Master Controls */}
      <div className="bg-slate-800 rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">Master Controls</h2>

        {/* Master Dimmer */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-white font-medium">Master Dimmer</label>
            <span className="text-2xl font-bold text-primary-400">
              {Math.round(masterDimmer * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterDimmer * 100}
            onChange={(e) => setMasterDimmer(parseInt(e.target.value) / 100)}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          {/* Preset buttons */}
          <div className="grid grid-cols-5 gap-2 mt-3">
            {[0, 25, 50, 75, 100].map((value) => (
              <button
                key={value}
                onClick={() => setMasterDimmer(value / 100)}
                className="py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-medium transition-colors"
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Blackout Button */}
        <button
          onClick={toggleBlackout}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all active:scale-95 ${
            isBlackout
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          {isBlackout ? '💡 Restore Lights' : '🌑 Blackout All'}
        </button>
      </div>

      {/* Fixture/Group Selection */}
      <div className="bg-slate-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Select Control Target</h2>

        {/* Groups */}
        {groups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fixture Groups</label>
            <div className="grid grid-cols-2 gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedFixture(null);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedGroup?.id === group.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {group.name}
                  <span className="block text-xs opacity-75">
                    {group.fixtureIds.length} fixtures
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Individual Fixtures */}
        {fixtures.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Individual Fixtures</label>
            <div className="grid grid-cols-2 gap-2">
              {fixtures.map((fixture) => (
                <button
                  key={fixture.id}
                  onClick={() => {
                    setSelectedFixture(fixture);
                    setSelectedGroup(null);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedFixture?.id === fixture.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {fixture.name}
                  <span className="block text-xs opacity-75">
                    {fixture.universeId}/{fixture.address}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-center py-4">
            No fixtures patched. Go to the Fixtures page to patch fixtures.
          </p>
        )}
      </div>

      {/* Color Control */}
      {(selectedFixture || selectedGroup) && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Color Control
            {selectedFixture && ` - ${selectedFixture.name}`}
            {selectedGroup && ` - ${selectedGroup.name}`}
          </h2>
          <RGBColorPicker
            value={getCurrentRGB()}
            onChange={handleColorChange}
          />
        </div>
      )}

      {/* Channel Faders */}
      {selectedFixture && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Channel Control - {selectedFixture.name}
          </h2>
          <div className="space-y-4">
            {profiles.get(selectedFixture.profileId)?.channels.map((channel, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 text-sm font-medium">
                    Ch{index + 1}: {channel.name}
                  </label>
                  <span className="text-white text-sm">
                    {selectedFixture.values[index] || 0}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={selectedFixture.values[index] || 0}
                  onChange={(e) => handleChannelChange(index, parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
