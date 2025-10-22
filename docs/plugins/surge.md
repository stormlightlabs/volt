---
outline: deep
---

# Surge Plugin

The surge plugin powers enter/leave transitions for conditional DOM. It combines CSS property interpolation, optional
View Transitions, and a signal-aware state machine to animate elements appearing or disappearing.

## Quick Start

```html
<section data-volt-surge="isOpen:fade">
  <p>Panel content...</p>
</section>
```

- `isOpen` resolves to a signal. Falsy values hide the element (`display: none`).
- The `fade` preset runs when the signal flips to truthy and again in reverse when it returns to falsy.

## Presets and Overrides

`data-volt-surge="presetName"` attaches a preset from the transition registry without watching a signal. Combine with
granular variants when you need independent enter/leave control:

```html
<article
  data-volt-surge="show:slide-down.400"
  data-volt-surge:enter="fade.200"
  data-volt-surge:leave="scale-down.250">
  ...
</article>
```

- `data-volt-surge:enter` and `:leave` use the same parsing logic as the core transition helpers (`duration.delay`
  suffixes honored via `parseTransitionValue` and `applyOverrides`).
- When both shorthand and phase-specific attributes exist, the phase-specific value wins.

## Signal Lifecycle

When bound to a signal the plugin:

1. Checks the initial signal value. Falsy values hide the element immediately.
2. Subscribes to the signal and debounces concurrent transitions so rapid toggles stay smooth.
3. Uses `execEnter`/`execLeave` helpers to apply styles, classes, delays, and easing.
4. Cleans up the subscription when the element unmounts.

The underlying transition promise resolves before the element is marked visible or hidden, ensuring sequential updates
remain ordered.

## View Transitions Integration

Surge participates in the View Transition API whenever the preset’s config opts in (default). Calling variants like
`slide-down.400` runs inside `withViewTransition`, making swapping sections feel native. Add `:notransition` to your
navigate bindings if you need to avoid double animations when combining plugins.

## Manual Execution

Volt’s runtime calls the internal helpers automatically for keyed iterations and DOM diffs. If you render content
manually, you can trigger the same behavior:

```ts
import { executeSurgeEnter, executeSurgeLeave, hasSurge } from "volt/plugins/surge";

if (hasSurge(el)) {
  await executeSurgeEnter(el);
}
```

`hasSurge` checks whether the element owns any surge metadata (signal config or phase overrides) before attempting an
explicit enter/leave.

## Reduced Motion

When the user prefers reduced motion the plugin skips transitions, applies the `to` styles or classes immediately, and
avoids firing View Transition effects. This keeps the animation accessible without extra work on your part.
