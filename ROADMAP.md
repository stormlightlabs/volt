# Roadmap

| Version | State | Milestone                                                  | Summary                                                                  |
| ------- | ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
|         |   ✓   | [Foundations](#foundations)                                | Initial project setup, tooling, and reactive signal prototype.           |
|         |   ✓   | [Reactivity & Bindings](#reactivity--bindings)             | Core DOM bindings (`data-x-*`) and declarative updates.                  |
|         |   ✓   | [Actions & Effects](#actions--effects)                     | Event system and derived reactivity primitives.                          |
|         |       | [Plugins Framework](#plugins-framework)                    | Modular plugin system and first built-in plugin set.                     |
|         |       | [Streaming & Patch Engine](#streaming--patch-engine)       | SSE/WebSocket JSON patch streaming.                                      |
|         |       | [Persistence & Offline](#persistence--offline)             | State persistence, storage sync, and fallback behaviors.                 |
| v0.1.0  |   ✓   | [Markup Based Reactivity](#markup-based-reactivity)        | Allow users to write apps without any bundled JS                         |
| v0.2.0  |       | [Animation & Transitions](#animation--transitions)         | Declarative animation layer and browser View Transition API integration. |
| v0.3.0  |       | [Inspector & Developer Tools](#inspector--developer-tools) | Built-in signal inspector, debug overlays, and dev tooling.              |
| v0.4.0  |       | [Docs & Stability](#documentation--stability-pass)         | Comprehensive docs, tests, and performance review.                       |
| v0.5.0  |       | PWA Capabilities                                           | TODO                                                                     |
| v1.0.0  |       | [Release](#stable-release)                                 | Public API freeze, plugin registry, and versioned documentation.         |

## Details

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
    - ✓ Event binding system (`data-x-on-*`)
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
        - ✓ `data-x-persist`
        - ✓ `data-x-scroll`
        - ✓ `data-x-url`
    - ✓ Tests & registry
    - ✓ Setup test coverage with generous thresholds (~50%)
    - Example in docs/examples/plugins.md
    - End-to-end examples (counter, form, live field updates)
        - `docs/examples/reactivity.md`
            - `actions`, `effects`, `signals`

### Streaming & Patch Engine

**Goal:** Enable real-time updates via SSE/WebSocket streaming.
**Outcome:** Volt.js can receive and apply live updates from the server
**Deliverables:**
    - JSON Patch parser and DOM applier
    - `data-volt-stream` attribute
    - Reconnection/backoff logic
    - Raise test coverage threshold to 60%
    - Integration test with mock SSE server
    - Benchmarks for patch vs re-render
    - Performance test suite

### Persistence & Offline

**Goal:** Introduce persistent storage and offline-first behaviors.
**Outcome:** Resilient state persistence and offline replay built into Volt.js.
**Deliverables:**
    - ✓ Persistent signals (localStorage, sessionStorage, indexedDb)
    - ✓ Storage plugin (`data-x-persist`)
    - Offline queue for deferred stream events
    - Sync strategy API (merge, overwrite, patch)
    - Example apps: note editor ([golang](#examples)), counter with persistence ([spa](#examples))

### Animation & Transitions

**Goal:** Add animation primitives for smooth UI transitions.
**Outcome:** Volt.js enables declarative animations and view transitions alongside reactivity.
**Deliverables:**
    - `data-volt-animate` plugin
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
    - ✓ Documentation site (VitePress)
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
    - Versioned documentation (stormlightlabs.github.io/volt)
    - Announcement post and release notes
    - Community contribution guide & governance doc

### Markup Based Reactivity

**Goal:** Allow Volt apps to declare state, bindings, and behavior entirely in HTML markup
**Outcome:** Authors can ship examples without companion JavaScript bundles
**Deliverables:**
    - ✓ Auto-bootstrapping loader (`volt.min.js`) that detects `data-volt` roots and hydrates one scope per root.
    - ✓ Declarative state primitives (`data-volt-state`, `data-volt-computed:*`) aligned with `docs/reactivity-spec.md`.
    - ✓ Binding directives for text, attributes, classes, styles, and two-way form controls (`data-volt-[bind|text|model|class:*]`).
    - ✓ Control-flow directives (`data-volt-for`, `data-volt-if`, `data-volt-else`) with lifecycle-safe teardown.
    - ✓ Declarative event system (`data-volt-on:*`) with helper surface for list mutations and plugin hooks.
    - SSR compatibility helpers and sandboxed expression evaluator

## Examples

- SSR
    - Django (separate repo)
    - FastAPI + jinja2 (separate repo)
    - Golang + templ (separate repo)
    - Fastify (separate repo)
    - Express
    - Golang
- SPA
    - Web
    - Tauri
    - Wails
