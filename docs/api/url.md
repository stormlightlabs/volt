---
version: 1.0
updated: 2025-10-18
---

# url

URL plugin for synchronizing signals with URL parameters and hash routing
Supports one-way read, bidirectional sync, and hash-based routing

## urlPlugin

URL plugin handler.
Synchronizes signal values with URL parameters and hash.

Syntax: data-volt-url="mode:signalPath"
Modes:
  - read:signalPath - Read URL param into signal on mount (one-way)
  - sync:signalPath - Bidirectional sync between signal and URL param
  - hash:signalPath - Sync with hash portion for routing

```typescript
export function urlPlugin(context: PluginContext, value: string): void
```
