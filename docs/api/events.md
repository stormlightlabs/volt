---
version: 1.0
updated: 2025-10-18
---

# Event Handling

Volt.js provides declarative event handling through `data-volt-on-*` attributes with automatic access to special scoped references.

## Event Binding Syntax

Event handlers are attached using the `data-volt-on-{eventName}` attribute

The attribute value can be:

- A function reference from the scope: `handleClick`
- An inline expression: `count.set(count.get() + 1)`
- A method call: `myObject.method()`

## Scoped References

Event handlers have access to two special scoped references that are automatically injected:

### `$el` - The Target Element

The `$el` reference provides access to the DOM element that the event handler is bound to.

**Type:** [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element)

### `$event` - The Event Object

The `$event` reference provides access to the native browser event object.

**Type:** [`Event`](https://developer.mozilla.org/en-US/docs/Web/API/Event) (or specific event type like `MouseEvent`, `KeyboardEvent`, etc.)

## Event Types

Volt.js aims to support all standard DOM events through `data-volt-on-*`:

**Mouse Events:**

- `click`, `dblclick`
- `mousedown`, `mouseup`
- `mouseover`, `mouseout`, `mouseenter`, `mouseleave`
- `mousemove`

**Keyboard Events:**

- `keydown`, `keyup`, `keypress`

**Form Events:**

- `submit`, `reset`
- `input`, `change`
- `focus`, `blur`

**Touch Events:**

- `touchstart`, `touchend`, `touchmove`, `touchcancel`

**Other Events:**

- `scroll`, `resize`
- `load`, `error`
- Any custom events

## Implementation Details

When an event handler is bound, Volt.js:

1. Creates a new scope that extends the component scope
2. Injects `$el` (the bound element) and `$event` (the event object) into this scope
3. Evaluates the expression in this enhanced scope
4. If the expression returns a function, calls it with the event

The event listener is automatically cleaned up when the element is unmounted.
