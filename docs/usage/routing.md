# Routing

Client-side routing lets VoltX applications feel like multi-page sites without full page reloads.
The `url` plugin keeps a signal in sync with the browser URL so your application can react declaratively to route changes.
This guide walks through building both hash-based and History API routers that swap entire page sections while preserving the advantages of VoltX's signal system.

## Why?

- **Zero reloads:** Route changes update `window.location.hash` via `history.pushState`, so the browser history stack is maintained while the document stays mounted and stateful widgets keep their values.
- **Shareable URLs:** Users can refresh or share a link such as `/#/pricing` and land directly on the same view.
- **Declarative rendering:** Routing is just another signal; templates choose what to display with conditional bindings like `data-volt-if` or `data-volt-show`.
- **Simple integration:** No extra router dependency is required. Register the plugin once and opt-in per signal.

> The plugin also supports synchronising signals with query parameters (`read:` and `sync:` modes).
> For multi-page navigation the `hash:` mode is the simplest option because it avoids server configuration and works on static hosting.

## Getting Started

1. Install Volt normally (see [Installation](../installation)).
2. Register the plugin before calling `charge()` or `mount()`.
   Choose the import style that matches your setup:

    ```html
    <!-- CDN / script-tag usage -->
    <script type="module">
      import { charge, registerPlugin, urlPlugin } from "https://unpkg.com/voltx.js@latest/dist/volt.js";

      registerPlugin("url", urlPlugin);
      charge();
    </script>
    ```

    ```ts
    // src/main.ts — bundled projects
    import { charge, initNavigationListener, registerPlugin, urlPlugin } from "voltx.js";

    registerPlugin("url", urlPlugin);
    initNavigationListener(); // restores scroll/focus when using history routing

    charge();
    ```

3. In your markup, opt a signal into URL synchronisation, for example `data-volt-url="hash:route"` or `data-volt-url="history:path"`.

## URL modes at a glance

| Mode     | Binding example                        | Sync direction              | Use Case                                                                       |
| -------- | -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `read`   | `data-volt-url="read:filter"`          | URL ➝ signal on first mount | Hydrate initial state from a query param without mutating the URL afterwards.  |
| `sync`   | `data-volt-url="sync:sort"`            | Bidirectional               | Mirror a filter, tab, or feature flag in the query string.                     |
| `hash`   | `data-volt-url="hash:route"`           | Bidirectional               | Build hash-based navigation that works on static hosts.                        |
| `history`| `data-volt-url="history:path:/app"`    | Bidirectional               | Reflect clean History API routes; strip a base path such as `/app` when needed.|

> Mix and match bindings inside the same scope.
> It's common to pair `history:path` for the main route with `sync:` bindings for search filters or sort order.

## Building a multi-page shell

The example below delivers a three-page marketing site entirely on the client.
Each "page" is a section that only renders when the current route matches its slug.

```html
<main
  data-volt
  data-volt-state='{"route": "home"}'
  data-volt-url="hash:route">
  <nav>
    <button data-volt-class:active="route === 'home'" data-volt-on-click="route.set('home')">
      Home
    </button>
    <button data-volt-class:active="route === 'pricing'" data-volt-on-click="route.set('pricing')">
      Pricing
    </button>
    <button data-volt-class:active="route === 'about'" data-volt-on-click="route.set('about')">
      About
    </button>
  </nav>

  <section data-volt-if="route === 'home'">
    <h1>Volt</h1>
    <p>A lightning-fast reactive runtime for the DOM.</p>
  </section>

  <section data-volt-if="route === 'pricing'">
    <h1>Pricing</h1>
    <ul>
      <li>Starter - $0</li>
      <li>Team - $29</li>
      <li>Enterprise - Contact us</li>
    </ul>
  </section>

  <section data-volt-if="route === 'about'">
    <h1>About</h1>
    <p>Learn more about the Volt runtime and ecosystem.</p>
  </section>

  <section data-volt-if="route !== 'home' && route !== 'pricing' && route !== 'about'">
    <h1>Not found</h1>
    <p data-volt-text="'No page named \"' + route + '\"'"></p>
    <button data-volt-on-click="route.set('home')">Return home</button>
  </section>
</main>
```

### How it works

- On first mount, the plugin reads `window.location.hash` and updates the `route` signal (defaulting to `"home"` if empty).
- Clicking navigation buttons calls `route.set(...)`, which updates the signal and immediately pushes the new hash to history.
  The hash-change event also keeps the signal in sync when the user clicks the browser back button.
- Each section uses `data-volt-if` to opt-in to rendering when the `route` value matches.
  Volt removes sections that no longer match, so each "page" has a distinct DOM subtree.

You can style the `"active"` class however you like; it toggles purely through declarative class bindings.

## Linking with anchors

Prefer plain `<a>` elements when appropriate so the browser shows the target hash in tooltips and lets users open the route in new tabs:

```html
<a href="#pricing" data-volt-on-click="route.set('pricing')">Pricing</a>
```

