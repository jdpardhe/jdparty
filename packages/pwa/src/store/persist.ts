/**
 * Zustand Persist Middleware
 * Simple localStorage persistence
 */

export const persist = <T extends object>(
  config: (set: any, get: any) => T,
  options: { name: string; partialize?: (state: T) => Partial<T> }
) => {
  return (set: any, get: any, api: any) => {
    // Wrap set to persist changes
    const wrappedSet = (partial: any) => {
      set(partial);
      const state = get();
      const toStore = options.partialize ? options.partialize(state) : state;
      try {
        localStorage.setItem(options.name, JSON.stringify(toStore));
      } catch (error) {
        console.error('Failed to save state to localStorage:', error);
      }
    };

    // Get initial state from config
    const initialState = config(wrappedSet, get);

    // Load from localStorage and merge
    try {
      const stored = localStorage.getItem(options.name);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.assign(initialState, parsed);
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
    }

    return initialState;
  };
};
