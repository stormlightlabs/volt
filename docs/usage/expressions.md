# Expression Evaluation

VoltX.js evaluates JavaScript-like expressions in HTML templates using a cached `new Function()` compiler wrapped in a hardened scope proxy.
The evaluator compiles each unique expression once, caches the resulting function, and executes it against a sandboxed scope that only exposes explicitly whitelisted globals.

## Supported Syntax

The expression language supports a subset of JavaScript:

- Standard literals (numbers, strings, booleans, null, undefined)
- Arithmetic operators (`+`, `-`, `*`, `/`, `%`)
- Comparison operators (`===`, `!==`, `<`, `>`, `<=`, `>=`)
- Logical operators (`&&`, `||`, `!`)
- Ternary operator (`? :`).

Property access works via dot notation (`user.name`) or bracket notation (`items[0]`).
Method calls are supported on any object, including chaining (`text.trim().toUpperCase()`).
Arrow functions work with single-expression bodies for use in array methods like `filter`, `map`, and `reduce`.

Array and object literals can be created inline, with spread operator support (`...`) for both arrays and objects.
Signals are automatically unwrapped when referenced in expressions.

## Security Model

The evaluator wraps each scope in an `Object.create(null)` proxy that filters dangerous identifiers, unwraps signals safely, and prevents prototype-chain access.
Even though the implementation relies on `new Function()`, the compiled function only ever sees the proxy—never the real `globalThis`.

### Blocked Access

Three property names are unconditionally blocked to prevent prototype pollution: `__proto__`, `constructor`, and `prototype`.
These restrictions apply to all access patterns including dot notation, bracket notation, and object literal keys.

The following global names are blocked even if present in scope:
`Function`, `eval`, `globalThis`, `window`, `global`, `process`, `require`, `import`, `module`, `exports`.

### Allowed Operations

Standard constructors and utilities remain accessible: `Array`, `Object`, `String`, `Number`, `Boolean`, `Date`, `Math`, `JSON`, `RegExp`, `Map`, `Set`, `Promise`.

All built-in methods on native types (strings, arrays, objects, etc.) are permitted.
Signal methods (`get`, `set`, `subscribe`) are explicitly allowed even though `constructor` is otherwise blocked.

### Error Handling

Expressions containing unsafe operations or syntax errors are wrapped in an `EvaluationError`.
VoltX logs the error with the original expression for easier debugging and returns `undefined` to keep the UI responsive.

Boolean negation is rewritten internally (`!foo` becomes `!$unwrap(foo)`) so signals behave like plain values during coercion without leaking signal internals into the template.

## Guidelines

### Performance

Expressions are compiled on first use and subsequent evaluations hit the cache.
Keep expressions simple and prefer computed signals for heavy logic—the evaluator already tracks dependencies so only affected bindings re-run.

### Best Practices

- Use computed signals for logic that appears in multiple bindings or involves expensive operations.
- Never use untrusted user input directly in expressions without validation.
- Prefer simple, readable expressions in templates over complex nested operations.
- Structure your scope data with consistent shapes (or consistent types) to avoid runtime errors.
- Remember that event handlers (`data-volt-on-*`) evaluate statements without unwrapping signals; call `signal.set(...)` or `store.set(...)` directly when you need to mutate state.
