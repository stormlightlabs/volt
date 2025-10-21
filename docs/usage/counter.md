# Counter (Example)

This tutorial walks through building a simple counter application to demonstrate VoltX.js fundamentals: reactive state, event handling, computed values, and declarative markup.

## Basic Counter (Declarative)

The simplest way to build a counter is using declarative state and bindings directly in HTML.

Create an HTML file with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter - VoltX.js</title>
</head>
<body>
  <div data-volt data-volt-state='{"count": 0}'>
    <h1 data-volt-text="count">0</h1>
    <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
  </div>

  <script type="module">
    import { charge } from 'https://unpkg.com/voltx.js@latest/dist/volt.js';
    charge();
  </script>
</body>
</html>
```

**How it works:**

The `data-volt` attribute marks the root element for mounting. Inside, `data-volt-state` declares initial state as inline JSON.
The framework converts `count` into a reactive signal automatically.

The `data-volt-text` binding displays the current count value. When the signal changes, the text content updates automatically.

The `data-volt-on-click` binding attaches a click handler that increments the count. We call `count.get()` to read the current value and `count.set()` to update it.

Finally, `charge()` discovers all `[data-volt]` elements and mounts them with their declared state.

## Adding Decrement

Extend the counter with both increment and decrement buttons:

```html
<div data-volt data-volt-state='{"count": 0}'>
  <h1 data-volt-text="count">0</h1>
  <button data-volt-on-click="count.set(count.get() - 1)">-</button>
  <button data-volt-on-click="count.set(count.get() + 1)">+</button>
</div>
```

Each button calls `count.set()` with a different expression. The decrement button subtracts 1, while increment adds 1.

## Computed Values

Add derived state using `data-volt-computed` to show whether the count is positive, negative, or zero:

```html
<div data-volt
     data-volt-state='{"count": 0}'
     data-volt-computed:status="count > 0 ? 'positive' : count < 0 ? 'negative' : 'zero'">
  <h1 data-volt-text="count">0</h1>
  <p>Status: <span data-volt-text="status">zero</span></p>

  <button data-volt-on-click="count.set(count.get() - 1)">-</button>
  <button data-volt-on-click="count.set(count.get() + 1)">+</button>
</div>
```

The `data-volt-computed:status` attribute creates a computed signal named `status`. It uses a ternary expression to classify the count. When `count` changes, `status` recalculates automatically.

## Conditional Rendering

Show different messages based on the count value using conditional bindings:

```html
<div data-volt data-volt-state='{"count": 0}'>
  <h1 data-volt-text="count">0</h1>

  <p data-volt-if="count === 0">The count is zero</p>
  <p data-volt-if="count > 0" data-volt-text="'Positive: ' + count"></p>
  <p data-volt-if="count < 0" data-volt-text="'Negative: ' + count"></p>

  <button data-volt-on-click="count.set(count.get() - 1)">-</button>
  <button data-volt-on-click="count.set(count.get() + 1)">+</button>
  <button data-volt-on-click="count.set(0)">Reset</button>
