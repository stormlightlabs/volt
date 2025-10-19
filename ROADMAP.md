# Roadmap

- [Completed](#completed)
- [TODO](#to-do)
- [Examples (Planned)](#examples)

| Version | State | Milestone                                                  | Summary                                                                  |
| ------- | ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
|         |   ✓   | [Foundations](#foundations)                                | Initial project setup, tooling, and reactive signal prototype.           |
|         |   ✓   | [Reactivity & Bindings](#reactivity--bindings)             | Core DOM bindings (`data-volt-*`) and declarative updates.                  |
|         |   ✓   | [Actions & Effects](#actions--effects)                     | Event system and derived reactivity primitives.                          |
|         |   ✓   | [Plugins Framework](#plugins-framework)                    | Modular plugin system and first built-in plugin set.                     |
|         |       | [Streaming & Patch Engine](#streaming--patch-engine)       | SSE/WebSocket JSON patch streaming.                                      |
|         |       | [Persistence & Offline](#persistence--offline)             | State persistence, storage sync, and fallback behaviors.                 |
| v0.1.0  |   ✓   | [Markup Based Reactivity](#markup-based-reactivity)        | Allow users to write apps without any bundled JS                         |
| v0.2.0  |       | [Animation & Transitions](#animation--transitions)         | Declarative animation layer and browser View Transition API integration. |
| v0.3.0  |       | [Inspector & Developer Tools](#inspector--developer-tools) | Built-in signal inspector, debug overlays, and dev tooling.              |
| v0.4.0  |       | [Docs & Stability](#documentation--stability-pass)         | Comprehensive docs, tests, and performance review.                       |
| v0.5.0  |       | PWA Capabilities                                           | TODO                                                                     |
| v1.0.0  |       | [Release](#stable-release)                                 | Public API freeze, plugin registry, and versioned documentation.         |

## Completed

_NOTE_: `data-x-*` is now `data-volt-*`

### Foundations

**Goal:** Establish project structure, tooling, and base reactivity primitives.
**Outcome:** A bootable TypeScript project with working reactivity primitives and test coverage.
**Deliverables:**
    - ✓ Project scaffolding
    - ✓ `signal()` implementation with subscribe/set/get
    - ✓ Initial tests (signals, reactivity basics)

### Reactivity & Bindings

**Goal:** Connect signals to DOM via declarative `data-x-*` bindings.
**Outcome:** Reactive text/attribute binding with signals → DOM synchronization.
**Deliverables:**
    - ✓ `data-x-text`, `data-x-html`, `data-x-class` binding parser
    - ✓ Expression evaluator (safe, minimal subset)
    - ✓ DOM mutation batching & cleanup
    - ✓ Internal test harness for bindings
    - ✓ DOM Testing Library integration tests

### Actions & Effects

**Goal:** Add event-driven behavior and derived reactivity.
**Outcome:** Fully functional reactive UI layer with event bindings and computed updates.
**Deliverables:**
    - ✓ Event binding system (`data-volt-on-*`)
    - ✓ `$el` and `$event` scoped references
    - ✓ Derived signals (`computed`, `effect`)
    - ✓ Async effects (e.g., fetch triggers)

### Plugins Framework

**Goal:** Build a modular plugin architecture with dynamic registration.
**Outcome:** Stable plugin API enabling community-driven extensions.
**Deliverables:**
    - ✓ `registerPlugin(name, fn)` API
    - ✓ Context and lifecycle hooks
    - ✓ Built-ins:
        - ✓ `data-volt-persist`
        - ✓ `data-volt-scroll`
        - ✓ `data-volt-url`
    - ✓ Registry

### Backend Integration & HTTP Actions

**Goal:** Provide backend integration with declarative HTTP requests and responses.
**Outcome:** Volt.js can make backend requests and update the DOM
**Deliverables:**
    - ✓ HTTP action system (`data-volt-get`, `data-volt-post`, `data-volt-put`, `data-volt-patch`, `data-volt-delete`)
    - ✓ Request configuration (`data-volt-trigger`, `data-volt-target`, `data-volt-swap`)
    - ✓ Swap strategies (innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend, delete, none)
    - ✓ Loading states and indicators (`data-volt-indicator`)
    - ✓ Error handling and retry logic
    - ✓ Form serialization and submission
    - ✓ Request/response headers customization

## To-Do

### Markup Based Reactivity

**Goal:** Allow Volt apps to declare state, bindings, and behavior entirely in HTML markup
**Outcome:** Authors can ship examples without companion JavaScript bundles
**Deliverables:**
    - ✓ Auto-bootstrapping loader (`volt.min.js`) that detects `data-volt` roots and hydrates one scope per root.
    - ✓ Declarative state primitives (`data-volt-state`, `data-volt-computed:*`) aligned with `docs/reactivity-spec.md`.
    - ✓ Binding directives for text, attributes, classes, styles, and two-way form controls (`data-volt-[bind|text|model|class:*]`).
    - ✓ Control-flow directives (`data-volt-for`, `data-volt-if`, `data-volt-else`) with lifecycle-safe teardown.
    - ✓ Declarative event system (`data-volt-on:*`) with helper surface for list mutations and plugin hooks.
    - ✓ SSR compatibility helpers
    - Sandboxed expression evaluator

### Streaming & Patch Engine

**Goal:** Enable real-time updates via SSE/WebSocket streaming with intelligent DOM patching.
**Outcome:** Volt.js can receive and apply live updates from the server
**Deliverables:**
    - Server-Sent Events (SSE) integration
    - `data-volt-stream` attribute for SSE endpoints
    - Signal patching from backend (`data-signals-*` merge system)
    - Backend action system with `$$action()` syntax (TBD on final syntax decision)
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

### Reactive Attributes & Event Modifiers

**Goal:** Extend Volt.js with expressive attribute patterns and event options for fine-grained control.
**Outcome:** Volt.js supports rich declarative behaviors and event semantics built entirely on standard DOM APIs.
**Deliverables:**
    - `data-volt-show` — toggles element visibility via CSS rather than DOM removal (complements `data-volt-if`)
    - `data-volt-style` — binds inline styles to reactive expressions
    - `data-volt-skip` — marks elements or subtrees to exclude from Volt’s reactive parsing
    - `data-volt-cloak` — hides content until the Volt runtime initializes
    - Event options for `data-volt-on-*` attributes:
        - `.prevent` — calls `preventDefault()` on the event
        - `.stop` — stops propagation
        - `.self` — triggers only when the event target is the bound element
        - `.window` — attaches the listener to `window`
        - `.document` — attaches the listener to `document`
        - `.once` — runs the handler a single time
        - `.debounce` — defers handler execution (optional milliseconds)
        - `.throttle` — limits handler frequency (optional milliseconds)
        - `.passive` — adds a passive event listener for scroll/touch performance
    - Input options for `data-volt-bind` and `data-volt-model`:
        - `.number` — coerces values to numbers
        - `.trim` — removes surrounding whitespace
        - `.lazy` — syncs only on `change` instead of `input`
        - `.debounce` — delays updates to reduce jitter

### Global State

**Goal:** Implement store/context pattern
**Outcome:** Volt.js provides intuitive global state management
**Deliverables:**
    - `$refs` - Scoped element references via data-volt-ref="name". Provides an object mapping ref names to DOM nodes.
        - Example: `data-volt-on-click="$refs.username.focus()"`
    - `$next()` - Defers execution to the next microtask tick after DOM updates.
        - Example: `data-volt-on-click="$count++; $next(() => console.log('updated'))"`
    - `$watch(expr, fn)` - Imperatively observes a reactive signal or expression within the current scope.
        - Example: `data-volt-init="$watch('count', v => console.log(v))"`
    - `$emit(event, detail?)` - Dispatches a native CustomEvent from the current element.
        - Example: `data-volt-on-click="$emit('user:save', { id })"`
    - `$store` - Accesses global reactive state registered with Volt’s global store.
        - Example: `data-volt-text="$store.theme"`
    - `$uid(name?)` - Generates a unique, deterministic ID string within the current scope.
        - Example: `data-volt-id="$uid('field')"`
    - `$root` - Reference to the root element of the active reactive scope.
    - `$scope` - Reference to the current reactive scope object (signals + context).

### Animation & Transitions

**Goal:** Add animation primitives for smooth UI transitions with Alpine/Datastar parity.
**Outcome:** Volt.js enables declarative animations and view transitions alongside reactivity.
**Deliverables:**
    - `data-volt-transition` directive with enter/leave transitions
    - Transition modifiers (duration, delay, opacity, scale, etc.)
    - View Transitions API integration (when available)
    - CSS-based transition helpers
    - `data-volt-animate` plugin for keyframe animations
    - Timing utilities and easing functions
    - Integration with `data-volt-if` and `data-volt-show` for automatic transitions

### Background Requests & Reactive Polling

**Goal:** Enable declarative background data fetching and periodic updates within the Volt.js runtime.
**Outcome:** Volt.js elements can fetch or refresh data automatically based on time, visibility, or reactive conditions.
**Deliverables:**
    - `data-volt-fetch` attribute for declarative background requests
    - Configurable polling intervals, delays, and signal-based triggers
    - `data-volt-visible` for fetching when an element enters the viewport (`IntersectionObserver`)
    - Background task scheduler with priority management
    - Automatic cancellation of requests when elements are unmounted
    - Conditional execution tied to reactive signals
    - Integration hooks for loading and pending states

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
    - Optional preloading of linked resources on hover or idle
    - `data-volt-url` for declarative history updates
    - Optional View Transition API integration for animated route changes

### Inspector & Developer Tools

**Goal:** Improve developer experience and runtime introspection.
**Outcome:** First-class developer ergonomics; Volt.js is enjoyable to debug and extend.
**Deliverables:**
    - Developer overlay for inspecting signals, subscriptions, and effects
    - Dev logging toggle (`Volt.debug = true`)
    - Browser console integration (`window.$volt.inspect()`)
    - Signal dependency graph visualization
    - Performance profiling tools
    - Request/response debugging (HTTP actions, SSE streams)
    - Time-travel debugging for signal history
    - Browser DevTools extension

### Documentation & Stability Pass

**Goal:** Prepare for stable release by finalizing docs, polish, and performance.
**Outcome:** Volt.js is stable, documented, performant, and ready for production.
**Deliverables:**
    - ✓ Documentation site (VitePress)
    - Full API reference with examples
    - Performance benchmarks (vs htmx, Alpine)
    - Browser matrix tests (Chromium, Gecko, WebKit)
    - Accessibility audits (ARIA)
    - Freeze API surface for 1.0

### Stable Release

**Goal:** Ship the first stable version of Volt.js
**Outcome:** Volt.js 1.0 is released as a mature, fully documented, type-safe, reactive web framework
**Deliverables:**
    - Finalized plugin registry and CLI (`volt plugins list/init`)
    - Versioned documentation (stormlightlabs.github.io/volt)
    - Announcement post and release notes
    - Community contribution guide & governance doc

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
