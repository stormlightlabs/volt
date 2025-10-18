---
version: 1.0
updated: 2025-10-18
---

# binder

Binder system for mounting and managing Volt.js bindings

## mount

Mount Volt.js on a root element and its descendants.
Binds all data-x-* attributes to the provided scope.
Returns a cleanup function to unmount and dispose all bindings.

```typescript
export function mount(root: Element, scope: Scope): CleanupFunction
```
