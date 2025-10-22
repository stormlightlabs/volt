# Global State

VoltX provides built-in global state management through special variables and a globally available store.
These features enable sharing state across components, accessing metadata, and coordinating behavior without external dependencies.

## Overview

Every Volt scope automatically receives special variables (prefixed with `$`) that provide access to:

- **Global Store** - Shared reactive state across all scopes
- **Scope Metadata** - Information about the current reactive context
- **Element References** - Access to pinned DOM elements
- **Utility Functions** - Helper functions for common tasks

## Special Variables

### `$store`

Access globally shared reactive state across all Volt roots.

**Declarative API:**

```html
<!-- Define global store -->
<script type="application/json" data-volt-store>
{
  "theme": "dark",
  "user": { "name": "Alice" }
}
</script>

<!-- Use in any Volt root -->
<div data-volt>
  <p data-volt-text="$store.get('theme')"></p>
  <button data-volt-on-click="$store.set('theme', 'light')">Toggle</button>
</div>
```

**Programmatic API:**

```typescript
import { registerStore, getStore } from 'voltx.js';

// Register store with signals or raw values
registerStore({
  theme: signal('dark'),
  count: 0  // Auto-wrapped in signal
});

// Access store
const store = getStore();
store.set('count', 5);
console.log(store.get('count'));  // 5
```

**Methods:**

- `$store.get(key)` - Get signal value
- `$store.set(key, value)` - Update signal value
- `$store.has(key)` - Check if key exists
- `$store[key]` - Direct signal access (auto-unwrapped in read contexts)

**Note on Signal Unwrapping:**

When accessing store values via `$store[key]` in read contexts (like `data-volt-text` or `data-volt-if`), the signal is automatically unwrapped. In event handlers, use `.get()` and `.set()` methods for explicit control:

```html
<!-- Read context: signal auto-unwrapped -->
<p data-volt-if="$store.theme === 'dark'">Dark mode active</p>

<!-- Event handler: use methods -->
<button data-volt-on-click="$store.theme.set('light')">Switch to Light</button>

<!-- Or use the store's convenience methods -->
<button data-volt-on-click="$store.set('theme', 'light')">Switch to Light</button>
```

### `$origin`

Reference to the root element of the current reactive scope.

```html
<div data-volt id="app-root">
  <p data-volt-text="'Root ID: ' + $origin.id"></p>
  <!-- Displays: "Root ID: app-root" -->
</div>
```

### `$scope`

Direct access to the raw scope object containing all signals and context.

```html
<div data-volt data-volt-state='{"count": 0}'>
  <p data-volt-text="Object.keys($scope).length"></p>
  <!-- Shows number of scope properties -->
</div>
```

### `$pins`

Access DOM elements registered with `data-volt-pin`.

```html
<div data-volt>
  <input data-volt-pin="username" />
  <input data-volt-pin="password" type="password" />

  <button data-volt-on-click="$pins.username.focus()">
    Focus Username
  </button>

  <button data-volt-on-click="$pins.password.value = ''">
    Clear Password
  </button>
</div>
```

**Notes:**

- Pins are scoped to their root element
- Each root maintains its own pin registry
- Pins are accessible immediately after registration

### `$pulse(callback)`

Defers callback execution to the next microtask, ensuring DOM updates have completed.

```html
<div data-volt data-volt-state='{"count": 0}'>
  <button data-volt-on-click="count.set(count.get() + 1); $pulse(() => console.log('Updated!'))">
    Increment
  </button>
</div>
```

**Use Cases:**

- Run code after DOM updates
- Coordinate async operations
- Batch multiple updates

### `$uid(prefix?)`

Generates unique, deterministic IDs within the scope.

```html
<div data-volt>
  <input data-volt-bind:id="$uid('field')" />
  <!-- id="volt-field-1" -->

  <input data-volt-bind:id="$uid('field')" />
  <!-- id="volt-field-2" -->

  <input data-volt-bind:id="$uid()" />
  <!-- id="volt-3" -->
</div>
```

**Notes:**

- IDs are unique within the scope
- Counter increments on each call
- Different scopes have independent counters

### `$arc(eventName, detail?)`

Dispatches a CustomEvent from the current element.

```html
<div data-volt data-volt-on-user:save="console.log('Saved:', $event.detail)">
  <button data-volt-on-click="$arc('user:save', { id: 123, name: 'Alice' })">
    Save User
  </button>
</div>
```

**Event Properties:**

