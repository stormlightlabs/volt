# Volt.js

## Philosophy/Goals

- Behavior is declared via `data-x-*` attributes.
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

| Concept  | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| Signals  | Reactive primitives that automatically update DOM bindings when changed.                 |
| Bindings | `data-x-text`, `data-x-html`, `data-x-class` connect attributes or text to expressions.  |
| Actions  | `data-x-on-click`, `data-x-on-input`, etc. attach event handlers declaratively.          |
| Streams  | `data-x-stream="/events"` listens for SSE or WebSocket updates and applies JSON patches. |
| Plugins  | Modular extensions (`data-x-persist`, `data-x-animate`, etc.) that enhance the core.     |

## Project Structure

```sh
volt/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── src/
│   ├── index.ts          # entry point
│   ├── core/
│   │   ├── signal.ts     # reactive primitives
│   │   ├── dom.ts        # DOM helpers
│   │   ├── patch.ts      # JSON patch engine
│   │   ├── stream.ts     # SSE / WebSocket layer
│   │   ├── plugin.ts     # plugin registration API
│   │   └── binder.ts     # mounts and binds data-x-* attributes
│   └── plugins/
│       ├── persist.ts
│       ├── scroll.ts
│       ├── animate.ts
│       └── url.ts
└── test/
    ├── setupTests.ts
    ├── core/
    │   ├── signal.test.ts
    │   ├── dom.test.ts
    │   └── patch.test.ts
    └── integration/
        ├── mount.test.ts
        └── plugin.persist.test.ts
```

## License

MIT License © 2025 Stormlight Labs
