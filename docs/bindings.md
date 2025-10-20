# VoltX Bindings

Bindings connect reactive state to the DOM using `data-volt-*` attributes. Each binding evaluates expressions and updates the DOM when dependencies change.

All bindings support the full expression syntax documented in [Expression Evaluation](./expressions), including property access, operators, function calls, and signal unwrapping.

## Content

### Text Content

The `data-volt-text` binding updates an element's text content:

```html
<p data-volt-text="message">Fallback text</p>
```

Text content is automatically escaped for security. Use this binding for any user-generated content to prevent XSS attacks.

The fallback text (between the opening and closing tags) is displayed until the framework mounts and evaluates the expression.

### HTML Content

The `data-volt-html` binding updates an element's innerHTML:

```html
<div data-volt-html="richContent"></div>
```

This binding renders raw HTML without escaping. Only use it with trusted content. Never use `data-volt-html` with user-generated content unless it has been sanitized.

The binding removes existing children before inserting new content. Event listeners on removed elements are not automatically cleaned up—prefer using `data-volt-if` for conditional content with event handlers.

## Attributes

### Generic Attributes

The `data-volt-bind:*` syntax binds any HTML attribute:

```html
<img data-volt-bind:src="imageUrl" data-volt-bind:alt="imageAlt">
<a data-volt-bind:href="linkUrl" data-volt-bind:target="linkTarget">Link</a>
<input data-volt-bind:disabled="isDisabled" data-volt-bind:placeholder="placeholderText">
```

The attribute name follows the colon. The expression value is converted to a string and set as the attribute value.

For boolean attributes (`disabled`, `checked`, `required`, etc.), the attribute is added when the expression is truthy and removed when falsy.

### Class Binding

The `data-volt-class` binding toggles CSS classes based on an object expression:

```html
<div data-volt-class="{ active: isActive, disabled: !canInteract, 'has-error': hasError }">
```

Each key in the object is a class name. When the corresponding value is truthy, the class is added; when falsy, the class is removed.

Class names with hyphens or spaces must be quoted. The binding preserves existing classes not managed by VoltX.js.

## Event Bindings

### Event Listeners

The `data-volt-on-*` syntax attaches event listeners where the wildcard is the event name:

```html
<button data-volt-on-click="handleClick">Click me</button>
<input data-volt-on-input="query.set($event.target.value)">
<form data-volt-on-submit="handleSubmit($event)">
```

Event handlers receive two special scope variables:

- `$event`: The native browser event object
- `$el`: The element that has the binding

Event expressions commonly call functions or set signal values. The event's default behavior can be prevented by calling `$event.preventDefault()` in the expression.

### Supported Events

Any valid DOM event name works:

- Mouse: `click`, `dblclick`, `mousedown`, `mouseup`, `mouseenter`, `mouseleave`, `mousemove`
- Keyboard: `keydown`, `keyup`, `keypress`
- Form: `input`, `change`, `submit`, `focus`, `blur`
- Touch: `touchstart`, `touchmove`, `touchend`
- Drag: `dragstart`, `dragover`, `drop`
- Media: `play`, `pause`, `ended`, `timeupdate`

Event names are case-insensitive in HTML but case-sensitive in XHTML. Use lowercase for consistency.

## Form Bindings

### Two-Way Binding

The `data-volt-model` binding creates two-way synchronization between form inputs and signals:

```html
<input data-volt-model="username">
<textarea data-volt-model="bio"></textarea>
<select data-volt-model="country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>
```

The binding works with text inputs, textareas, select dropdowns, checkboxes, and radio buttons.

For checkboxes, the signal value is a boolean. For radio buttons, all inputs with the same `data-volt-model` should share the same signal, and each input should have a unique `value` attribute.

The binding listens for `input` events and updates the signal with the current value. It also sets the initial value from the signal when mounting.

### Checkbox Arrays

Multiple checkboxes can bind to an array signal:

```html
<input type="checkbox" value="red" data-volt-model="colors">
<input type="checkbox" value="green" data-volt-model="colors">
<input type="checkbox" value="blue" data-volt-model="colors">
```

