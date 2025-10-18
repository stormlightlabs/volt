---
version: 1.0
updated: 2025-10-18
---

# evaluator

Safe expression evaluation with operators support

Implements a recursive descent parser for expressions without using eval()

## isSignal

```typescript
export function isSignal(value: unknown): value is Dep
```

## evaluate

Evaluate an expression against a scope object.

Supports literals, property access, operators, and member access.

```typescript
export function evaluate(expr: string, scope: Scope): unknown
```

## extractDependencies

Extract all signal dependencies from an expression by finding identifiers
that correspond to signals in the scope.

```typescript
export function extractDependencies(expr: string, scope: Scope): Array<Dep>
```
