# Lifecycle Hooks

Volt's runtime exposes lifecycle hooks so you can observe mounts, run cleanup logic, and coordinate plugins without re-implementing binding internals. Hooks run consistently for both SSR hydration and client-only mounts.

## Lifecycle Layers

- **Global hooks** fire for every mount/unmount operation and are ideal for analytics, logging, or cross-cutting concerns.
- **Element hooks** attach to a single DOM element and let you react to that element entering or leaving the document.
- **Plugin hooks** are available while authoring custom bindings and let you scope mount/unmount work to a plugin instance.

## Global Hooks

Register global hooks with `registerGlobalHook(name, callback)`. The available events are:

| Event                      | Position                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `beforeMount(root, scope)` | Runs right before bindings initialize                                                                |
|                            | This is the place to patch the scope or read serialized state                                        |
| `afterMount(root, scope)`  | Runs after VoltX has attached bindings and lifecycle state                                           |
| `beforeUnmount(root)`      | Runs before a root is torn down, giving you time to flush pending work                               |
| `afterUnmount(root)`       | Runs after cleanup finishes                                                                          |
|                            | Use this to release global resources                                                                 |

```ts
import { registerGlobalHook } from "@volt/volt";

const unregister = registerGlobalHook("afterMount", (root, scope) => {
  console.debug("[volt] mounted", root.id, scope);
});

unregister();
```

### Working with the Scope Object

`beforeMount` and `afterMount` receive the reactive scope for the root element so you can read signal values or stash helpers on the scope.
Avoid mutating DOM inside these hooks-leave DOM updates to bindings/plugins to prevent hydration mismatches.

### Managing Global Hooks

- Use `unregisterGlobalHook` when the callback is no longer needed.
- Call `clearGlobalHooks("beforeMount")` or `clearAllGlobalHooks()` in test teardown code to avoid cross-test leakage.
- Prefer one central module to register global hooks so they are easy to audit.

## Element Hooks

When you need per-element notifications, register element hooks:

```ts
import { registerElementHook, isElementMounted } from "@volt/volt";

const panel = document.querySelector("[data-volt-panel]");

registerElementHook(panel!, "mount", () => {
  console.log("panel is live");
});

registerElementHook(panel!, "unmount", () => {
  console.log("panel removed, dispose timers");
});

if (isElementMounted(panel!)) {
  // Safe to touch DOM or read bindings immediately.
}
```

Element hooks automatically dispose after the element unmounts. Use `getElementBindings(element)` when debugging to see which binding directives are attached to a node.

## Plugin Lifecycle Hooks

Custom plugins receive lifecycle helpers on the plugin context:

```ts
import type { PluginContext } from "@volt/volt";

export function focusPlugin(ctx: PluginContext) {
  const el = ctx.element as HTMLElement;

  ctx.lifecycle.onMount(() => el.focus());
  ctx.lifecycle.onUnmount(() => el.blur());
}
```

- `ctx.lifecycle.onMount` and `ctx.lifecycle.onUnmount` let you coordinate DOM state with the binding's lifetime.
- Use `ctx.lifecycle.beforeBinding` and `ctx.lifecycle.afterBinding` to measure binding creation or guard against duplicate initialization.
- Always combine lifecycle hooks with `ctx.addCleanup` if you create subscriptions that outlive a single mount cycle.

## Best Practices

- Keep hook callbacks side-effect free whenever possible; defer heavy work to asynchronous tasks.
- Never mutate the DOM tree that VoltX currently manages from `beforeMount`; wait for `afterMount` or plugin hooks instead.
- When adding analytics or telemetry, remember to remove hooks on navigation or single-page route changes to avoid duplicate events.
- In tests, seed hooks inside the test body and tear them down with the disposer returned from `registerGlobalHook` to preserve isolation.

For server-rendered workflows and hydration patterns, refer to [ssr](./ssr).