- `bubbles: true` - Event bubbles up the DOM
- `composed: true` - Crosses shadow DOM boundaries
- `cancelable: true` - Can be prevented
- `detail` - Custom data payload

### `$probe(expression, callback)`

Observes a reactive expression and calls a callback when dependencies change.

```html
<div data-volt data-volt-state='{"count": 0}' data-volt-init="$probe('count', v => console.log('Count:', v))">
  <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
  <!-- Logs: "Count: 0" immediately, then "Count: 1", "Count: 2", etc. -->
</div>
```

**Parameters:**

- `expression` (string) - Reactive expression to observe
- `callback` (function) - Called with expression value on changes

**Returns:**

- Cleanup function to stop observing

**Example:**

```html
<div data-volt
     data-volt-state='{"x": 0, "y": 0}'
     data-volt-init="const cleanup = $probe('x + y', sum => console.log('Sum:', sum))">

  <button data-volt-on-click="x.set(x.get() + 1)">+X</button>
  <button data-volt-on-click="y.set(y.get() + 1)">+Y</button>

  <!-- Logs: "Sum: 0" initially, then on every change -->
</div>
```

## `data-volt-init`

Run initialization code once when an element is mounted.

**Basic Usage:**

```html
<div data-volt
     data-volt-state='{"initialized": false}'
     data-volt-init="initialized.set(true)">
  <p data-volt-text="initialized"></p>
  <!-- Displays: true -->
</div>
```

**Setting Up Observers:**

```html
<div data-volt
     data-volt-state='{"count": 0, "log": []}'
     data-volt-init="$probe('count', v => log.push(v))">
  <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
  <p data-volt-text="log.join(', ')"></p>
  <!-- Displays: "0, 1, 2, ..." -->
</div>
```

**Accessing Special Variables:**

```html
<div data-volt
     id="main"
     data-volt-state='{"rootId": ""}'
     data-volt-init="rootId.set($origin.id)">
  <p data-volt-text="rootId"></p>
  <!-- Displays: "main" -->
</div>
```

## Global Store Patterns

### Shared Application State

```html
<!-- Define global state once -->
<script type="application/json" data-volt-store>
{
  "theme": "light",
  "user": null,
  "authenticated": false
}
</script>

<!-- Header component -->
<div data-volt>
  <div data-volt-class="$store.get('theme')">
    <button data-volt-on-click="$store.set('theme', $store.get('theme') === 'light' ? 'dark' : 'light')">
      Toggle Theme
    </button>
  </div>
</div>

<!-- User profile -->
<div data-volt>
  <div data-volt-if="$store.get('authenticated')">
    <p data-volt-text="'Welcome, ' + $store.get('user').name"></p>
  </div>
</div>
```

### Cross-Component Communication

```html
<script type="application/json" data-volt-store>
{
  "selectedId": null,
  "items": []
}
</script>

<!-- Item list -->
<div data-volt>
  <div data-volt-for="item in $store.get('items')">
    <button data-volt-on-click="$store.set('selectedId', item.id)" data-volt-text="item.name"></button>
  </div>
</div>

<!-- Item details -->
<div data-volt>
  <div data-volt-if="$store.get('selectedId')">
    <p data-volt-text="'Selected: ' + $store.get('selectedId')"></p>
  </div>
</div>
```

### Persistent Global State

```typescript
import { registerStore, getStore } from 'voltx.js';
import { registerPlugin, persistPlugin } from 'voltx.js';

// Register persist plugin
registerPlugin('persist', persistPlugin);

// Initialize store with persisted values
const saved = localStorage.getItem('app-store');
const initialState = saved ? JSON.parse(saved) : { theme: 'light', user: null };

registerStore(initialState);

// Save on changes
const store = getStore();
const originalSet = store.set.bind(store);
store.set = (key, value) => {
  originalSet(key, value);
  localStorage.setItem('app-store', JSON.stringify({
    theme: store.get('theme'),
    user: store.get('user')
  }));
};
```

## Best Practices

### Use `$store` for Shared State

Global state should live in `$store`:

```html
<!-- Good: Shared theme in store -->
<script type="application/json" data-volt-store>
{ "theme": "dark" }
</script>

<div data-volt>
  <p data-volt-class="$store.get('theme')">Content</p>
</div>
```

### Use `$pins` for Element Access

Access DOM elements through pins instead of `querySelector`:

```html
<!-- Good: Using pins -->
<div data-volt>
  <input data-volt-pin="username" />
  <button data-volt-on-click="$pins.username.focus()">Focus</button>
</div>

<!-- Avoid: Manual querySelector -->
<div data-volt>
  <input id="username" />
  <button data-volt-on-click="document.querySelector('#username').focus()">Focus</button>
</div>
```