When checked, the checkbox value is added to the array. When unchecked, it's removed. The signal must be initialized as an array.

## Conditional Rendering

### If/Else

The `data-volt-if` binding conditionally renders elements based on expression truthiness:

```html
<p data-volt-if="isLoggedIn">Welcome back!</p>
<p data-volt-else>Please log in.</p>
```

When the condition is falsy, the element is removed from the DOM entirely. When truthy, it's inserted back.

The `data-volt-else` binding must immediately follow a `data-volt-if` sibling element. It renders when the preceding `if` condition is falsy.

Removed elements and their children are completely disposed, including event listeners and nested bindings. This prevents memory leaks and ensures clean teardown.

### Show/Hide Alternative

For toggling visibility without removing elements from the DOM, use `data-volt-class` with a `hidden` class:

```html
<style>
  .hidden { display: none; }
</style>
<p data-volt-class="{ hidden: !isVisible }">Toggle me</p>
```

This approach is more performant for frequently toggled content since elements remain in the DOM.

## List Rendering

### For Loop

The `data-volt-for` binding repeats elements for each item in an array:

```html
<ul>
  <li data-volt-for="item in items" data-volt-text="item.name"></li>
</ul>
```

The syntax is `item in array` where `item` is the loop variable name and `array` is an expression that resolves to an array.

Each iteration creates a new scope with:

- `item`: The current array element
- `$index`: The zero-based index (number)

The binding tracks array changes and efficiently updates the DOM:

- New items are appended
- Removed items are disposed
- Reordered items are moved

For optimal performance with large lists, ensure array items have stable identities. Mutating the array in place triggers re-renders for affected items only.

### Nested Loops

Loops can be nested to render multidimensional data:

```html
<div data-volt-for="category in categories">
  <h2 data-volt-text="category.name"></h2>
  <ul>
    <li data-volt-for="product in category.products" data-volt-text="product.name"></li>
  </ul>
</div>
```

Each loop creates its own scope. Inner loops can access outer loop variables.

### Index Access

Use the `$index` variable to access the current iteration index:

```html
<ul>
  <li data-volt-for="item in items">
    <span data-volt-text="$index + 1"></span>: <span data-volt-text="item.name"></span>
  </li>
</ul>
```

## HTTP

HTTP bindings enable declarative AJAX requests without writing JavaScript. They integrate with hypermedia patterns for server-rendered HTML fragments.

### HTTP Methods

Each HTTP method has a corresponding binding:

```html
<button data-volt-get="/api/users">Fetch Users</button>
<form data-volt-post="/api/users">...</form>
<button data-volt-put="/api/users/1">Update</button>
<button data-volt-patch="/api/users/1">Patch</button>
<button data-volt-delete="/api/users/1">Delete</button>
```

The binding value is the URL. When the element is activated (clicked for buttons, submitted for forms), the request is sent.

### Target and Swap

Control where and how the response HTML is inserted using `data-volt-target` and `data-volt-swap`:

```html
<button
  data-volt-get="/partials/content"
  data-volt-target="#main"
  data-volt-swap="innerHTML">
  Load Content
</button>
```

**Target** is a CSS selector identifying the element to update. If omitted, the element with the HTTP binding is the target.

**Swap** strategies determine how content is inserted:

- `innerHTML`: Replace target's content (default)
- `outerHTML`: Replace target itself
- `beforebegin`: Insert before target
- `afterbegin`: Insert as target's first child
- `beforeend`: Insert as target's last child
- `afterend`: Insert after target
- `delete`: Remove target from DOM
- `none`: Make request but don't modify DOM

### Form Serialization

Forms with HTTP bindings automatically serialize input values:

```html
<form data-volt-post="/api/login">
  <input name="username" data-volt-model="username">
  <input name="password" type="password" data-volt-model="password">
  <button type="submit">Login</button>
</form>
```

The framework serializes form data based on the HTTP method:

- GET/DELETE: Query parameters in URL
- POST/PUT/PATCH: Request body as `application/x-www-form-urlencoded` or `multipart/form-data` for file uploads

### Loading Indicators

Show loading states during requests with `data-volt-indicator`:

