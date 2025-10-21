# Roadmap

- [Completed](#completed)
- [TODO](#to-do)
    - [Parking Lot](#parking-lot)
- [Examples (Planned)](#examples)

| Version | State | Milestone                                                                        |
| ------- | ----- | -------------------------------------------------------------------------------- |
|         |   ✓   | [Foundations](#foundations)                                                      |
|         |   ✓   | [Reactivity & Bindings](#reactivity--bindings)                                   |
|         |   ✓   | [Actions & Effects](#actions--effects)                                           |
|         |   ✓   | [Plugins Framework](#plugins-framework)                                          |
|         |   ✓   | [Backend Integration & HTTP Actions](#backend-integration--http-actions)         |
|         |   ✓   | [Proxy-Based Reactivity Enhancements](#proxy-based-reactivity-enhancements)      |
| v0.1.0  |   ✓   | [Markup Based Reactivity](#markup-based-reactivity)                              |
| v0.2.0  |   ✓   | [Reactive Attributes & Event Modifiers](#reactive-attributes--event-modifiers)   |
| v0.3.0  |   ✓   | [Global State](#global-state)                                                    |
| v0.4.0  |       | [Animation & Transitions](#animation--transitions)                               |
| v0.5.0  |       | [Persistence & Offline](#persistence--offline)                                   |
|         |       | [Background Requests & Reactive Polling](#background-requests--reactive-polling) |
| v0.6.0  |       | [Navigation & History Management](#navigation--history-management)               |
| v0.7.0  |       | [Streaming & Patch Engine](#streaming--patch-engine)                             |
| v0.8.0  |       | PWA Capabilities                                                                 |
| v0.9.0  |       | [Inspector & Developer Tools](#inspector--developer-tools)                       |
| v1.0.0  |       | [Stable Release](#stable-release)                                                |

## Completed

_NOTE_: `data-x-*` is now `data-volt-*`

### Foundations

**Goal:** Establish project structure, tooling, and base reactivity primitives.
**Outcome:** A bootable TypeScript project with working reactivity primitives and test coverage.
**Summary:** A TypeScript project scaffold with implemented signal() (subscribe/set/get) and foundational reactivity tests establishes the base system.

### Reactivity & Bindings

**Goal:** Connect signals to DOM via declarative `data-x-*` bindings.
**Outcome:** Reactive text/attribute binding with signals → DOM synchronization.
**Summary:** Reactive DOM bindings (`data-x-text`, `data-x-html`, `data-x-class`) with a safe expression evaluator, mutation batching, and DOM testing ensure synchronized updates between signals and UI.

### Actions & Effects

**Goal:** Add event-driven behavior and derived reactivity.
**Outcome:** Fully functional reactive UI layer with event bindings and computed updates.
**Summary:** An event binding system with `$el`, `$event`, and derived signals (computed, effect, async effects) delivers a complete reactive event-driven UI layer.

### Plugins Framework

**Goal:** Build a modular plugin architecture with dynamic registration.
**Outcome:** Stable plugin API enabling community-driven extensions.
**Summary:** A modular plugin API with lifecycle hooks and built-in extensions (persist, scroll, url) enables dynamic feature registration and community contributions.

### Backend Integration & HTTP Actions

**Goal:** Provide backend integration with declarative HTTP requests and responses.
**Outcome:** Volt.js can make backend requests and update the DOM
**Summary:** Declarative HTTP directives (data-volt-get|post|put|patch|delete) with swap strategies, loading indicators, error handling, and form serialization integrate Volt.js seamlessly with backend APIs.

### Markup Based Reactivity

**Goal:** Allow Volt apps to declare state, bindings, and behavior entirely in HTML markup
**Outcome:** Authors can ship examples without companion JavaScript bundles
**Summary:** Declarative HTML state, binding, control-flow, and event directives with SSR support and a sandboxed evaluator enable Volt apps to run without separate JavaScript bundles.

### Proxy-Based Reactivity Enhancements

**Goal:** Use JavaScript Proxies to improve reactivity ergonomics and automatic dependency tracking.
**Outcome:** More intuitive API with automatic dependency tracking and optional deep reactivity for objects/arrays.
**Summary:** Proxy-driven automatic dependency tracking, deep reactive() objects, reactive arrays, lazy signal creation, and debugging utilities improve reactivity ergonomics and performance.
**Notes:**
    - Separate reactive() function for objects/arrays to gives users choice
    - Keep .get()/.set() - explicitness is valuable for understanding reactivity (include in docs)

### Reactive Attributes & Event Modifiers

**Goal:** Extend Volt.js with expressive attribute patterns and event options for fine-grained control.
**Outcome:** Volt.js supports rich declarative behaviors and event semantics built entirely on standard DOM APIs.
**Summary:** Introduced expressive attribute patterns and event modifiers for precise DOM and input control, for fine-grained declarative behavior entirely through standard DOM APIs.

### Global State

**Goal:** Implement store/context pattern
**Outcome:** Volt.js provides intuitive global state management
**Deliverables:**
    - `$origin` - Reference to the root element of the active reactive scope.
    - `$scope` - Reference to the current reactive scope object (signals + context).
    - `$pulse()` - Defers execution to the next microtask tick after DOM updates.
        - Example: `data-volt-on-click="$count++; $pulse(() => console.log('updated'))"`
    - `$store` - Accesses global reactive state registered with Volt’s global store.
        - Example: `data-volt-text="$store.theme"`
    - `$uid(name?)` - Generates a unique, deterministic ID string within the current scope.
        - Example: `data-volt-id="$uid('field')"`
    - `$probe(expr, fn)` - Imperatively observes a reactive signal or expression within the current scope.
        - Example: `data-volt-init="$probe('count', v => console.log(v))"`
    - `$pins` - Scoped element references via `data-volt-pin="name"`. Provides an object mapping ref/pin names to DOM nodes.
        - Example: `data-volt-on-click="$pins.username.focus()"`
    - `$arc(event, detail?)` - Dispatches a native CustomEvent from the current element.
        - Example: `data-volt-on-click="$arc('user:save', { id })"`

## To-Do

### Animation & Transitions

**Goal:** Add animation primitives for smooth UI transitions with Alpine/Datastar parity.
**Outcome:** Volt.js enables declarative animations and view transitions alongside reactivity.
**Deliverables:**
    - `data-volt-surge` directive with enter/leave transitions
        - Transition modifiers (duration, delay, opacity, scale, etc.)
        - View Transitions API integration (when available)
        - CSS-based transition helpers
    - `data-volt-shift` plugin for keyframe animations
        - Timing utilities and easing functions
    - Integration with `data-volt-if` and `data-volt-show` for automatic transitions

### Streaming & Patch Engine

**Goal:** Enable real-time updates via SSE/WebSocket streaming with intelligent DOM patching.
**Outcome:** Volt.js can receive and apply live updates from the server
**Deliverables:**
    - Server-Sent Events (SSE) integration
    - `data-volt-flow` attribute for SSE endpoints
    - Signal patching from backend (`data-signals-*` merge system)
    - Backend action system with `$$spark()` syntax
    - JSON Patch parser and DOM morphing engine
    - WebSocket as alternative to SSE
    - `data-volt-ignore-morph` for selective patch exclusion

### Persistence & Offline

**Goal:** Introduce persistent storage and offline-first behaviors.
**Outcome:** Resilient state persistence and offline replay built into Volt.js.
**Deliverables:**
    - ✓ Persistent signals (localStorage, sessionStorage, indexedDb)
    - ✓ Storage plugin (`data-volt-persist`)
    - Storage modifiers on signals:
        - `.local` modifier for localStorage persistence
        - `.session` modifier for sessionStorage persistence
        - `.ifmissing` modifier for conditional initialization
    - Offline queue for deferred stream events and HTTP requests
    - Sync strategy API (merge, overwrite, patch) for conflict resolution
    - Service Worker integration for offline-first apps
    - Background sync for deferred requests
    - Cache invalidation strategies
    - Cross-tab synchronization via `BroadcastChannel`

### Background Requests & Reactive Polling

**Goal:** Enable declarative background data fetching and periodic updates within the Volt.js runtime.
**Outcome:** Volt.js elements can fetch or refresh data automatically based on time, visibility, or reactive conditions.
**Deliverables:**
    - `data-volt-visible` for fetching when an element enters the viewport (`IntersectionObserver`)
    - `data-volt-fetch` attribute for declarative background requests
        - Configurable polling intervals, delays, and signal-based triggers
        - Automatic cancellation of requests when elements are unmounted
        - Conditional execution tied to reactive signals
        - Integration hooks for loading and pending states
    - Background task scheduler with priority management

### Navigation & History Management

**Goal:** Introduce seamless client-side navigation and stateful history control using web standards.
**Outcome:** Volt.js provides enhanced navigation behavior with minimal overhead and full accessibility support.
**Deliverables:**
    - `data-volt-navigate` for intercepting link and form actions
        - Integration with the History API (`pushState`, `replaceState`, `popState`)
        - Reactive synchronization of route and signal state
        - Smooth page and fragment transitions coordinated with Volt’s signal system
        - Native back/forward button support
        - Scroll position persistence and restoration
            - Preloading of linked resources on hover or idle
    - `data-volt-url` for declarative history updates
        - View Transition API integration for animated route changes

### Inspector & Developer Tools

**Goal:** Improve developer experience and runtime introspection.
**Outcome:** First-class developer ergonomics; Volt.js is enjoyable to debug and extend.
**Deliverables:**
    - Developer overlay for inspecting signals, subscriptions, and effects
    - Dev logging toggle (`Volt.debug = true`)
    - Browser console integration (`window.$volt.inspect()`)
    - Signal dependency graph visualization (graph data structure implemented in [proxy](#proxy-based-reactivity-enhancements) milestone)
    - Performance profiling tools
    - Request/response debugging (HTTP actions, SSE streams)
    - Time-travel debugging for signal history
    - Browser DevTools extension

### Stable Release

**Goal:** Prepare & ship the stable release
**Outcome:** Volt.js 1.0 is stable, documented, performant, and ready for production.
**Deliverables:**
    - ✓ Documentation site (VitePress)
    - Full API reference with examples
    - Create generator in `@voltx/cli` package
    - Finalized plugin registry and CLI (`volt plugins list/init`)
    - Versioned documentation (stormlightlabs.github.io/volt)
    - Announcement post and release notes
    - Community contribution guide & governance doc

## Parking Lot

## Examples

Many of these are ideas, not planned to be implemented

### Components

- Modal Dialog - Conditional rendering, focus trapping, backdrop, keyboard escape
- Tabs & Accordion - Conditional rendering, active state management, keyboard navigation
- Form Validation - Model binding, computed validation, conditional messages, error states

### Client-Side (SPA/Static)

- ✓ Counter - Basic signals, computed, event handling
- ✓ TodoMVC - List rendering, persistence, filtering, CRUD operations
- Search with Autocomplete - Async effects, debouncing, API integration, keyboard navigation
- Calculator - Event handling, computed expressions, button grid, operation state
- Image Gallery - For loops, filtering, lightbox, category selection

- Multi-Step Wizard - Form state across steps, validation per step, progress tracking, navigation
- Note-Taking App - Rich CRUD, categories/tags, search/filter, localStorage persistence, markdown preview
- Expense Tracker - Date handling, categories, computed totals/charts, filtering by date range, CSV export
- Kanban Board - Drag-and-drop (via events), column management, task editing, state persistence
- Timer/Stopwatch - Async effects, intervals, lap times, pause/resume, localStorage for history

- Real-time Chat - SSE for messages, typing indicators, user presence, message history
- Live Dashboard - SSE for metrics, charts updating in real-time, WebSocket fallback
- Collaborative Editor - Operational transforms, SSE for changes, conflict resolution, cursor positions
- Infinite Scroll Feed - Polling for new items, intersection observer, virtualized rendering
- Admin Panel/CMS - CRUD operations, data tables, filters, pagination, bulk actions

### Server-Side Rendered (SSR)

These will live in an example repo.

- Authentication Flows - Login, signup, password reset, email verification (Go, Python, Rust, Node)
- File Upload with Progress - Chunked uploads, progress bars, validation (Go, Python, Rust, Node)
- Search with Server-Side Filtering - Debounced search, paginated results (Go, Python,Rust,  Node)

### Desktop Apps

- Note Editor - Local file system, syntax highlighting, multi-tab, settings persistence
- System Monitor - CPU/memory graphs, process list, real-time updates
- Database Client - Table browser, query editor, result grid, export
- Media Player - File browser, playlists, controls, metadata display

## Docs

- [ ] Document `charge()` bootstrap flow and declarative state/computed attributes (`data-volt-state`, `data-volt-computed:*`).
- [ ] Add async effect guide covering abort signals, debounce/throttle, retries, and `onError` handling.
- [ ] Write lifecycle instrumentation docs for `registerGlobalHook`, `registerElementHook`, `getElementBindings`, and plugin `context.lifecycle` callbacks.
- [ ] Explain `data-volt-bind:*` semantics, especially boolean attribute handling and dependency subscription behavior.
- [ ] Refresh README and overview content to reflect the current module layout.
