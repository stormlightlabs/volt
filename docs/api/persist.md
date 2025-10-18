---
version: 1.0
updated: 2025-10-18
---

# persist

Persistence plugin for synchronizing signals with storage
Supports localStorage, sessionStorage, IndexedDB, and custom adapters

## registerStorageAdapter

Register a custom storage adapter.

```typescript
export function registerStorageAdapter(name: string, adapter: StorageAdapter): void
```

## persistPlugin

Persist plugin handler.
Synchronizes signal values with persistent storage.

Syntax: data-volt-persist="signalPath:storageType"
Examples:
  - data-volt-persist="count:local"
  - data-volt-persist="formData:session"
  - data-volt-persist="userData:indexeddb"
  - data-volt-persist="settings:customAdapter"

```typescript
export function persistPlugin(context: PluginContext, value: string): void
```
