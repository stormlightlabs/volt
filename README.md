# Volt.js

## Philosophy/Goals

- Behavior is declared via `data-volt-*` attributes.
    - HTML drives the UI, not components.
- Core under **20 KB gzipped**, zero dependencies.
- Signals update the DOM directly without a virtual DOM.
    - Native Server-Sent Events (SSE) and WebSocket patch updates.
    - No reactivity scheduler, no VDOM diffing.
- Extend behavior declaratively (persist, scroll, animate, etc.).
- Progressive enhancement, i.e. works with static HTML out of the box.

### Values

- Never exceed 15 KB for the core runtime.
- No custom build systems — work with any backend.
- All source in TypeScript, no magical DSLs.
- Every feature ships with a test harness.

## Concepts

| Concept  | Description                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------- |
| Signals  | Reactive primitives that automatically update DOM bindings when changed.                          |
| Bindings | `data-volt-text`, `data-volt-html`, `data-volt-class` connect attributes or text to expressions.  |
| Actions  | `data-volt-on-click`, `data-volt-on-input`, etc. attach event handlers declaratively.             |
| Streams  | `data-volt-stream="/events"` listens for SSE or WebSocket updates and applies JSON patches.       |
| Plugins  | Modular extensions (`data-volt-persist`, `data-volt-animate`, etc.) that enhance the core.        |

## Project Structure

```sh
volt/
├── dev/
├── docs/
├── examples/
├── lib
│   ├── index.html
│   ├── public
│   ├── src
│   │   ├── core
│   │   │   ├── asyncEffect.ts
│   │   │   ├── binder.ts
│   │   │   ├── charge.ts
│   │   │   ├── dom.ts
│   │   │   ├── evaluator.ts
│   │   │   ├── http.ts
│   │   │   ├── lifecycle.ts
│   │   │   ├── plugin.ts
│   │   │   ├── reactive.ts
│   │   │   ├── shared.ts
│   │   │   ├── signal.ts
│   │   │   ├── ssr.ts
│   │   │   └── tracker.ts
│   │   ├── debug
│   │   │   ├── graph.ts
│   │   │   ├── logger.ts
│   │   │   └── registry.ts
│   │   ├── debug.ts
│   │   ├── demo/
│   │   ├── index.ts
│   │   ├── main.ts
│   │   ├── plugins
│   │   │   ├── persist.ts
│   │   │   ├── scroll.ts
│   │   │   └── url.ts
│   │   ├── styles
│   │   │   ├── index.css
│   │   │   ├── variables.css
│   │   │   ├── typography.css
│   │   │   ├── forms.css
│   │   │   ├── components.css
│   │   │   ├── collections.css
│   │   │   ├── media.css
│   │   │   └── base.css
│   │   └── types
│   │       ├── helpers.ts
│   │       └── volt.d.ts
│   └──  test/
└── README.md

```

## License

MIT License © 2025 Stormlight Labs