Setting `href="#pricing"` ensures non-JavaScript fallbacks still land on the right section, while the click handler keeps
the signal aligned with the hash plugin.

## Nested & Computed Routes

Because the route is just a string signal, you can derive extra information using computed signals or watchers:

```html
<div
  data-volt
  data-volt-state='{"route": "home"}'
  data-volt-url="hash:route"
  data-volt-computed:segments="route.split('/')">
  <p data-volt-text="'Section: ' + segments[0]"></p>
  <p data-volt-if="segments.length > 1" data-volt-text="'Item: ' + segments[1]"></p>
</div>
```

Use this pattern to build nested routes like `#/blog/introducing-volt`. Parse the segments in a computed signal and update child components accordingly.

For richer logic (e.g., mapping slugs to component functions), register a handler in `data-volt-methods` or mount with the programmatic API.
This would allow something like a switch statement or usage of a look up of route definitions in a collection.

## Preserving State

Client-side routing works best when page-level state lives alongside the route signal.
Volt keeps signals alive as long as their elements remain mounted, so consider nesting pages inside `data-volt-if` blocks that wrap the entire section.
When you need to reset state upon navigation, call `.set()` explicitly inside your route change handlers or watch the `route` signal and perform cleanup in `ctx.addCleanup`.

## Query Params

Hash routing is ideal for static sites, but you can combine it with query parameter syncing.

For example:

```html
<div
  data-volt
  data-volt-state='{"route": "home", "preview": false}'
  data-volt-url="hash:route">
  <span hidden data-volt-url="sync:preview"></span>
  <!-- ... -->
</div>
```

Now `#/pricing?preview=true` keeps both the route and a feature flag in sync with the URL.
Add the extra `data-volt-url="sync:preview"` binding on a child element when you need more than one signal to participate in URL synchronisation.
Use `read:` instead of `sync:` when you only need to hydrate the initial value from the URL without mutating it.

## History API Routing

VoltX supports true History API routing via the `history:` mode on the url plugin and the `navigate` directive for SPA-style navigation with pushState/replaceState.

### Using history mode

The `history:` mode syncs a signal with the browser pathname and search params, updating the URL via `history.pushState()` without page reloads:

```html
<div
  data-volt
  data-volt-state='{"currentPath": "/"}'
  data-volt-url="history:currentPath">
  <nav>
    <a href="/about" data-volt-navigate>About</a>
    <a href="/pricing" data-volt-navigate>Pricing</a>
  </nav>
</div>
```

Make sure `initNavigationListener()` runs once during boot (see the bundler example above). It restores scroll positions and focus when users navigate with the browser controls.

Links with `data-volt-navigate` intercept clicks and use pushState instead of full navigation. The `currentPath` signal stays synchronized with the URL, enabling declarative rendering based on pathname.

### Base paths and nested apps

When your app is served from a subdirectory, provide the base path as the third argument:

```html
<div
  data-volt
  data-volt-state='{"currentPath": "/"}'
  data-volt-url="history:currentPath:/docs">
  <!-- routes now read "/pricing" instead of "/docs/pricing" -->
</div>
```

Volt automatically strips `/docs` from the signal value while keeping the full URL intact.

### Link Interception

The navigate directive ships with VoltX so there is no extra plugin registration required. It handles:

- Click interception on anchor tags (respects Ctrl/Cmd+click for new tabs)
- Form GET submission as navigation
- Back/forward button support via popstate events
- Automatic scroll position restoration
- Optional View Transition API integration

Use modifiers for control:

- `data-volt-navigate.replace` - Use replaceState instead of pushState
- `data-volt-navigate.prefetch` - Prefetch on hover or focus
- `data-volt-navigate.prefetch.viewport` - Prefetch when entering viewport
- `data-volt-navigate.notransition` - Skip View Transitions

### Programmatic navigation

Import `navigate()`, `redirect()`, `goBack()`, or `goForward()` for JavaScript-driven routing:

```typescript
import { navigate, redirect } from "voltx.js";

await navigate("/dashboard"); // Pushes state
await redirect("/login"); // Replaces state
```

Both functions return Promises that resolve after navigation completes, supporting View Transitions when available.

### Navigation events

History navigations emit custom events you can react to without polling:

```ts
globalThis.addEventListener("volt:navigate", (event) => {
  const { url, route } = event.detail; // route is present when dispatched by the url plugin
  console.debug("navigated to", url, route ?? "");
});

globalThis.addEventListener("volt:popstate", (event) => {
  refreshDataFor(event.detail.route);
});
```

Use these hooks to trigger data fetching, analytics, or other side effects whenever the active route changes.

## Hash vs History Routing

| Feature            | Hash Mode                | History Mode                   |
| ------------------ | ------------------------ | ------------------------------ |
| URL format         | `/#/page`                | `/page`                        |
| Server config      | None required            | Requires catch-all route       |
| Browser history    | Yes                      | Yes                            |
| SEO friendly       | Limited                  | Full                           |
| Deep linking       | Yes                      | Yes                            |
| Static hosting     | Perfect                  | Needs fallback to index.html   |
| Back/forward       | Automatic via hashchange | Automatic via popstate         |
| Scroll restoration | Manual                   | Automatic with navigate plugin |

