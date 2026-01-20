import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CACHE_NAME = 'pedy-favorites-cache';
const IDB_NAME = 'pedy-favorites-db';
const IDB_STORE = 'favorites';

// IndexedDB helpers
async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

async function getFromIndexedDB(key: string): Promise<string[] | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(IDB_STORE, 'readonly');
      const store = transaction.objectStore(IDB_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(key: string, data: string[]): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(IDB_STORE, 'readwrite');
    const store = transaction.objectStore(IDB_STORE);
    store.put(data, key);
  } catch {
    // Silently fail
  }
}

// Cache API helpers
async function getFromCacheAPI(key: string): Promise<string[] | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    if (response) {
      return response.json();
    }
    return null;
  } catch {
    return null;
  }
}

async function saveToCacheAPI(key: string, data: string[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(key, response);
  } catch {
    // Silently fail
  }
}

export function useFavorites(establishmentId: string, customerId?: string) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = `pedy-favorites-${establishmentId}`;

  // Load favorites on init
  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      let loaded: string[] = [];

      // If customer is logged in, fetch from database
      if (customerId) {
        const { data } = await supabase
          .from('customer_favorites')
          .select('product_id')
          .eq('customer_id', customerId)
          .eq('establishment_id', establishmentId);

        if (data && data.length > 0) {
          loaded = data.map((f) => f.product_id);
        } else {
          // Migrate local favorites to database
          const localFavorites = await loadLocalFavorites();
          if (localFavorites.length > 0) {
            await migrateFavoritesToDatabase(localFavorites, customerId, establishmentId);
            loaded = localFavorites;
          }
        }
      } else {
        // Load from local storage (multi-layer)
        loaded = await loadLocalFavorites();
      }

      setFavorites(loaded);
      setLoading(false);
    };

    const loadLocalFavorites = async (): Promise<string[]> => {
      // Try localStorage first
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (fromStorage) {
        try {
          return JSON.parse(fromStorage);
        } catch {
          // Invalid JSON
        }
      }

      // Try Cache API (iOS/Mac PWA compatibility)
      const fromCache = await getFromCacheAPI(STORAGE_KEY);
      if (fromCache) {
        // Sync back to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromCache));
        return fromCache;
      }

      // Try IndexedDB as last resort
      const fromIDB = await getFromIndexedDB(STORAGE_KEY);
      if (fromIDB) {
        // Sync back to localStorage and Cache API
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromIDB));
        await saveToCacheAPI(STORAGE_KEY, fromIDB);
        return fromIDB;
      }

      return [];
    };

    const migrateFavoritesToDatabase = async (
      favs: string[],
      custId: string,
      estId: string
    ) => {
      const inserts = favs.map((productId) => ({
        customer_id: custId,
        establishment_id: estId,
        product_id: productId,
      }));

      await supabase.from('customer_favorites').upsert(inserts, {
        onConflict: 'customer_id,establishment_id,product_id',
      });

      // Clear local storage after migration
      localStorage.removeItem(STORAGE_KEY);
      await saveToCacheAPI(STORAGE_KEY, []);
      await saveToIndexedDB(STORAGE_KEY, []);
    };

    if (establishmentId) {
      loadFavorites();
    }
  }, [establishmentId, customerId, STORAGE_KEY]);

  // Save to local storage when favorites change (for non-logged users)
  useEffect(() => {
    if (!loading && !customerId && favorites.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      saveToCacheAPI(STORAGE_KEY, favorites);
      saveToIndexedDB(STORAGE_KEY, favorites);
    }
  }, [favorites, customerId, loading, STORAGE_KEY]);

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (productId: string) => {
      const isFav = favorites.includes(productId);

      if (customerId) {
        // Sync with database
        if (isFav) {
          await supabase
            .from('customer_favorites')
            .delete()
            .eq('customer_id', customerId)
            .eq('product_id', productId);
        } else {
          await supabase.from('customer_favorites').insert({
            customer_id: customerId,
            establishment_id: establishmentId,
            product_id: productId,
          });
        }
      }

      setFavorites((prev) =>
        isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
      );

      return !isFav; // Returns new state
    },
    [favorites, customerId, establishmentId]
  );

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    if (customerId) {
      await supabase
        .from('customer_favorites')
        .delete()
        .eq('customer_id', customerId)
        .eq('establishment_id', establishmentId);
    }

    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
    await saveToCacheAPI(STORAGE_KEY, []);
    await saveToIndexedDB(STORAGE_KEY, []);
  }, [customerId, establishmentId, STORAGE_KEY]);

  return {
    favorites,
    loading,
    toggleFavorite,
    clearFavorites,
    isFavorite: (id: string) => favorites.includes(id),
    favoritesCount: favorites.length,
  };
}
