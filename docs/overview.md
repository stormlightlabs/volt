---
outline: deep
---

# Overview

VoltX is a lightweight, hypermedia based reactive framework for building declarative UIs.

It combines HTML-driven behavior via `data-volt-*` attributes with signal-based reactivity.

## Features

### Reactivity

- Signal-based state management with `signal`, `computed`, and `effect` primitives
- Predicatable direct DOM updates without virtual DOM diffing

### Hypermedia Integration

- Declarative HTTP requests with `data-volt-get`, `data-volt-post`, `data-volt-put`, `data-volt-patch`, and `data-volt-delete`
- Multiple DOM swap strategies for server-rendered HTML fragments/partials
- "Smart" retry with exponential backoff for failed requests
- Automatic form serialization

### Plugins

- Built-In
    - State persistence across page loads using `localStorage`, `sessionStorage`, or `IndexedDB`
    - Scroll management including position restore, scroll-to, scroll-spy, and smooth scrolling
    - URL synchronization for query parameters and hash-based routing
- Extensibility
    - Custom plugin system via `registerPlugin` for domain-specific bindings
    - Global lifecycle hooks for mount, unmount, and binding creation
    - Automatic cleanup management

### Design Constraints

- Core runtime under 15 KB gzipped
- Zero dependencies
- No custom build systems
- TypeScript source
- Every feature tested

## Concepts

| Concept  | Description                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Signals  | Reactive primitives that automatically update DOM bindings when changed.                                  |
| Bindings | `data-volt-text`, `data-volt-html`, `data-volt-class` connect attributes or text to expressions.          |
| Actions  | `data-volt-on-click`, `data-volt-on-input`, etc. attach event handlers declaratively.                     |
| Streams  | `data-volt-stream="/events"` listens for SSE or WebSocket updates and applies JSON patches.               |
| Plugins  | Modular extensions (`data-volt-persist`, `data-volt-surge`, `data-volt-shift`, etc.) to enhance the core. |

## VoltX.css

VoltX ships with an optional classless CSS framework inspired by Pico CSS and Tufte CSS. It provides beautiful, semantic styling for HTML elements without requiring any CSS classes—just write semantic markup and it looks great out of the box.

Features include typography with modular scale, Tufte-style sidenotes, styled form elements, dialogs, accordions, tooltips, tables, and more. See the framework's [README](../lib/README.md#voltxcss) for installation and usage details.

Here are some highlights

![VoltX Typography](./images/voltx-css_typography.png)

![VoltX Structured Content](./images/voltx-css_structured-content.png)

![VoltX Components](./images/voltx-css_components.png)

## Browser Support

Modern browsers (Chrome 90+, Firefox 88+, Safari 14+) with support for:

- ES modules
- Proxy objects
- CSS custom properties
