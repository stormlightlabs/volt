---
version: 1.0
updated: 2025-10-18
---

# lifecycle

Global lifecycle hook system for Volt.js
Provides beforeMount, afterMount, beforeUnmount, and afterUnmount hooks

## registerGlobalHook

Register a global lifecycle hook.
Global hooks run for every mount/unmount operation in the application.

```typescript
export function registerGlobalHook(name: GlobalHookName, cb: MountHookCallback | UnmountHookCallback): () => void
```

**Example:**

```typescript
// Log every mount operation
registerGlobalHook('beforeMount', (root, scope) => {
  console.log('Mounting', root, 'with scope', scope);
});

// Track mounted elements
const mountedElements = new Set<Element>();
registerGlobalHook('afterMount', (root) => {
  mountedElements.add(root);
});
registerGlobalHook('beforeUnmount', (root) => {
  mountedElements.delete(root);
});
```

## unregisterGlobalHook

Unregister a global lifecycle hook.

```typescript
export function unregisterGlobalHook(name: GlobalHookName, cb: MountHookCallback | UnmountHookCallback): boolean
```

## clearGlobalHooks

Clear all global hooks for a specific lifecycle event.

```typescript
export function clearGlobalHooks(name: GlobalHookName): void
```

## clearAllGlobalHooks

```typescript
export function clearAllGlobalHooks(): void
```

## getGlobalHooks

Get all registered hooks for a specific lifecycle event.
Used internally by the binder system.

```typescript
export function getGlobalHooks(name: GlobalHookName): Array<MountHookCallback | UnmountHookCallback>
```

## executeGlobalHooks

Execute all registered hooks for a lifecycle event.
Used internally by the binder system.

```typescript
export function executeGlobalHooks(hookName: GlobalHookName, root: Element, scope?: Scope): void
```

## registerElementHook

Register a per-element lifecycle hook.
These hooks are specific to individual elements.

```typescript
export function registerElementHook(element: Element, hookType: "mount" | "unmount", cb: () => void): void
```

## notifyElementMounted

Notify that an element has been mounted.
Executes all registered onMount callbacks for the element.

```typescript
export function notifyElementMounted(element: Element): void
```

## notifyElementUnmounted

Notify that an element is being unmounted.
Executes all registered onUnmount callbacks for the element.

```typescript
export function notifyElementUnmounted(element: Element): void
```

## notifyBindingCreated

Notify that a binding has been created on an element.

```typescript
export function notifyBindingCreated(element: Element, name: string): void
```

## notifyBindingDestroyed

Notify that a binding has been destroyed on an element.

```typescript
export function notifyBindingDestroyed(element: Element, name: string): void
```

## isElementMounted

Check if an element is currently mounted.

```typescript
export function isElementMounted(element: Element): boolean
```

## getElementBindings

Get all bindings on an element.

```typescript
export function getElementBindings(element: Element): string[]
```
