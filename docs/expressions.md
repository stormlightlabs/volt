# Expression Evaluation

Volt.js evaluates JavaScript-like expressions in HTML templates using a sandboxed recursive descent parser.
The evaluator is CSP-compliant and does not use `eval()` or `new Function()`.

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

The evaluator implements a balanced sandbox that blocks dangerous operations while attempting to preserve flexibility for most use cases.

### Blocked Access

Three property names are unconditionally blocked to prevent prototype pollution: `__proto__`, `constructor`, and `prototype`.
These restrictions apply to all access patterns including dot notation, bracket notation, and object literal keys.

The following global names are blocked even if present in scope:
`Function`, `eval`, `globalThis`, `window`, `global`, `process`, `require`, `import`, `module`, `exports`.

### Allowed Operations

Standard constructors and utilities remain accessible: `Array`, `Object`, `String`, `Number`, `Boolean`, `Date`, `Math`, `JSON`, `RegExp`, `Map`, `Set`, `Promise`.

All built-in methods on native types (strings, arrays, objects, etc.) are permitted. Signal methods (`get`, `set`, `subscribe`) are explicitly allowed even though `constructor` is otherwise blocked.

### Error Handling

Expressions containing unsafe operations or syntax errors are caught, logged to the console, and return `undefined` rather than throwing. This prevents malicious or malformed expressions from breaking the application.

## Guidelines

### Performance

Expressions are parsed on every evaluation. For optimal performance, keep expressions simple and use computed signals for complex calculations.
The evaluator automatically tracks signal dependencies so only affected bindings re-evaluate when signals change.

### Best Practices

- Use computed signals for logic that appears in multiple bindings or involves expensive operations.
- Never use untrusted user input directly in expressions without validation.
- Prefer simple, readable expressions in templates over complex nested operations.
- Structure your scope data with consistent shapes (or consistent types) to avoid runtime errors.
