---
version: 1.0
updated: 2025-10-18
---

# dom

DOM utility functions

## walkDOM

Walk the DOM tree and collect all elements with data-x-* attributes.
Returns elements in document order (parent before children).

```typescript
export function walkDOM(root: Element): Element[]
```

## hasVoltAttribute

Check if an element has any data-x-* attributes.

```typescript
export function hasVoltAttribute(element: Element): boolean
```

## getVoltAttributes

Get all data-x-* attributes from an element.

```typescript
export function getVoltAttributes(element: Element): Map<string, string>
```

## setText

Set the text content of an element safely.

```typescript
export function setText(element: Element, value: unknown): void
```

## setHTML

Set the HTML content of an element safely.
Note: This trusts the input HTML and should only be used with sanitized content.

```typescript
export function setHTML(element: Element, value: string): void
```

## toggleClass

Add or remove a CSS class from an element.

```typescript
export function toggleClass(element: Element, className: string, add: boolean): void
```

## parseClassBinding

Parse a class binding expression.
Supports both string values ("active") and object notation ({active: true}).

```typescript
export function parseClassBinding(value: unknown): Map<string, boolean>
```
