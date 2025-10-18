---
version: 1.0
updated: 2025-10-18
---

# scroll

Scroll plugin for managing scroll behavior
Supports position restoration, scroll-to, scroll spy, and smooth scrolling

## scrollPlugin

Scroll plugin handler.
Manages various scroll-related behaviors.

Syntax: data-volt-scroll="mode:signalPath"
Modes:
  - restore:signalPath - Save/restore scroll position
  - scrollTo:signalPath - Scroll to element when signal changes
  - spy:signalPath - Update signal when element is visible
  - smooth:signalPath - Enable smooth scrolling behavior

```typescript
export function scrollPlugin(context: PluginContext, value: string): void
```
