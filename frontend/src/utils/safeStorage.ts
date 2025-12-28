// BlockQuest Official - SSR-Safe Storage Utility
// Provides a safe way to use AsyncStorage that works in SSR environments

// Lazy getter for AsyncStorage - only imports on client side
let _asyncStorage: any = null;

const getAsyncStorage = async () => {
  if (_asyncStorage) return _asyncStorage;
  
  // Only import on client side
  if (typeof window !== 'undefined') {
    const module = await import('@react-native-async-storage/async-storage');
    _asyncStorage = module.default;
    return _asyncStorage;
  }
  
  // Return a mock for server side
  return {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
};

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const storage = await getAsyncStorage();
      return await storage.getItem(key);
    } catch (e) {
      console.warn('SafeStorage getItem error:', e);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const storage = await getAsyncStorage();
      await storage.setItem(key, value);
    } catch (e) {
      console.warn('SafeStorage setItem error:', e);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const storage = await getAsyncStorage();
      await storage.removeItem(key);
    } catch (e) {
      console.warn('SafeStorage removeItem error:', e);
    }
  },
};

export default safeStorage;