```html
<button data-volt-get="/api/data" data-volt-indicator="#spinner">
  Load Data
</button>
<div id="spinner" class="hidden">Loading...</div>
```

The indicator element (selected by CSS selector) has a `loading` class added during the request and removed when complete.

### Retry Logic

Enable automatic retry with exponential backoff using `data-volt-retry`:

```html
<button
  data-volt-get="/api/unreliable"
  data-volt-retry="3">
  Fetch with Retry
</button>
```

The binding value is the maximum number of retry attempts. The framework automatically retries failed requests with increasing delays (1s, 2s, 4s, etc.).

Retries only occur for network failures and 5xx server errors. Client errors (4xx) are not retried.

## Plugins

Plugins extend the framework with additional bindings. Register plugins before mounting to make their bindings available.

### Persist

The `data-volt-persist` binding synchronizes signals with browser storage:

```html
<div
  data-volt
  data-volt-state='{"theme": "light"}'
  data-volt-persist:theme="localStorage">
</div>
```

The binding syntax is `data-volt-persist:signalName="storageType"` where storage type is:

- `localStorage`: Persists across browser sessions
- `sessionStorage`: Persists for the current tab session
- `indexedDB`: For large datasets (async)

The signal value is serialized to JSON and stored. On mount, stored values override initial state.

### Scroll

Scroll bindings manage scroll position and behavior:

```html
<!-- Restore scroll position on navigation -->
<div data-volt-scroll-restore></div>

<!-- Scroll to element -->
<button data-volt-scroll-to="#target">Scroll to Target</button>

<!-- Scroll spy (add class when in viewport) -->
<section data-volt-scroll-spy="active"></section>

<!-- Smooth scrolling -->
<div data-volt-scroll-smooth></div>
```

**Scroll restore** saves scroll position before navigation and restores it when returning.

**Scroll to** scrolls the viewport to bring the target element into view when activated.

**Scroll spy** adds a class when the element enters the viewport and removes it when leaving.

**Smooth scrolling** enables CSS `scroll-behavior: smooth` for the element.

### URL Synchronization

The `data-volt-url` binding syncs signals with URL query parameters or hash:

```html
<div
  data-volt
  data-volt-state='{"page": 1, "query": ""}'
  data-volt-url:page="query"
  data-volt-url:query="query">
</div>
```

The binding syntax is `data-volt-url:signalName="urlPart"` where URL part is:

- `query`: Sync with query parameter (e.g., `?page=1`)
- `hash`: Sync with URL hash (e.g., `#section`)

Signal changes update the URL, and URL changes (back/forward navigation) update signals. This enables client-side routing without additional libraries.

## Custom Bindings

Register custom bindings for domain-specific behavior using the plugin API:

```js
import { registerPlugin } from 'voltx.js';
// or: import { registerPlugin } from '@voltx/core';

registerPlugin('tooltip', (ctx) => {
  const message = ctx.evaluate(ctx.element.getAttribute('data-volt-tooltip'));
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = message;

  ctx.element.addEventListener('mouseenter', () => {
    document.body.appendChild(tooltip);
  });

  ctx.element.addEventListener('mouseleave', () => {
    tooltip.remove();
  });

  ctx.addCleanup(() => tooltip.remove());
});
```

The plugin context provides:

- `element`: The DOM element with the binding
- `scope`: Signal scope for the mounted component
- `evaluate(expression)`: Evaluate expressions in the current scope
- `findSignal(path)`: Find signals by property path
- `addCleanup(fn)`: Register cleanup callbacks

Custom bindings should always register cleanup to prevent memory leaks.

## Lifecycle

All bindings follow a consistent lifecycle:

1. **Mount**: The `charge()` or `mount()` function discovers elements with `data-volt-*` attributes
2. **Evaluation**: Expressions are parsed and evaluated in the current scope
3. **Subscription**: Bindings subscribe to referenced signals
4. **Update**: When signals change, bindings re-evaluate and update the DOM
5. **Cleanup**: When unmounted, subscriptions are disposed and DOM changes are reverted

Cleanup is automatic for all built-in bindings. Custom bindings must explicitly register cleanup using `ctx.addCleanup()`.
