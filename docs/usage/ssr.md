# Server-Side Rendering

VoltX can render HTML on the server and hydrate it on the client so that the initial paint is fast and SEO-friendly without sacrificing interactivity.

## When SSR Helps

- Marketing and content-heavy pages that rely on search indexing.
- Dashboards that must show current data immediately on first paint.
- Progressive enhancement flows where the page should work without JavaScript.
- Latency-sensitive experiences served to slow devices or connections.

## When CSR Is Enough

- Highly interactive applications dominated by client-side state.
- Authenticated surfaces hidden from crawlers.
- Rapid prototypes where deployment speed outweighs initial paint.
- Workloads where duplicating rendering logic on the server adds complexity without user benefit.

## Rendering Flow

1. Render HTML on the server and embed serialized state.
2. Ship that HTML to the browser.
3. Call `hydrate()` to attach VoltX bindings without re-rendering.

### Produce Markup on the Server

Use `serializeScope()` to convert reactive state into JSON before embedding it in the HTML you return:

```ts
import { serializeScope, signal } from "@volt/volt";

export function renderCounter() {
  const scope = {
    count: signal(0),
    label: "Visitors",
  };

  const serialized = serializeScope(scope);

  return `
    <div id="counter" data-volt>
      <script type="application/json" id="volt-state-counter">
        ${serialized}
      </script>

      <h2 data-volt-text="label">${scope.label}</h2>
      <button data-volt-on:click="count++">Clicked <span data-volt-text="count">${scope.count.get()}</span> times</button>
    </div>
  `;
}
```

Guidelines:

- Every server-rendered root must have an `id`. VoltX looks for `<script id="volt-state-{id}">` next to it.
- The script tag must use `type="application/json"` and contain valid JSON. Pretty printing is fine; whitespace is ignored.
- Keep serialized data minimal. Fetch large collections after hydration.

### Send HTML to the Client

The HTML you return should already contain the serialized state script tag. VoltX will reuse the DOM structure; do **not** re-render the same tree on the client.

### Hydrate in the Browser

Call `hydrate()` once the page loads. It discovers `[data-volt]` roots automatically.

```ts
import { hydrate } from "@volt/volt";

document.addEventListener("DOMContentLoaded", () => {
  hydrate({
    rootSelector: "[data-volt]",
    skipHydrated: true, // defaults to true; repeat calls ignore already hydrated roots
  });
});
```

If you only hydrate a specific block, pass a narrower selector or manually select elements and call `hydrate({ rootSelector: "#counter" })`.

## Serialized State

VoltX exposes helpers that mirror the runtime's internal behavior:

| Helper                        | Action                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `serializeScope(scope)`       | Converts signals into their raw values before you embed them                                                           |
| `deserializeScope(data)`      | Restores a JSON payload into a fresh scope. Useful for streaming responses or server actions that return HTML partials |
| `isServerRendered(element)`   | Tells you if VoltX found a matching serialized state block                                                             |
| `isHydrated(element)`         | Detects whether a root has already been hydrated, which is handy when mixing SSR content with dynamic client mounts    |
| `getSerializedState(element)` | Reads the JSON payload for debugging or custom hydration flows.                                                        |

```ts
import { deserializeScope, getSerializedState } from "@volt/volt";

const root = document.querySelector("#counter")!;
const state = getSerializedState(root);

if (state) {
  const scope = deserializeScope(state);
  console.log(scope.count.get()); // -> 0
}
```

## Avoiding Flash of Unstyled Content

Hydrated markup should look identical before and after VoltX runs. When CSS or font loading causes flicker, consider these patterns:

### Hide Until Hydrated

```html
<style>
  [data-volt]:not([data-volt-hydrated]) {
    visibility: hidden;
  }

  [data-volt][data-volt-hydrated] {
    visibility: visible;
  }
</style>
```

VoltX sets `data-volt-hydrated="true"` once `hydrate()` completes, so you can safely reveal content at that point.

### Use a Loading Overlay

```html
<div id="app" data-volt>
  <!-- server-rendered content -->
</div>
<div class="loading-overlay">Loading…</div>

<script type="module">
  import { hydrate } from "@volt/volt";

  hydrate();
</script>
```

```css
.loading-overlay {
  position: fixed;
  inset: 0;
  background: white;
  display: grid;
  place-items: center;
}

[data-volt-hydrated] ~ .loading-overlay {
  display: none;
}
```

### Progressive Enhancement

Render functional HTML that works without JavaScript, then let VoltX enhance it:

```html
<form id="contact" method="POST" action="/submit" data-volt>
  <script type="application/json" id="volt-state-contact">
    { "submitted": false }
  </script>

  <input type="email" name="email" required />
  <p data-volt-if="submitted" data-volt-text="'Thank you!'"></p>
  <button type="submit">Submit</button>
</form>
```

## Security Checklist

- Escape user-generated content in the HTML you render.
- Validate JSON before embedding it in `<script type="application/json">` tags.
- Apply a strict Content Security Policy (CSP) so inline scripts are controlled.
- Never serialize secrets. Treat the hydrated payload as public data.

Pair these guidelines with the lifecycle hooks documented in [lifecycle](./lifecycle) to coordinate mount-time work across SSR and client renders.
