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
| v0.4.0  |   ✓   | [Animation & Transitions](#animation--transitions)                               |
| v0.5.0  |   ✓   | [Navigation & History API Routing](#navigation--history-api-routing)             |
|         |   ✓   | [Refactor](#evaluator--binder-hardening)                                         |
| v0.5.1  |       | [Error Handling & Diagnostics](#error-handling--diagnostics)                     |
| v0.5.2  |       |                                                                                  |
| v0.5.3  |       |                                                                                  |
| v0.5.4  |       |                                                                                  |
| v0.6.1  |       | [Persistence & Offline](#persistence--offline)                                   |
| v0.6.2  |       |                                                                                  |
| v0.6.3  |       |                                                                                  |
| v0.6.4  |       | [Background Requests & Reactive Polling](#background-requests--reactive-polling) |
| v0.6.5  |       |                                                                                  |
| v0.6.6  |       |                                                                                  |
| v0.6.7  |       | [Streaming & Patch Engine](#streaming--patch-engine)                             |
| v0.6.8  |       |                                                                                  |
| v0.6.9  |       |                                                                                  |
| v0.6.10 |       |                                                                                  |
| v0.7.0  |       |                                                                                  |
| v0.8.0  |       | Support `voltx-` & `vx-` attributes: recommend `vx-`                             |
|         |       | Switch to `data-voltx`                                                           |
|         |       | Update demo to be a multi page application with routing plugin                   |
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
**Outcome:** VoltX.js can make backend requests and update the DOM
**Summary:** Declarative HTTP directives (data-volt-get|post|put|patch|delete) with swap strategies, loading indicators, error handling, and form serialization integrate VoltX.js seamlessly with backend APIs.

### Markup Based Reactivity

**Goal:** Allow Volt apps to declare state, bindings, and behavior entirely in HTML markup
**Outcome:** Authors can ship examples without companion JavaScript bundles
**Summary:** Declarative HTML state, binding, control-flow, and event directives with SSR support and a sandboxed evaluator enable Volt apps to run without separate JavaScript bundles.

### Proxy-Based Reactivity Enhancements

**Goal:** Use JavaScript Proxies to improve reactivity ergonomics and automatic dependency tracking.
**Outcome:** More intuitive API with automatic dependency tracking and optional deep reactivity for objects/arrays.
**Summary:** Proxy-driven automatic dependency tracking, deep reactive() objects, reactive arrays, lazy signal creation, and debugging utilities improve reactivity ergonomics and performance.

### Reactive Attributes & Event Modifiers

**Goal:** Extend VoltX.js with expressive attribute patterns and event options for fine-grained control.
**Outcome:** VoltX.js supports rich declarative behaviors and event semantics built entirely on standard DOM APIs.
**Summary:** Introduced expressive attribute patterns and event modifiers for precise DOM and input control, for fine-grained declarative behavior entirely through standard DOM APIs.

### Global State

**Goal:** Implement store/context pattern
**Outcome:** VoltX.js provides intuitive global state management
**Summary:** The scope injects helpers like `$origin`, `$scope`, `$pulse`, `$store`, `$uid`, `$probe`, `$pins`, and `$arc`, giving templates access to global state, microtask scheduling, deterministic IDs, element refs, and custom event dispatch without leaving declarative markup.

### Animation & Transitions

**Goal:** Add animation primitives for smooth UI transitions with Alpine/Datastar parity.
**Outcome:** VoltX.js enables declarative animations and view transitions alongside reactivity.
**Summary:** The surge directive ships fade/slide/scale/blur presets with duration and delay overrides, per-phase enter/leave control, and easing helpers, while the shift plugin applies reusable keyframe animations—both composable with `data-volt-if`/`data-volt-show` as showcased in the animations demo.

### Navigation & History API Routing

**Goal:** Provide seamless client-side navigation with a first-class History API router.
**Outcome:** VoltX.js delivers accessible, stateful navigation with clean URLs and signal-driven routing.
**Summary:** Added seamless client-side navigation through a History API–powered router, enabling declarative routing with `data-volt-navigate` and `data-volt-url`, reactive URL synchronization, smooth transitions, scroll and focus restoration, dynamic route parsing, and full integration with signals and the View Transition API for accessible, stateful navigation and clean URLs.

## To-Do

### Error Handling & Diagnostics

**Goal**: Provide clear, actionable feedback when runtime or directive errors occur.
**Outcome**: VoltX.js surfaces developer-friendly diagnostics for expression evaluation,
directive parsing, and network operations, making it easier to debug apps without opaque stack traces.
**Deliverables**:
    - v0.5.1
        - Centralized error boundary system for directives and effects.
        - Sandbox error wrapping with contextual hints (directive name, expression, element).
        - `$volt.report(error, context)` API for plugin and app-level reporting.
    - v0.5.2
        - Visual in-DOM error overlays for development mode.
        - Enhanced console messages with source map trace and directive path.
        - Differentiated error levels: warn, error, fatal.
    - v0.5.3
        - Runtime health monitor tracking evaluation and subscription failures.
        - Optional integration hooks for external logging tools
    - v0.5.4
        - Documentation: "Understanding VoltX Errors" guide.
        - Configurable global error policy (silent, overlay, throw).

### Streaming & Patch Engine

**Goal:** Enable real-time updates via SSE/WebSocket streaming with intelligent DOM patching.
**Outcome:** VoltX.js can receive and apply live updates from the server
**Deliverables:**
    - v0.5.7
        - Server-Sent Events (SSE) integration
        - `data-volt-flow` attribute for SSE endpoints
    - v0.5.8
        - Signal patching from backend (`data-signals-*` merge system)
        - Backend action system with `$$spark()` syntax
    - v0.5.9
        - JSON Patch parser and DOM morphing engine
        - `data-volt-ignore-morph` for selective patch exclusion
    - v0.5.10
        - WebSocket as alternative to SSE

### Persistence & Offline

**Goal:** Introduce persistent storage and offline-first behaviors.
**Outcome:** Resilient state persistence and offline replay built into VoltX.js.
**Deliverables:**
    - ✓ Persistent signals (localStorage, sessionStorage, indexedDb)
    - ✓ Storage plugin (`data-volt-persist`)
    - v0.5.1
        - Storage modifiers on signals:
            - `.local` modifier for localStorage persistence
            - `.session` modifier for sessionStorage persistence
            - `.ifmissing` modifier for conditional initialization
    - v0.5.2
        - Sync strategy API (merge, overwrite, patch) for conflict resolution
        - Cache invalidation strategies
    - v0.5.3
        - Offline queue for deferred stream events and HTTP requests
        - Service Worker integration for offline-first apps
        - Background sync for deferred requests
        - Cross-tab synchronization via `BroadcastChannel`

### Background Requests & Reactive Polling

**Goal:** Enable declarative background data fetching and periodic updates within the VoltX.js runtime.
**Outcome:** VoltX.js elements can fetch or refresh data automatically based on time, visibility, or reactive conditions.
**Deliverables:**
    - v0.5.4
        - `data-volt-visible` for fetching when an element enters the viewport (`IntersectionObserver`)
    - v0.5.5
        - `data-volt-fetch` attribute for declarative background requests
            - Configurable polling intervals, delays, and signal-based triggers
            - Automatic cancellation of requests when elements are unmounted
            - Conditional execution tied to reactive signals
            - Integration hooks for loading and pending states
    - v0.5.6
        - Background task scheduler with priority management

### Inspector & Developer Tools

**Goal:** Improve developer experience and runtime introspection.
**Outcome:** First-class developer ergonomics; VoltX.js is enjoyable to debug and extend.
**Deliverables:**
    - v0.9.1
        - Developer overlay for inspecting signals, subscriptions, and effects
        - Time-travel debugging for signal history
    - v0.9.2
        - Signal dependency graph visualization (graph data structure implemented in [proxy](#proxy-based-reactivity-enhancements) milestone)
    - v0.9.3
        - Browser console integration (`window.$volt.inspect()`)
        - Dev logging toggle (`Volt.debug = true`)
    - v0.9.4
        - Request/response debugging (HTTP actions, SSE streams)
    - v0.9.5
        - Performance profiling tools
    - v0.9.6 to v0.9.10
        - Browser DevTools extension

### Stable Release

**Goal:** Prepare & ship the stable release
**Outcome:** VoltX.js 1.0 is stable, documented, performant, and ready for production.
**Deliverables:**
    - ✓ Documentation site (VitePress)
    - Full API reference with examples
    - Create generator in `@voltx/cli` package
    - Finalized plugin registry and CLI (`volt plugins list/init`)
    - Versioned documentation (<https://stormlightlabs.github.io/volt>)
    - Announcement post and release notes
    - Community contribution guide & governance doc

### Better Demo

**Goal:** Transform the current programmatic demo into a declarative multi-page SPA showcasing all framework and CSS features.
**Outcome:** Production-quality reference application demonstrating VoltX.js best practices and real-world patterns.
**Deliverables:**
    - Convert demo from programmatic to declarative mode (charge() + data-volt attributes)
    - Implement multi-page routing using Navigation & History API plugin
    - Add tooltips to VoltX css using data attributes
        - Example: data-vx-tooltip="Right" data-placement="right"
    - Page: Home - Framework overview and feature highlights
    - Page: Getting Started - Installation and first examples
    - Page: Reactivity - Signals, computed, effects, bindings, conditional/list rendering
    - Page: HTTP - Backend integration with all methods, swap strategies, retry logic
    - Page: State - Global stores and scope helpers ($store, $scope, $pulse, $uid, $probe, $pins, $arc)
    - Page: Persistence - localStorage/sessionStorage/IndexedDB, persist plugin, URL sync
    - Page: Animations - Surge directive, shift plugin, View Transitions
    - Page: Forms - Model binding, validation, event modifiers, multi-step forms
    - Page: CSS - Complete Volt CSS showcase (typography, layout, Tufte sidenotes, tables)
    - Page: Patterns - Real-world components (tabs, accordion, modal, autocomplete)
    - View-source friendly code with clear examples
    - Copy-paste ready patterns for common use cases

## Parking Lot

### Evaluator & Binder Hardening

All expression evaluation now flows through a cached `new Function` compiler guarded by a hardened scope proxy, with the binder slimmed into a directive registry so plugins self-register while tests verify the sandboxed error surfaces.

### Naming

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
- Search with Server-Side Filtering - Debounced search, paginated results (Go, Python, Rust,  Node)

### Desktop Apps

- Note Editor - Local file system, syntax highlighting, multi-tab, settings persistence
- System Monitor - CPU/memory graphs, process list, real-time updates
- Database Client - Table browser, query editor, result grid, export
- Media Player - File browser, playlists, controls, metadata display
