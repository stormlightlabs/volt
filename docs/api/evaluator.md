---
version: 1.0
updated: 2025-10-18
---

# evaluator

Safe expression evaluation of simple expressions without using eval() for bindings

## Scope

Safe expression evaluation of simple expressions without using eval() for bindings

```typescript
Record<string, unknown>
```

## evaluate

Evaluate a simple expression against a scope object.
Supports:
- Property access: "count", "user.name", "items.length"
- Simple literals: "true", "false", "null", "undefined"
- Numbers: "42", "3.14"
- Strings: "'hello'", '"world"'

```typescript
export function evaluate(expression: string, scope: Scope): unknown
```
