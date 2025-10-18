/* eslint-disable unicorn/prefer-add-event-listener */
/**
 * Persistence plugin for synchronizing signals with storage
 * Supports localStorage, sessionStorage, IndexedDB, and custom adapters
 */

import type { PluginContext, Signal, StorageAdapter } from "$types/volt";

/**
 * Registry of custom storage adapters
 */
const storageAdapters = new Map<string, StorageAdapter>();

/**
 * Register a custom storage adapter.
 *
 * @param name - Adapter name (used in data-x-persist="signal:name")
 * @param adapter - Storage adapter implementation
 */
export function registerStorageAdapter(name: string, adapter: StorageAdapter): void {
  storageAdapters.set(name, adapter);
}

const localStorageAdapter = {
  get(key: string) {
    const value = localStorage.getItem(key);
    if (value === null) return void 0;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(key);
  },
} satisfies StorageAdapter;

const sessionStorageAdapter = {
  get(key: string) {
    const value = sessionStorage.getItem(key);
    if (value === null) return void 0;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  set(key: string, value: unknown) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    sessionStorage.removeItem(key);
  },
} satisfies StorageAdapter;

const idbAdapter = {
  async get(key: string) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["voltStore"], "readonly");
      const store = transaction.objectStore("voltStore");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  },
  async set(key: string, value: unknown) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(["voltStore"], "readwrite");
      const store = transaction.objectStore("voltStore");
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  },
  async remove(key: string) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(["voltStore"], "readwrite");
      const store = transaction.objectStore("voltStore");
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  },
} satisfies StorageAdapter;

/**
 * Open or create the IndexedDB database
 */
let dbPromise: Promise<IDBDatabase> | undefined;
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("voltDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("voltStore")) {
        db.createObjectStore("voltStore", { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Get storage adapter by name
 */
function getStorageAdapter(type: string): StorageAdapter | undefined {
  switch (type) {
    case "local": {
      return localStorageAdapter;
    }
    case "session": {
      return sessionStorageAdapter;
    }
    case "indexeddb": {
      return idbAdapter;
    }
    default: {
      return storageAdapters.get(type);
    }
  }
}

/**
 * Persist plugin handler.
 * Synchronizes signal values with persistent storage.
 *
 * Syntax: data-x-persist="signalPath:storageType"
 * Examples:
 *   - data-x-persist="count:local"
 *   - data-x-persist="formData:session"
 *   - data-x-persist="userData:indexeddb"
 *   - data-x-persist="settings:customAdapter"
 */
export function persistPlugin(context: PluginContext, value: string): void {
  const parts = value.split(":");
  if (parts.length !== 2) {
    console.error(`Invalid persist binding: "${value}". Expected format: "signalPath:storageType"`);
    return;
  }

  const [signalPath, storageType] = parts;
  const signal = context.findSignal(signalPath.trim());

  if (!signal) {
    console.error(`Signal "${signalPath}" not found in scope for persist binding`);
    return;
  }

  const adapter = getStorageAdapter(storageType.trim());
  if (!adapter) {
    console.error(`Unknown storage type: "${storageType}"`);
    return;
  }

  const storageKey = `volt:${signalPath.trim()}`;

  try {
    const result = adapter.get(storageKey);
    if (result instanceof Promise) {
      result.then((storedValue) => {
        if (storedValue !== undefined) {
          (signal as Signal<unknown>).set(storedValue);
        }
      }).catch((error) => {
        console.error(`Failed to load persisted value for "${signalPath}":`, error);
      });
    } else if (result !== undefined) {
      (signal as Signal<unknown>).set(result);
    }
  } catch (error) {
    console.error(`Failed to load persisted value for "${signalPath}":`, error);
  }

  const unsubscribe = signal.subscribe((newValue) => {
    try {
      const result = adapter.set(storageKey, newValue);
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(`Failed to persist value for "${signalPath}":`, error);
        });
      }
    } catch (error) {
      console.error(`Failed to persist value for "${signalPath}":`, error);
    }
  });

  context.addCleanup(unsubscribe);
}
