import type { Scene } from '@jdparty/shared';
import { useStore } from '../store';
import clsx from 'clsx';

interface SceneCardProps {
  scene: Scene;
  compact?: boolean;
}

export function SceneCard({ scene, compact = false }: SceneCardProps) {
  const { triggerScene, currentSceneId } = useStore();
  const isActive = currentSceneId === scene.id;

  const handleClick = () => {
    triggerScene(scene.id, 1);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={clsx(
          'w-full p-3 rounded-lg text-left transition-all',
          'active:scale-95',
          isActive
            ? 'bg-primary-600 text-white shadow-lg'
            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{scene.name}</h3>
            {scene.bpmRange && (
              <p className="text-xs opacity-75 mt-1">
                {Math.round(scene.bpmRange.min)}-{Math.round(scene.bpmRange.max)} BPM
              </p>
            )}
          </div>
          {scene.isFavorite && <span className="ml-2">⭐</span>}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full rounded-lg overflow-hidden transition-all',
        'active:scale-95 shadow-lg',
        isActive
          ? 'ring-2 ring-primary-400 shadow-primary-500/50'
          : 'hover:shadow-xl'
      )}
    >
      {/* Thumbnail or gradient background */}
      <div
        className={clsx(
          'h-32 bg-gradient-to-br',
          getCategoryGradient(scene.category)
        )}
      >
        {scene.thumbnail ? (
          <img
            src={scene.thumbnail}
            alt={scene.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getCategoryEmoji(scene.category)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-800 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{scene.name}</h3>
            {scene.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                {scene.description}
              </p>
            )}
            {scene.bpmRange && (
              <p className="text-xs text-slate-500 mt-2">
                {Math.round(scene.bpmRange.min)}-{Math.round(scene.bpmRange.max)} BPM
              </p>
            )}
          </div>
          {scene.isFavorite && <span className="ml-2 text-xl">⭐</span>}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span className="capitalize">{scene.category}</span>
          <span>{scene.usageCount} uses</span>
        </div>
      </div>

      {isActive && (
        <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
          Active
        </div>
      )}
    </button>
  );
}

function getCategoryGradient(category: string): string {
  switch (category) {
    case 'ambient':
      return 'from-blue-500 to-purple-600';
    case 'energetic':
      return 'from-red-500 to-orange-600';
    case 'strobe':
      return 'from-yellow-400 to-red-600';
    case 'color':
      return 'from-pink-500 to-purple-600';
    default:
      return 'from-slate-600 to-slate-700';
  }
}

function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'ambient':
      return '🌙';
    case 'energetic':
      return '⚡';
    case 'strobe':
      return '✨';
    case 'color':
      return '🌈';
    default:
      return '💡';
  }
}
