# Pin Scoping

Element references via `data-volt-pin` require a scoping strategy to avoid name collisions and provide predictable access patterns.
This document explores three approaches that were considered

## Current Implementation: [data-volt] Root Scoping

**How it works:**

- Each `[data-volt]` root has its own pin registry
- Pins are isolated to their scope
- `$pins.name` accesses pins within the current root

**Example:**

```html
<div data-volt>
  <input data-volt-pin="username" />
  <button data-volt-on-click="$pins.username.focus()">Focus</button>
</div>

<div data-volt>
  <input data-volt-pin="username" />  <!-- Different registry -->
  <button data-volt-on-click="$pins.username.focus()">Focus</button>
</div>
```

**Pros:**

- Predictable: Each root is isolated
- No name collision risk across roots
- Aligns with current scope model (one scope per root)
- Simple to implement and reason about

**Cons:**

- Can't share pins across roots (must use global state instead)
- No sub-scoping within a root for component-like patterns

**Use Cases:**

- Simple applications with clear root boundaries
- When each `[data-volt]` represents a distinct feature/component

---

## Alternative 1: Explicit Scope Boundaries (data-volt-scope)

**How it works:**

- Introduce `data-volt-scope` attribute to create nested scopes
- Pins registered within a scope are isolated to that scope and its descendants
- `$pins` searches up the scope chain

**Example:**

```html
<div data-volt>
  <div data-volt-scope="form1">
    <input data-volt-pin="username" />
    <button data-volt-on-click="$pins.username.focus()">Focus</button>
  </div>

  <div data-volt-scope="form2">
    <input data-volt-pin="username" />  <!-- Different scope -->
    <button data-volt-on-click="$pins.username.focus()">Focus</button>
  </div>
</div>
```

**Pros:**

- Fine-grained control over scope boundaries
- Supports nested component patterns
- Can isolate widgets within a larger root

**Cons:**

- More complex: requires scope hierarchy tracking
- Additional attribute to learn
- Lookup complexity (walking scope chain)
- Breaks current 1:1 scope-to-root model

**Use Cases:**

- Large applications with reusable sub-components
- When you need multiple isolated widgets within one root
- Form libraries with nested fieldsets

**Implementation Complexity:**

- Requires scope hierarchy (parent references)
- WeakMap must track scope chains
- Pin lookup becomes recursive

## Alternative 2: Global Document-Wide Registry

**How it works:**

- Single global pin registry for entire document
- All pins accessible from any scope
- Names must be unique across the entire page

**Example:**

```html
<div data-volt>
  <input data-volt-pin="username" />
</div>

<div data-volt>
  <!-- Can access pins from other roots -->
  <button data-volt-on-click="$pins.username.focus()">Focus</button>
</div>
```

**Pros:**

- Simplest to understand: flat namespace
- Easy to share element references across roots
- No scoping complexity

**Cons:**

- High risk of name collisions
- No isolation between roots (breaks encapsulation)
- Debugging becomes harder (where is this pin defined?)
- Not composable (can't have two instances of same component)

**Use Cases:**

- Prototypes and simple pages
- Single-page applications with unique IDs everywhere
- When cross-root communication is primary goal

**Implementation Complexity:**

- Simple: single Map instead of per-scope maps
- No WeakMap needed

## Comparison Table

| Aspect | Root Scoping (Current) | Explicit Scopes | Global |
|--------|------------------------|-----------------|--------|
| Isolation | Per root | Per scope boundary | None |
| Name Collisions | Safe within root | Safe within scope | High risk |
| Complexity | Low | Medium | Very Low |
| Cross-root Access | Not supported | Not supported | Supported |
| Nested Components | Not supported | Supported | Not needed |
| Implementation | Simple | Complex | Trivial |
| Composability | Good | Excellent | Poor |

## Decision Rationale

**Current implementation uses Root Scoping** for the following reasons:

1. **Aligns with existing architecture**: VoltX already uses one scope per `[data-volt]` root
2. **Simplicity**: No additional concepts or attributes to learn
3. **Good enough**: Most use cases don't require nested scopes
4. **Future extensibility**: Can add `data-volt-scope` later if needed (additive change)

**When to reconsider:**

- If users frequently request nested component isolation
- If framework adds first-class component system
- If cross-root pin access becomes a common need (could add `data-volt-pin-global`)

## Migration Path

If we later adopt Alternative 1 (Explicit Scopes):

1. Keep current behavior as default
2. Add `data-volt-scope` for opt-in nested scopes
3. Update metadata to track parent scopes
4. Modify `getPin()` to walk scope chain

This would be backward compatible since existing code without `data-volt-scope` would continue to work.