</div>
```

The `data-volt-if` binding conditionally renders elements. Only one paragraph displays at a time based on the count value. A reset button sets the count back to zero.

## Styling with Classes

Apply dynamic CSS classes based on state:

```html
<style>
  .counter {
    padding: 2rem;
    text-align: center;
    font-family: system-ui, sans-serif;
  }

  .display {
    font-size: 4rem;
    margin: 1rem 0;
  }

  .positive { color: #22c55e; }
  .negative { color: #ef4444; }
  .zero { color: #6b7280; }

  button {
    font-size: 1.5rem;
    padding: 0.5rem 1.5rem;
    margin: 0.25rem;
    cursor: pointer;
  }
</style>
```

```html
<div class="counter"
      data-volt
      data-volt-state='{"count": 0}'>
  <h1 class="display"
      data-volt-text="count"
      data-volt-class="{ positive: count > 0, negative: count < 0, zero: count === 0 }">
    0
  </h1>

  <div>
    <button data-volt-on-click="count.set(count.get() - 1)">-</button>
    <button data-volt-on-click="count.set(0)">Reset</button>
    <button data-volt-on-click="count.set(count.get() + 1)">+</button>
  </div>
</div>
```

The `data-volt-class` binding takes an object where keys are class names and values are conditions. When `count` is positive, the `positive` class applies. When negative, the `negative` class applies. When zero, the `zero` class applies.

## Persisting State

Use the persist plugin to save the count across page reloads:

```html
<div data-volt
      data-volt-state='{"count": 0}'
      data-volt-persist:count="localStorage">
  <h1 data-volt-text="count">0</h1>

  <button data-volt-on-click="count.set(count.get() - 1)">-</button>
  <button data-volt-on-click="count.set(0)">Reset</button>
  <button data-volt-on-click="count.set(count.get() + 1)">+</button>
</div>

<script type="module">
  import { charge, registerPlugin, persistPlugin } from 'https://unpkg.com/voltx.js@latest/dist/volt.js';

  registerPlugin('persist', persistPlugin);
  charge();
</script>
```

The `data-volt-persist:count="localStorage"` binding synchronizes the `count` signal with browser localStorage. When the count changes, it's saved automatically. When the page loads, the saved value is restored.

## Step Counter

Build a counter that increments by a configurable step value:

```html
<div data-volt data-volt-state='{"count": 0, "step": 1}'>
  <h1 data-volt-text="count">0</h1>

  <label>
    Step:
    <input type="number" data-volt-model="step" min="1" value="1">
  </label>

  <div>
    <button data-volt-on-click="count.set(count.get() - step)">-</button>
    <button data-volt-on-click="count.set(0)">Reset</button>
    <button data-volt-on-click="count.set(count.get() + step)">+</button>
  </div>
</div>
```

The `data-volt-model` binding creates two-way synchronization between the input and the `step` signal. As you type, the step value updates. The increment and decrement buttons use the current step value.

## Bounded Counter

Add minimum and maximum bounds with disabled button states:

```html
<div data-volt
     data-volt-state='{"count": 0, "min": -10, "max": 10}'>
  <h1 data-volt-text="count">0</h1>

  <div>
    <button
      data-volt-on-click="count.set(count.get() - 1)"
      data-volt-bind:disabled="count <= min">
      -
    </button>
    <button data-volt-on-click="count.set(0)">Reset</button>
    <button
      data-volt-on-click="count.set(count.get() + 1)"
      data-volt-bind:disabled="count >= max">
      +
    </button>
  </div>

  <p>Range: <span data-volt-text="min"></span> to <span data-volt-text="max"></span></p>
</div>
```

The `data-volt-bind:disabled` binding disables buttons when the count reaches the minimum or maximum. The decrement button disables at the minimum, and the increment button disables at the maximum.

## Programmatic Counter

For applications requiring initialization logic or custom functions, use the programmatic API:

```html
<script type="module">
  import { mount, signal, computed } from 'https://unpkg.com/voltx.js@latest/dist/volt.js';

  const count = signal(0);
  const message = computed(() => {
    const value = count.get();
    if (value === 0) return 'Start counting!';
    if (value > 0) return `Up by ${value}`;
    return `Down by ${Math.abs(value)}`;
  }, [count]);

  const increment = () => {
    count.set(count.get() + 1);
  };

  const decrement = () => {
    count.set(count.get() - 1);
  };

  const reset = () => {
    count.set(0);
  };

  mount(document.querySelector('#app'), {
    count,
    message,
    increment,
    decrement,
    reset
  });
</script>
```

This approach creates signals explicitly using `signal()` and `computed()`. Functions are defined for event handlers and passed to the scope object. The `mount()` function attaches bindings to the element.

Use programmatic mounting when you need:

- Complex initialization logic
- Integration with external libraries
- Signals shared across multiple components
- Custom validation or transformation

## Summary

This counter demonstrates core VoltX.js concepts:

- Reactive state with signals
- Event handling with `data-volt-on-*`
- Computed values deriving from state
- Conditional rendering with `data-volt-if`
- Two-way form binding with `data-volt-model`
- Attribute binding with `data-volt-bind:*`
- Dynamic classes with `data-volt-class`
- State persistence with plugins

## Further Reading

- [State Management](../state) for advanced signal patterns
- [Bindings](../bindings) for complete binding reference
- [Expressions](../expressions) for template syntax details
- [Lifecycle](../lifecycle) for SSR and hydration
