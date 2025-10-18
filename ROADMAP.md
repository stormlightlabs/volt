# Roadmap

| Version | Milestone                                                  | Summary                                                                  |
| ------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| v0.1.0  | [Foundations](#foundations)                                | Initial project setup, tooling, and reactive signal prototype.           |
| v0.2.0  | [Reactivity & Bindings](#reactivity--bindings)             | Core DOM bindings (`data-x-*`) and declarative updates.                  |
| v0.3.0  | [Actions & Effects](#actions--effects)                     | Event system and derived reactivity primitives.                          |
| v0.4.0  | [Plugins Framework](#plugins-framework)                    | Modular plugin system and first built-in plugin set.                     |
| v0.5.0  | [Streaming & Patch Engine](#streaming--patch-engine)       | SSE/WebSocket JSON patch streaming.                                      |
| v0.6.0  | [Persistence & Offline](#persistence--offline)             | State persistence, storage sync, and fallback behaviors.                 |
| v0.7.0  | [Animation & Transitions](#animation--transitions)         | Declarative animation layer and browser View Transition API integration. |
| v0.8.0  | [Inspector & Developer Tools](#inspector--developer-tools) | Built-in signal inspector, debug overlays, and dev tooling.              |
| v0.9.0  | [Docs & Stability](#documentation--stability-pass)         | Comprehensive docs, tests, and performance review.                       |
| v1.0.0  | [Release](#stable-release)                                 | Public API freeze, plugin registry, and versioned documentation.         |

## Details

### Foundations

**Goal:** Establish project structure, tooling, and base reactivity primitives.
**Outcome:** A bootable TypeScript project with working reactivity primitives and test coverage.
**Deliverables:**
    - Project scaffolding
    - `signal()` implementation with subscribe/set/get
    - Initial tests (signals, reactivity basics)

### Reactivity & Bindings

**Goal:** Connect signals to DOM via declarative `data-x-*` bindings.
**Outcome:** Reactive text/attribute binding with signals → DOM synchronization.
**Deliverables:**
    - `data-x-text`, `data-x-html`, `data-x-class` binding parser
    - Expression evaluator (safe, minimal subset)
    - DOM mutation batching & cleanup
    - Internal test harness for bindings
    - DOM Testing Library integration tests
    - Updated documentation examples

### Actions & Effects

**Goal:** Add event-driven behavior and derived reactivity.
**Outcome:** Fully functional reactive UI layer with event bindings and computed updates.
**Deliverables:**
    - Event binding system (`data-x-on-*`)
    - `$el` and `$event` scoped references
    - Derived signals (`computed`, `effect`)
    - Async effects (e.g., fetch triggers)
    - End-to-end examples (counter, form, live field updates)
    - 90%+ unit test coverage on core modules

### Plugins Framework

**Goal:** Build a modular plugin architecture with dynamic registration.
**Outcome:** Stable plugin API enabling community-driven extensions.
**Deliverables:**
    - `registerPlugin(name, fn)` API
    - Context and lifecycle hooks
    - Built-ins:
        - `data-x-persist`
        - `data-x-scroll`
        - `data-x-url`
    - Tests & registry
    - Example in docs

### Streaming & Patch Engine

**Goal:** Enable real-time updates via SSE/WebSocket streaming.
**Outcome:** Volt.js can receive and apply live updates from the server — the “reactive stream” milestone.
**Deliverables:**
    - JSON Patch parser and DOM applier
    - `data-x-stream` attribute
    - Reconnection/backoff logic
    - Integration test with mock SSE server
    - Benchmarks for patch vs re-render
    - Performance test suite

### Persistence & Offline

**Goal:** Introduce persistent storage and offline-first behaviors.
**Outcome:** Resilient state persistence and offline replay built into Volt.js.
**Deliverables:**
    - Persistent signals (localStorage, sessionStorage)
    - Storage plugin (`data-x-persist`)
    - Offline queue for deferred stream events
    - Sync strategy API (merge, overwrite, patch)
    - Example apps: note editor, counter with persistence

### Animation & Transitions

**Goal:** Add animation primitives for smooth UI transitions.
**Outcome:** Volt.js enables declarative animations and view transitions alongside reactivity.
**Deliverables:**
    - `data-x-animate` plugin
    - View Transition API support (when available)
    - CSS-based transition helpers
    - Timing utilities (`transition`, `raf`)
    - Plugin tests and performance profiling

### Inspector & Developer Tools

**Goal:** Improve developer experience and runtime introspection.
**Outcome:** First-class developer ergonomics; Volt.js is enjoyable to debug and extend.
**Deliverables:**
    - Developer overlay for inspecting signals, subscriptions, and effects
    - Dev logging toggle (`Volt.debug = true`)
    - Browser console integration (`window.$volt.inspect()`)
    - Visualization plugin for dependency graph
    - Testing coverage for dev mode

### Documentation & Stability Pass

**Goal:** Prepare for stable release by finalizing docs, polish, and performance.
**Outcome:** Volt.js is stable, documented, performant, and ready for production.
**Deliverables:**
    - Documentation site (VitePress)
    - Full API reference with examples
    - Migration and versioning guide
    - Performance benchmarks (vs htmx, Alpine)
    - Browser matrix tests (Chromium, Gecko, WebKit)
    - Accessibility audits (ARIA reactivity)
    - Freeze API surface for 1.0

### Stable Release

**Goal:** Ship the first stable version of Volt.js.
**Outcome:** Volt.js 1.0 is released as a mature, fully documented, type-safe, reactive web framework
**Deliverables:**
    - Finalized plugin registry and CLI (`volt plugins list/init`)
    - Versioned documentation (docs.voltjs.dev)
    - Announcement post and release notes
    - Long-term support plan (LTS cadence)
    - Community contribution guide & governance doc
