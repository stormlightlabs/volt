---
outline: deep
---

# Navigate Plugin

The navigate plugin upgrades plain links and forms with client-side navigation, History API integration, and optional
View Transition animations. It keeps your DOM-driven pages feeling app-like without giving up regular hyperlinks.

## Quick Start

```html
<!-- Link-based navigation -->
<a href="/about" data-volt-navigate>About</a>

<!-- Form submissions (GET only) -->
<form action="/search" method="get" data-volt-navigate>
  <input name="q" placeholder="Search..." />
  <button type="submit">Go</button>
</form>
```

`data-volt-navigate` applies to `<a>` and `<form>` elements. Links use their `href`; forms default to `action` (or the current pathname) and serialize inputs into the query string for GET submissions.

## Modifiers

Attach modifiers with dot notation or suffixed attribute names (`data-volt-navigate-replace`).

- `replace` - call `history.replaceState` instead of `pushState`; good for redirects or idempotent flows.
- `prefetch` - issue a `<link rel="prefetch">` when the element is hovered or focused to warm the cache.
- `notransition` - skip View Transition API usage, falling back to an immediate DOM swap.

```html
<a href="/settings" data-volt-navigate-notransition>Settings</a>
<a href="/pricing" data-volt-navigate-prefetch>Pricing</a>
<a href="/welcome" data-volt-navigate-replace>Skip intro</a>
```

## View Transitions

By default the plugin wraps navigations in `startViewTransition` using the `"page-transition"` name. Use the
`notransition` modifier to disable it per element, or switch names when navigating imperatively:

```ts
import { navigate } from "volt/plugins/navigate";

await navigate("/projects/42", { transitionName: "project-detail" });
```

## Programmatic APIs

Import helpers straight from `lib/src/plugins/navigate.ts` (re-exported by the runtime build):

```ts
import { goBack, goForward, initNavigationListener, navigate, redirect } from "volt/plugins/navigate";

await navigate("/projects/123", { replace: false, transitionName: "detail" });
redirect("/login"); // always uses replace
goBack();
goForward();

// Restore scroll on history navigation
const stop = initNavigationListener();
// Later: stop();
```

`initNavigationListener` should run once during boot to restore scroll positions when users hit the back/forward
buttons. It also emits a `volt:popstate` event mirroring the browser’s `popstate`.

## Events

Every navigation dispatches:

- `volt:navigate` after the History API call, with `{ url, replace }` in `event.detail`.
- `volt:popstate` from the history listener, with `{ state }` in `event.detail`.

Use these to re-fetch data, invalidate caches, or sync routing signals for plugins such as `url`.

## Handling External Links

Navigation only intercepts same-origin URLs and primary-button clicks without modifier keys.
External links, middle clicks, and `target="_blank"` continue to behave like normal browser navigation, preserving accessibility expectations.
