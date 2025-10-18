---
version: 1.0
updated: 2025-10-18
---

# charge

Charge system (bootstrap) for auto-discovery and initialization of Volt roots

Handles declarative state initialization via data-volt-state and data-volt-computed

## charge

Discover and mount all Volt roots in the document.
Parses data-volt-state for initial state and data-volt-computed for derived values.

```typescript
export function charge(rootSelector = "[data-volt]"): ChargeResult
```

**Example:**

```typescript
```html
<div data-volt data-volt-state='{"count": 0}' data-volt-computed:double="count * 2">
  <p data-volt-text="count"></p>
  <p data-volt-text="double"></p>
</div>
```

```ts
const { cleanup } = charge();
// Later: cleanup() to unmount all
```
```
