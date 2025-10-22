---
outline: deep
---

# Shift Plugin

The shift plugin applies reusable CSS keyframe animations to any element. Use it for attention-grabbing nudges, loading
states, or signal-driven feedback without writing imperative animation code.

## Quick Start

```html
<!-- Run bounce once on mount -->
<button data-volt-shift="bounce">Click me</button>

<!-- Infinite pulse animation -->
<span data-volt-shift="pulse">Loading…</span>
```

When an element mounts the plugin pulls a preset from the animation registry and calls the Web Animations API with the
configured keyframes, duration, iterations, and easing. Users with `prefers-reduced-motion` skip the animation entirely.

## Built-in Presets

Volt ships with several presets you can reference immediately:

- `bounce`-snappy vertical movement for call-to-action buttons.
- `shake`-horizontal wiggle, ideal for error indicators.
- `pulse`-scale and opacity pulse that repeats forever.
- `spin`-continuous 360° rotation.
- `flash`-blinking opacity effect.

## Custom Duration and Iterations

Add dot-separated numbers after the preset to override timing settings.

```html
<!-- 1 second bounce repeated three times -->
<div data-volt-shift="bounce.1000.3">Triple bounce</div>
```

The first number is duration in milliseconds; the optional second number controls iteration count. Omitted values fall
back to the preset configuration.

## Reacting to Signals

Prefix the binding with a signal path to trigger the animation whenever the signal changes from its previous value to a
truthy value.

```html
<div data-volt-shift="form.error:shake">Please fix the highlighted fields</div>
```

For the snippet above:

- `form.error` is resolved via `ctx.findSignal`.
- The element animates the first time the signal evaluates truthy.
- Subsequent updates run the animation whenever the value toggles and remains truthy.

## Registering Custom Animations

Use the programmatic API to add, inspect, or remove presets.

```ts
import { getRegisteredAnimations, registerAnimation } from "volt/plugins/shift";

registerAnimation("wiggle", {
  keyframes: [
    { offset: 0, transform: "rotate(0deg)" },
    { offset: 0.25, transform: "rotate(-5deg)" },
    { offset: 0.75, transform: "rotate(5deg)" },
    { offset: 1, transform: "rotate(0deg)" },
  ],
  duration: 300,
  iterations: 2,
  timing: "ease-in-out",
});

console.log(getRegisteredAnimations()); // ["bounce", "shake", ..., "wiggle"]
```

Other helpers:

- `getAnimation(name)` - fetch the preset definition.
- `hasAnimation(name)` - check existence.
- `unregisterAnimation(name)` - remove custom presets (built-ins cannot be deleted).

## Cleanup

Shift automatically cancels the underlying `element.animate` call on completion and removes subscriptions registered via signals.
No additional teardown is required beyond VoltX’s normal plugin lifecycle.