### Use `data-volt-init` for Setup

Initialize observers and one-time setup in `data-volt-init`:

```html
<div data-volt
     data-volt-state='{"count": 0}'
     data-volt-init="$probe('count', v => console.log('Count:', v))">

  <!-- Component content -->
</div>
```

### Scope Pin Names Appropriately

Use descriptive pin names and avoid collisions:

```html
<!-- Good: Descriptive names -->
<div data-volt>
  <input data-volt-pin="searchInput" />
  <input data-volt-pin="filterInput" />
</div>

<!-- Avoid: Generic names that might collide -->
<div data-volt>
  <input data-volt-pin="input" />
  <input data-volt-pin="input2" />
</div>
```

### Clean Up Observers

Always clean up `$probe` observers when no longer needed:

```html
<div data-volt
     data-volt-state='{"active": true}'
     data-volt-init="const cleanup = $probe('active', v => console.log(v))">

  <button data-volt-on-click="active.set(false); cleanup()">Deactivate</button>
</div>
```

## Examples

### Todo App with Global State

```html
<script type="application/json" data-volt-store>
{
  "todos": [],
  "filter": "all"
}
</script>

<!-- Add todo form -->
<div data-volt data-volt-state='{"newTodo": ""}'>
  <input data-volt-model="newTodo" data-volt-pin="todoInput" />
  <button data-volt-on-click="$store.set('todos', [...$store.get('todos'), { text: newTodo.get(), done: false }]); newTodo.set(''); $pins.todoInput.focus()">
    Add
  </button>
</div>

<!-- Filter buttons -->
<div data-volt>
  <button data-volt-on-click="$store.set('filter', 'all')">All</button>
  <button data-volt-on-click="$store.set('filter', 'active')">Active</button>
  <button data-volt-on-click="$store.set('filter', 'done')">Done</button>
</div>

<!-- Todo list -->
<div data-volt>
  <div data-volt-for="todo in $store.get('todos')">
    <div data-volt-if="$store.get('filter') === 'all' || ($store.get('filter') === 'done' && todo.done) || ($store.get('filter') === 'active' && !todo.done)">
      <input type="checkbox" data-volt-bind:checked="todo.done" />
      <span data-volt-text="todo.text"></span>
    </div>
  </div>
</div>
```

### Multi-Step Form

```html
<script type="application/json" data-volt-store>
{
  "step": 1,
  "formData": { "name": "", "email": "", "phone": "" }
}
</script>

<div data-volt>
  <!-- Step indicator -->
  <p data-volt-text="'Step ' + $store.get('step') + ' of 3'"></p>

  <!-- Step 1: Name -->
  <div data-volt-if="$store.get('step') === 1">
    <input data-volt-model="$store.get('formData').name" placeholder="Name" />
    <button data-volt-on-click="$store.set('step', 2)">Next</button>
  </div>

  <!-- Step 2: Email -->
  <div data-volt-if="$store.get('step') === 2">
    <input data-volt-model="$store.get('formData').email" placeholder="Email" />
    <button data-volt-on-click="$store.set('step', 1)">Back</button>
    <button data-volt-on-click="$store.set('step', 3)">Next</button>
  </div>

  <!-- Step 3: Phone -->
  <div data-volt-if="$store.get('step') === 3">
    <input data-volt-model="$store.get('formData').phone" placeholder="Phone" />
    <button data-volt-on-click="$store.set('step', 2)">Back</button>
    <button data-volt-on-click="console.log('Submit:', $store.get('formData'))">Submit</button>
  </div>
</div>
```

## API Reference

### `registerStore(state)`

Register global store state programmatically.

```typescript
import { registerStore } from 'voltx.js';
import { signal } from 'voltx.js';

registerStore({
  theme: signal('dark'),  // Existing signal
  count: 0               // Auto-wrapped
});
```

### `getStore()`

Get the global store instance.

```typescript
import { getStore } from 'voltx.js';

const store = getStore();
store.set('theme', 'light');
console.log(store.get('theme'));  // 'light'
console.log(store.has('theme'));  // true
```

### `getScopeMetadata(scope)`

Get metadata for a scope (advanced use).

```typescript
import { getScopeMetadata } from 'voltx.js';

const metadata = getScopeMetadata(scope);
console.log(metadata.origin);      // Root element
console.log(metadata.pins);        // Pin registry
console.log(metadata.uidCounter);  // Current UID counter
```
