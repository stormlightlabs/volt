# Animations & Transitions

VoltX provides a powerful, declarative animation system through two complementary plugins:

1. **surge** for enter/leave transitions and
2. **shift** for CSS keyframe animations.

Both integrate with the reactivity system and respect user accessibility preferences.

## Quick Start

Add transitions to any element with `data-volt-if` or `data-volt-show` by adding `data-volt-surge` with a preset name:

```html
<div data-volt-if="isVisible" data-volt-surge="fade">
  Content fades in and out smoothly
</div>
```

That's it! The surge plugin automatically hooks into the element's lifecycle, applying transitions when it appears or disappears.

## Built-in Presets

VoltX includes ready-to-use transition presets:

| Preset          | Description                       |
| --------------- | --------------------------------- |
| **fade**        | Simple opacity transition         |
| **slide-up**    | Sliding motion with opacity       |
| **slide-down**  |                                   |
| **slide-left**  |                                   |
| **slide-right** |                                   |
| **scale**       | Subtle scale effect with opacity  |
| **blur**        | Blur effect combined with opacity |

All presets are designed with smooth, professional timing curves and 300ms duration by default.

## Surge Plugin: Enter/Leave Transitions

The surge plugin provides two modes of operation: automatic (with if/show bindings) and explicit (signal-based).

### Automatic Mode

When used with `data-volt-if` or `data-volt-show`, surge automatically manages the element's visibility transitions. The element smoothly animates in when the condition becomes true and animates out before removal.

### Explicit Mode

Watch any signal by providing a signal path. The element will transition in/out based on the signal's truthiness:

```html
<div data-volt-surge="showPanel:slide-down">
  Panel slides down when showPanel is true
</div>
```

### Duration and Delay Modifiers

Override preset timing using dot notation:

```html
<!-- 500ms duration -->
<div data-volt-surge="fade.500">...</div>

<!-- 600ms duration, 100ms delay -->
<div data-volt-surge="slide-down.600.100">...</div>
```

### Granular Control

Specify different transitions for enter and leave phases:

```html
<div
  data-volt-if="show"
  data-volt-surge:enter="slide-down.400"
  data-volt-surge:leave="fade.200">
  Slides in, fades out
</div>
```

## Shift Plugin: Keyframe Animations

The shift plugin applies CSS keyframe animations, perfect for attention-grabbing effects and continuous animations.

### Built-in Animations

| Animation  | Description                       |
| ---------- | --------------------------------- |
| **bounce** | Quick bounce effect               |
| **shake**  | Horizontal shake motion           |
| **pulse**  | Subtle pulsing scale (continuous) |
| **spin**   | Full rotation (continuous)        |
| **flash**  | Opacity flash effect              |

### One-Time Animations

Apply animation when element mounts:

```html
<button data-volt-shift="bounce">Bounces on mount</button>
```

### Signal-Triggered Animations

Trigger animations based on signal changes:

```html
<div data-volt-shift="error:shake.600.2">
  Shakes twice when error becomes truthy
</div>
```

The syntax supports duration and iteration overrides: `animationName.duration.iterations`

## View Transitions API

VoltX automatically uses the View Transitions API when available, providing native browser-level transitions for ultra-smooth visual updates.
The system gracefully falls back to CSS transitions on unsupported browsers.

For advanced use cases, manually trigger view transitions using `startViewTransition` or `namedViewTransition` from the programmatic API.

## Custom Presets (Programmatic Mode)

Register custom transitions for reuse across your application:

```javascript
import { registerTransition } from "voltx.js";

registerTransition("custom-slide", {
  enter: {
    from: { opacity: 0, transform: "translateX(-100px)" },
    to: { opacity: 1, transform: "translateX(0)" },
    duration: 400,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  leave: {
    from: { opacity: 1, transform: "translateX(0)" },
    to: { opacity: 0, transform: "translateX(100px)" },
    duration: 300,
    easing: "ease-out",
  },
});
```

Similarly, register custom shift animations with `registerAnimation`.

## Easing Functions

Surge supports standard CSS easing values plus extended named easings:

- Standard: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`
- Extended: `ease-in-sine`, `ease-out-quad`, `ease-in-out-cubic`, `ease-in-back`

Custom cubic-bezier values are also supported.

## Integration with Bindings

- With `data-volt-if`, surge defers element insertion/removal until transitions complete, preventing visual glitches.
- With `data-volt-show`, surge manages display property changes around the transition lifecycle.
- Simply add `data-volt-surge` to elements already using these bindings.

## Accessibility

The animation system automatically respects the `prefers-reduced-motion` media query. When enabled, animations are skipped or significantly reduced, instantly applying final states instead.

Both surge and shift plugins honor this setting by default, ensuring your application remains accessible without additional configuration.
