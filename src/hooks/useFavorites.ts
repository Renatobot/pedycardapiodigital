import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CACHE_NAME = 'pedy-favorites-cache';
const IDB_NAME = 'pedy-favorites-db';
const IDB_STORE = 'favorites';

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
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
  } catch {}
}

async function getFromCacheAPI(key: string): Promise<string[] | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    if (response) return response.json();
    return null;
  } catch {
    return null;
  }
}

async function saveToCacheAPI(key: string, data: string[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    await cache.put(key, response);
  } catch {}
}

export function useFavorites(establishmentId: string, customerId?: string, customerWhatsapp?: string) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = `pedy-favorites-${establishmentId}`;

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      let loaded: string[] = [];

      if (customerId && customerWhatsapp) {
        const { data } = await (supabase as any).rpc('get_customer_favorites', {
          _customer_id: customerId,
          _whatsapp: customerWhatsapp,
          _establishment_id: establishmentId,
        });

        if (data && data.length > 0) {
          loaded = data.map((f: any) => f.product_id);
        } else {
          const localFavorites = await loadLocalFavorites();
          if (localFavorites.length > 0) {
            await migrateFavoritesToDatabase(localFavorites, customerId, customerWhatsapp, establishmentId);
            loaded = localFavorites;
          }
        }
      } else {
        loaded = await loadLocalFavorites();
      }

      setFavorites(loaded);
      setLoading(false);
    };

    const loadLocalFavorites = async (): Promise<string[]> => {
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (fromStorage) {
        try { return JSON.parse(fromStorage); } catch {}
      }
      const fromCache = await getFromCacheAPI(STORAGE_KEY);
      if (fromCache) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromCache));
        return fromCache;
      }
      const fromIDB = await getFromIndexedDB(STORAGE_KEY);
      if (fromIDB) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromIDB));
        await saveToCacheAPI(STORAGE_KEY, fromIDB);
        return fromIDB;
      }
      return [];
    };

    const migrateFavoritesToDatabase = async (favs: string[], custId: string, whatsapp: string, estId: string) => {
      await (supabase as any).rpc('migrate_customer_favorites', {
        _customer_id: custId,
        _whatsapp: whatsapp,
        _establishment_id: estId,
        _product_ids: favs,
      });
      localStorage.removeItem(STORAGE_KEY);
      await saveToCacheAPI(STORAGE_KEY, []);
      await saveToIndexedDB(STORAGE_KEY, []);
    };

    if (establishmentId) loadFavorites();
  }, [establishmentId, customerId, customerWhatsapp, STORAGE_KEY]);

  useEffect(() => {
    if (!loading && !customerId && favorites.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      saveToCacheAPI(STORAGE_KEY, favorites);
      saveToIndexedDB(STORAGE_KEY, favorites);
    }
  }, [favorites, customerId, loading, STORAGE_KEY]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const isFav = favorites.includes(productId);
      if (customerId && customerWhatsapp) {
        await (supabase as any).rpc('toggle_customer_favorite', {
          _customer_id: customerId,
          _whatsapp: customerWhatsapp,
          _establishment_id: establishmentId,
          _product_id: productId,
          _add: !isFav,
        });
      }
      setFavorites((prev) => isFav ? prev.filter((id) => id !== productId) : [...prev, productId]);
      return !isFav;
    },
    [favorites, customerId, customerWhatsapp, establishmentId]
  );

  const clearFavorites = useCallback(async () => {
    if (customerId && customerWhatsapp) {
      await (supabase as any).rpc('clear_customer_favorites', {
        _customer_id: customerId,
        _whatsapp: customerWhatsapp,
        _establishment_id: establishmentId,
      });
    }
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
    await saveToCacheAPI(STORAGE_KEY, []);
    await saveToIndexedDB(STORAGE_KEY, []);
  }, [customerId, customerWhatsapp, establishmentId, STORAGE_KEY]);

  return {
    favorites,
    loading,
    toggleFavorite,
    clearFavorites,
    isFavorite: (id: string) => favorites.includes(id),
    favoritesCount: favorites.length,
  };
}
