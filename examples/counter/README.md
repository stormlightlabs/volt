# Counter

Simple interactive counter demonstrating Volt.js reactive primitives.

## Features

- Signal-based state with `count` tracking the current value
- Computed values deriving `doubled` and `squared` from count
- Conditional rendering showing status (Positive/Negative/Zero)
- Dynamic class binding for visual feedback

## Running

1. Build the project: `pnpm build` from root
2. Open `index.html` in a browser

## Implementation

The counter uses three Volt.js primitives:

**Signals** store reactive state:

```js
const count = signal(0);
```

**Computed** derive values automatically:

```js
const doubled = computed(() => count.get() * 2, [count]);
const isPositive = computed(() => count.get() > 0, [count]);
```

**Bindings** connect state to DOM:

```html
<span data-x-text="count">0</span>
<button data-x-on-click="increment">+</button>
<div data-x-if="isPositive">Positive</div>
<div data-x-class="countClass"></div>
```

When `count` changes, all dependent computed values recalculate and bindings update automatically.
