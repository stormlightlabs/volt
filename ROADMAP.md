# Roadmap

- [Completed](#completed)
- [TODO](#to-do)
    - [Parking Lot](#parking-lot)

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
| v0.5.1  |   ✓   | [Error Handling & Diagnostics](#error-handling--diagnostics) (partial)           |
| v0.6.0  |       | [Error Handling & Diagnostics](#error-handling--diagnostics)                     |
| v0.7.0  |       | [Bundle Size Optimization](#bundle-size-optimization)                            |
| v0.8.0  |       | [CSP Compatibility](#csp-compatibility)                                          |
| v0.9.0  |       | [DOM Morphing & Streaming](#dom-morphing--streaming)                             |
| v0.10.0 |       | [Scope Inheritance & State Management](#scope-inheritance--state-management)     |
| v0.11.0 |       | [Background Requests & Reactive Polling](#background-requests--reactive-polling) |
| v0.12.0 |       | [Attribute Prefix Support](#attribute-prefix-support)                            |
| v0.13.0 |       | [Persistence & Offline](#persistence--offline) (advanced features)               |
| v0.14.0 |       | [Inspector & Developer Tools](#inspector--developer-tools)                       |
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

**Focus:** Versions v0.5.5 through v0.9.x prioritize core framework capabilities and performance:

- Bundle size reduction to <15KB gzipped (currently 19KB)
- CSP compatibility (removing Function constructor dependency)
- DOM morphing and SSE streaming support
- Optional scope inheritance for improved ergonomics

These milestones strengthen VoltX.js as a signals-based reactive framework with declarative-first design.

### Error Handling & Diagnostics

**Goal**: Provide clear, actionable feedback when runtime or directive errors occur.
**Outcome**: VoltX.js surfaces developer-friendly diagnostics for expression evaluation,
directive parsing, and network operations, making it easier to debug apps without opaque stack traces.
**Deliverables**:
    - ✓ v0.5.1: Centralized error boundary system for directives and effects
    - ✓ v0.5.1: Sandbox error wrapping with contextual hints (directive name, expression, element)
    - ✓ v0.5.1: `$volt.report(error, context)` API for plugin and app-level reporting
    - v0.6.0: Enhanced console error messages with directive context
    - v0.6.0: Differentiated error levels: warn, error, fatal
    - v0.6.0: Documentation: "Understanding VoltX Errors" guide
    - v0.6.0: Add error handling examples to demo
    - v0.14.0: Visual in-DOM error overlays for development mode
    - v0.14.0: Runtime health monitor tracking failures
    - v0.14.0: Configurable global error policy

### Persistence & Offline

**Goal:** Introduce persistent storage and offline-first behaviors.
**Outcome:** Resilient state persistence and offline replay built into VoltX.js.
**Deliverables:**
    - ✓ Persistent signals (localStorage, sessionStorage, indexedDb)
    - ✓ Storage plugin (`data-volt-persist`)
    - v0.13.0: Storage modifiers on signals (`.local`, `.session`, `.ifmissing`)
    - v0.13.0: Sync strategy API (merge, overwrite, patch) for conflict resolution
    - v0.13.0: Cache invalidation strategies
    - v0.13.0: Offline queue for deferred stream events and HTTP requests
    - v0.13.0: Service Worker integration for offline-first apps
    - v0.13.0: Background sync for deferred requests
    - v0.13.0: Cross-tab synchronization via `BroadcastChannel`

### Bundle Size Optimization

**Goal:** Reduce bundle size to <15KB gzipped while maintaining full feature set.
**Outcome:** Lightweight runtime footprint with comprehensive declarative capabilities.
**Deliverables:**
    - v0.7.0: Audit and tree-shake unused code paths
    - v0.7.0: Optimize evaluator and binder implementations
    - v0.7.0: Minimize plugin footprint, ensure lazy loading
    - v0.7.0: Refactor expression compiler for smaller output
    - v0.7.0: Compress constant strings and reduce runtime helpers
    - v0.7.0: Optimize signal subscription management
    - v0.7.0: Production mode stripping (remove dev-only error messages)
    - v0.7.0: Aggressive minification pipeline tuning
    - v0.7.0: Target: <15KB gzipped sustained

### CSP Compatibility

**Goal:** Make VoltX.js Content Security Policy compliant without 'unsafe-eval'.
**Outcome:** VoltX.js can run in strict CSP environments (no Function constructor).
**Deliverables:**
    - v0.8.0: Research and design CSP-safe evaluator architecture
    - v0.8.0: Evaluate trade-offs: AST interpreter vs limited expression subset
    - v0.8.0: Implement CSP-safe expression evaluator (AST-based or restricted syntax)
    - v0.8.0: Maintain expression feature parity where possible
    - v0.8.0: Fallback mode detection for environments requiring CSP
    - v0.8.0: Full test coverage for CSP mode
    - v0.8.0: Documentation on CSP limitations and alternatives
    - v0.8.0: Bundle split: standard build vs CSP build

### DOM Morphing & Streaming

**Goal:** Add intelligent DOM morphing and Server-Sent Events for real-time updates.
**Outcome:** Built-in morphing and SSE streaming for seamless server-driven UI updates.
**Deliverables:**
    - v0.9.0: Integrate Idiomorph or implement lightweight morphing algorithm
    - v0.9.0: `data-volt-morph` attribute for morphing-based swaps
    - v0.9.0: Preserve focus, scroll, and input state during morphs
    - v0.9.0: Server-Sent Events (SSE) integration
    - v0.9.0: `data-volt-stream` attribute for SSE endpoints
    - v0.9.0: Automatic reconnection with exponential backoff
    - v0.9.0: Signal patching from backend SSE events
    - v0.9.0: JSON Patch support for partial updates
    - v0.9.0: `data-volt-ignore-morph` for selective exclusion
    - v0.9.0: WebSocket as alternative to SSE
    - v0.9.0: Unified streaming API across SSE/WebSocket

### Scope Inheritance & State Management

**Goal:** Improve data scoping with optional inheritance for ergonomic nested components.
**Outcome:** Flexible scoping patterns for complex component hierarchies.
**Deliverables:**
    - v0.10.0: Optional scope inheritance via `data-volt-scope="inherit"`
    - v0.10.0: Child scopes inherit parent signals with override capability
    - v0.10.0: $parent accessor for explicit parent scope access
    - v0.10.0: Scoped context providers for dependency injection
    - v0.10.0: Enhanced $store with namespacing and modules
    - v0.10.0: Cross-scope signal sharing patterns

### Background Requests & Reactive Polling

**Goal:** Enable declarative background data fetching and periodic updates.
**Outcome:** VoltX.js elements can fetch or refresh data automatically based on time, visibility, or reactive conditions.
**Deliverables:**
    - v0.11.0: `data-volt-visible` for fetching when element enters viewport (IntersectionObserver)
    - v0.11.0: `data-volt-poll` attribute for periodic background requests
    - v0.11.0: Configurable intervals, delays, and signal-based triggers
    - v0.11.0: Automatic cancellation when elements unmount
    - v0.11.0: Conditional polling tied to reactive signals
    - v0.11.0: Background task scheduler with priority management

### Attribute Prefix Support

**Goal:** Support multiple attribute prefix options for developer preference.
**Outcome:** VoltX.js supports `voltx-`, `vx-`, and `data-volt-` prefixes.
**Deliverables:**
    - v0.12.0: Add support for `voltx-*` and `vx-*` attribute prefixes
    - v0.12.0: Recommend `vx-*` as primary in documentation
    - v0.12.0: Maintain backward compatibility with `data-volt-*`
    - v0.12.0: Update demo to use recommended prefix

### Inspector & Developer Tools

**Goal:** Improve developer experience and runtime introspection.
**Outcome:** First-class developer ergonomics; VoltX.js is enjoyable to debug and extend.
**Deliverables:**
    - v0.14.0: Visual in-DOM error overlays for development mode
    - v0.14.0: Runtime health monitor tracking failures
    - v0.14.0: Configurable global error policy (silent, overlay, throw)
    - v0.14.0: Developer overlay for inspecting signals, subscriptions, and effects
    - v0.14.0: Time-travel debugging for signal history
    - v0.14.0: Signal dependency graph visualization
    - v0.14.0: Performance profiling tools
    - v0.14.0: Browser console integration (`window.$volt.inspect()`)
    - v0.14.0: Dev logging toggle (`Volt.debug = true`)
    - v0.14.0: Request/response debugging (HTTP actions, SSE streams)
    - v0.14.0: Browser DevTools extension with full integration

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

## Parking Lot

### Evaluator & Binder Hardening

All expression evaluation now flows through a cached `new Function` compiler guarded by a hardened scope proxy, with the binder slimmed into a directive registry so plugins self-register while tests verify the sandboxed error surfaces.