**Choose hash mode** when deploying to static hosting (GitHub Pages, Netlify without redirects) or when server configuration is unavailable.

**Choose history mode** when you control server routing and want cleaner URLs for SEO and user experience. Configure your server to serve `index.html` for all routes.

## Route Parameters

VoltX provides pattern matching utilities for extracting dynamic segments from URLs.

### Pattern syntax

Route patterns support:

- Named parameters: `/blog/:slug`
- Optional parameters: `/blog/:category/:slug?`
- Wildcard parameters: `/files/*path`
- Multiple parameters: `/users/:userId/posts/:postId`

### Using route utilities

Import `matchRoute()`, `extractParams()`, or `buildPath()` from voltx.js to work with route patterns:

```typescript
import { matchRoute, extractParams, buildPath } from "voltx.js";

const match = matchRoute("/blog/:slug", "/blog/hello-world");
// { path: '/blog/hello-world', params: { slug: 'hello-world' }, pattern: '/blog/:slug' }

const params = extractParams("/users/:id", "/users/42"); // { id: '42' }
const url = buildPath("/blog/:slug", { slug: "new-post" }); // '/blog/new-post'
```

Combine these with computed signals to derive route information declaratively. For example, use `matchRoute()` in a computed signal that watches the url plugin's signal to extract parameters whenever the route changes.

### Declarative parameter extraction

Rather than calling route utilities in methods, create computed signals that derive route data:

```html
<div
  data-volt
  data-volt-state='{"path": "/"}'
  data-volt-url="history:path"
  data-volt-computed:blogSlug="path.startsWith('/blog/') ? path.split('/')[2] : null">
  <article data-volt-if="blogSlug">
    <h1 data-volt-text="'Post: ' + blogSlug"></h1>
  </article>
</div>
```

For more complex routing needs, register a custom method or use the programmatic API with the router utilities.

## Data fetching on navigation

Combine routing signals with `asyncEffect` to load data whenever the active path changes.
Abort signals prevent stale responses from updating the UI if the user navigates away mid-request.

```ts
import { asyncEffect, matchRoute, registerPlugin, signal, urlPlugin } from "voltx.js";

const path = signal("/");
const blogPost = signal(null);
const loading = signal(false);

registerPlugin("url", urlPlugin);

asyncEffect(
  async (abortSignal) => {
    const match = matchRoute("/blog/:slug", path.get());
    if (!match) {
      blogPost.set(null);
      return;
    }

    loading.set(true);
    try {
      const response = await fetch(`/api/posts/${match.params.slug}`, { signal: abortSignal });
      if (!response.ok) throw new Error("Failed to load post");
      blogPost.set(await response.json());
    } finally {
      loading.set(false);
    }
  },
  [path],
  { abortable: true },
);
```

Bind `blogPost` and `loading` into your template (`data-volt-if="blogPost"` etc.) to show the fetched content once it arrives.

## View Transitions

The navigate directive automatically integrates with the View Transitions API when available, providing smooth cross-fade animations between page navigations.

### Automatic transitions

By default, all navigations triggered via `data-volt-navigate` or the `navigate()` function use View Transitions with a transition name of `"page-transition"`. The browser handles the animation automatically.

### Customizing transitions

Control transition behavior with CSS using view-transition pseudo-elements:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

::view-transition-old(root) {
  animation-name: fade-out;
}

::view-transition-new(root) {
  animation-name: fade-in;
}
```

Disable transitions per-navigation using the `.notransition` modifier or pass `transition: false` to programmatic navigation functions.

## Focus Management & Accessibility

The navigate plugin includes automatic focus management for keyboard navigation and screen reader users.

On forward navigation, focus moves to the main content area (searches for `<main>`, `[role="main"]`, or `#main-content`) or the first `<h1>` heading. On back/forward navigation, focus is restored to the previously focused element when possible.

This ensures users navigating via keyboard don't lose their position in the document after navigation.

View Transitions are automatically skipped in browsers without support or when `prefers-reduced-motion` is enabled. Navigation continues to work normally without visual transitions.

## Scroll Restoration

Scroll positions are automatically saved before navigation and restored when using the browser back/forward buttons.
The navigate plugin maintains a map of scroll positions keyed by pathname.

For custom scroll containers, use the scroll plugin's history mode:

```html
<div data-volt-scroll="history" style="overflow-y: auto;">
  <!-- scrollable content -->
</div>
```

This automatically saves and restores the scroll position of the container across navigations.

## Progressive Enhancement

- Always provide semantic HTML in each section so the site remains usable without JavaScript or when crawled.
- Prefetch data when a link becomes visible by combining navigation events with `asyncEffect` or the `data-volt-navigate.prefetch` modifier.
- Use the scroll plugin's history mode for tall pages (`data-volt-scroll="history"`).
