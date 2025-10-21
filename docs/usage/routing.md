# Routing

Client-side routing lets VoltX applications feel like multi-page sites without full page reloads.
The `url` plugin keeps a signal in sync with the browser URL so your application can react declaratively to route changes.
This guide walks through building a hash-based router that swaps entire page sections while preserving the advantages
of VoltX's signal system.

## Why?

- **Zero reloads:** Route changes update `window.location.hash` via `history.pushState`, so the browser history stack is maintained while the document stays mounted and stateful widgets keep their values.
- **Shareable URLs:** Users can refresh or share a link such as `/#/pricing` and land directly on the same view.
- **Declarative rendering:** Routing is just another signal; templates choose what to display with conditional bindings like `data-volt-if` or `data-volt-show`.
- **Simple integration:** No extra router dependency is required—register the plugin once and opt-in per signal.

> The plugin also supports synchronising signals with query parameters (`read:` and `sync:` modes).
> For multi-page navigation the `hash:` mode is the simplest option because it avoids server configuration and works on static hosting.

## How?

1. Install Volt normally (see [Installation](../installation.md)).
2. Register the plugin before calling `charge()` or `mount()`:

    ```html
    <script type="module">
      import {
        charge,
        registerPlugin,
        urlPlugin,
      } from 'https://unpkg.com/voltx.js@latest/dist/volt.js';

      registerPlugin('url', urlPlugin);
      charge();
    </script>
    ```

3. In your markup, opt a signal into hash synchronisation with `data-volt-url="hash:signalName"`.

## Building a multi-page shell

The example below delivers a three-page marketing site entirely on the client. Each "page" is a section that only renders
when the current route matches its slug.

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
      <li>Starter — $0</li>
      <li>Team — $29</li>
      <li>Enterprise — Contact us</li>
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

## Progressive Enhancement

- Always provide semantic HTML in each section so the site remains usable without JavaScript or when crawled.
- Consider prefetching data when a link becomes visible: attach a watcher to `route` and trigger fetch logic from the programmatic API.
- Use `scrollPlugin` for auto-scrolling on navigation if you have tall pages (`data-volt-scroll="route"`).
