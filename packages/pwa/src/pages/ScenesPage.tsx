import { useState, useMemo } from 'react';
import { SceneCard } from '../components/SceneCard';
import { useStore } from '../store';
import type { SceneCategory } from '@jdparty/shared';

export function ScenesPage() {
  const { scenes } = useStore();
  const [filter, setFilter] = useState<'all' | 'favorites' | string>('all');
  const [search, setSearch] = useState('');

  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      // Search filter
      if (search && !scene.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filter === 'all') return true;
      if (filter === 'favorites') return scene.isFavorite;
      return scene.category === filter;
    });
  }, [scenes, filter, search]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Scenes</h1>
        <span className="text-sm text-slate-400">{filteredScenes.length} scenes</span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search scenes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
        />
        <FilterButton
          active={filter === 'favorites'}
          onClick={() => setFilter('favorites')}
          label="⭐ Favorites"
        />
        <FilterButton
          active={filter === 'ambient'}
          onClick={() => setFilter('ambient')}
          label="🌙 Ambient"
        />
        <FilterButton
          active={filter === 'energetic'}
          onClick={() => setFilter('energetic')}
          label="⚡ Energetic"
        />
        <FilterButton
          active={filter === 'strobe'}
          onClick={() => setFilter('strobe')}
          label="✨ Strobe"
        />
        <FilterButton
          active={filter === 'color'}
          onClick={() => setFilter('color')}
          label="🌈 Color"
        />
      </div>

      {/* Scenes Grid */}
      {filteredScenes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">No scenes found</p>
          <p className="text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
          {filteredScenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function FilterButton({ active, onClick, label }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
