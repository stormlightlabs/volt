---
version: 1.0
updated: 2025-10-18
---

# dom

DOM utility functions

## walkDOM

Walk the DOM tree and collect all elements with data-volt-* attributes in document order (parent before children).

Skips children of elements with data-volt-for or data-volt-if since those will be processed when the parent element is cloned and mounted.

```typescript
export function walkDOM(root: Element): Element[]
```

## hasVoltAttribute

Check if an element has any data-volt-* attributes.

```typescript
export function hasVoltAttribute(element: Element): boolean
```

## getVoltAttributes

Get all data-volt-\* attributes from an element.
Excludes charge metadata attributes (state, computed:*) that are processed separately.

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
Supports string values ("active"), object notation ({active: true}),
and other primitives (true, false, numbers) which are converted to strings.

```typescript
export function parseClassBinding(value: unknown): Map<string, boolean>
```
