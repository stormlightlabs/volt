---
version: 1.0
updated: 2025-10-18
---

# plugin

Plugin system for extending Volt.js with custom bindings

## registerPlugin

Register a custom plugin with a given name.
Plugins extend Volt.js with custom data-volt-* attribute bindings.

```typescript
export function registerPlugin(name: string, handler: PluginHandler): void
```

**Example:**

```typescript
registerPlugin('tooltip', (context, value) => {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = value;
  context.element.addEventListener('mouseenter', () => {
    document.body.appendChild(tooltip);
  });
  context.element.addEventListener('mouseleave', () => {
    tooltip.remove();
  });
  context.addCleanup(() => tooltip.remove());
});
```

## getPlugin

Get a plugin handler by name.

```typescript
export function getPlugin(name: string): PluginHandler | undefined
```

## hasPlugin

Check if a plugin is registered.

```typescript
export function hasPlugin(name: string): boolean
```

## unregisterPlugin

Unregister a plugin by name.

```typescript
export function unregisterPlugin(name: string): boolean
```

## getRegisteredPlugins

Get all registered plugin names.

```typescript
export function getRegisteredPlugins(): string[]
```

## clearPlugins

Clear all registered plugins.

```typescript
export function clearPlugins(): void
```
