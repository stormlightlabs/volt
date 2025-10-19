---
outline: deep
---

# Framework Overview

Volt.js is a lightweight, hypermedia based reactive framework for building declarative UIs.

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

## Browser Support

Modern browsers with support for:

- ES modules
- Proxy objects
- CSS custom properties

Chrome 90+, Firefox 88+, Safari 14+
