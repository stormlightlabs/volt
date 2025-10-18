---
version: 1.0
updated: 2025-10-18
---

# volt.d

Context object available to all bindings

## CleanupFunction

```typescript
() => void
```

## Scope

```typescript
Record<string, unknown>
```

## BindingContext

Context object available to all bindings

```typescript
{ element: Element; scope: Scope; cleanups: CleanupFunction[] }
```

## PluginContext

Context object provided to plugin handlers.
Contains utilities and references for implementing custom bindings.

### Members

- **element**: `Element`
  The DOM element the plugin is bound to
- **scope**: `Scope`
  The scope object containing signals and data
- **lifecycle**: `PluginLifecycle`
  Lifecycle hooks for plugin-specific mount/unmount behavior

## PluginHandler

Plugin handler function signature.
Receives context and the attribute value, performs binding setup.

```typescript
(context: PluginContext, value: string) => void
```

## Signal

A reactive primitive that notifies subscribers when its value changes.

## ComputedSignal

A computed signal that derives its value from other signals.

## StorageAdapter

Storage adapter interface for custom persistence backends

## ChargedRoot

Information about a mounted Volt root after charging

element: The root element that was mounted
scope: The reactive scope created for this root
cleanup: Cleanup function to unmount this root

```typescript
{ element: Element; scope: Scope; cleanup: CleanupFunction }
```

## ChargeResult

Result of charging Volt roots

roots: Array of all charged roots
cleanup: Cleanup function to unmount all roots

```typescript
{ roots: ChargedRoot[]; cleanup: CleanupFunction }
```

## Dep

```typescript
{ get: () => unknown; subscribe: (callback: (value: unknown) => void) => () => void }
```

## AsyncEffectOptions

Options for configuring async effects

### Members

- **abortable**: `boolean`
  Enable automatic AbortController integration.
When true, provides an AbortSignal to the effect function for canceling async operations.
- **debounce**: `number`
  Debounce delay in milliseconds.
Effect execution is delayed until this duration has passed without dependencies changing.
- **throttle**: `number`
  Throttle delay in milliseconds.
Effect execution is rate-limited to at most once per this duration.
- **onError**: `(error: Error, retry: () => void) => void`
  Error handler for async effect failures.
Receives the error and a retry function.
- **retries**: `number`
  Number of automatic retry attempts on error.
Defaults to 0 (no retries).
- **retryDelay**: `number`
  Delay in milliseconds between retry attempts.
Defaults to 0 (immediate retry).

## AsyncEffectFunction

Async effect function signature.
Receives an optional AbortSignal when abortable option is enabled.
Can return a cleanup function or a Promise that resolves to a cleanup function.

```typescript
(signal?: AbortSignal) => Promise<void | (() => void)>
```

## LifecycleHookCallback

Lifecycle hook callback types

```typescript
() => void
```

## MountHookCallback

```typescript
(root: Element, scope: Scope) => void
```

## UnmountHookCallback

```typescript
(root: Element) => void
```

## ElementMountHookCallback

```typescript
(element: Element, scope: Scope) => void
```

## ElementUnmountHookCallback

```typescript
(element: Element) => void
```

## BindingHookCallback

```typescript
(element: Element, bindingName: string) => void
```

## GlobalHookName

Lifecycle hook names

```typescript
"beforeMount" | "afterMount" | "beforeUnmount" | "afterUnmount"
```

## PluginLifecycle

Extended plugin context with lifecycle hooks

### Members

- **onMount**: `(callback: LifecycleHookCallback) => void`
  Register a callback to run when the plugin is initialized for an element
- **onUnmount**: `(callback: LifecycleHookCallback) => void`
  Register a callback to run when the element is being unmounted
- **beforeBinding**: `(callback: LifecycleHookCallback) => void`
  Register a callback to run before the binding is created
- **afterBinding**: `(callback: LifecycleHookCallback) => void`
  Register a callback to run after the binding is created
