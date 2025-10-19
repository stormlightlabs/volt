# Installation

<!-- TODO: Figure out actual project path @voltjs/volt -->

Volt.js can be installed via CDN or package manager. Choose the method that best fits your project setup.

## CDN (unpkg)

The simplest way to get started is loading Volt.js directly from a CDN. This approach requires no build tools and works immediately in any HTML file.

### ES Modules

Use the module build for modern browsers with ES module support:

```html
<script type="module">
  import { charge, registerPlugin } from 'https://unpkg.com/@voltjs/volt@latest/dist/volt.js';
  charge();
</script>
```

You can optionally pin to a specific version:

```html
<script type="module">
  import { charge } from 'https://unpkg.com/@voltjs/volt@0.1.0/dist/volt.js';
  charge();
</script>
```

## Package Manager

For applications using node based tools, install Volt.js via npm or similar:

```bash
npm install @voltjs/volt
```

```bash
pnpm add @voltjs/volt
```

### Module Imports

Import only the functions you need to minimize bundle size:

```js
import { charge, registerPlugin } from '@voltjs/volt';
import { persistPlugin } from '@voltjs/volt/plugins';

registerPlugin('persist', persistPlugin);
charge();
```

The framework uses tree-shaking to eliminate unused code when bundled with modern build tools like Vite, Rollup, or Webpack.

## TypeScript

Volt.js is written in TypeScript and includes complete type definitions.

TypeScript users get automatic type inference for:

- Signal values and methods
- Computed dependencies
- Plugin contexts
- Scope objects passed to `mount()`

## Basic Setup

### Declarative Mode (Recommended)

For applications that can be built entirely in HTML, use the declarative approach with `charge()`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Volt.js App</title>
</head>
<body>
  <div data-volt data-volt-state='{"count": 0}'>
    <h1 data-volt-text="count">0</h1>
    <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
  </div>

  <script type="module">
    import { charge } from 'https://unpkg.com/@voltjs/volt@latest/dist/volt.js';
    charge();
  </script>
</body>
</html>
```

The `charge()` function auto-discovers all elements with the `data-volt` attribute and mounts them with their declared state.

### Programmatic Mode

For applications requiring initialization logic, use the programmatic API with `mount()`:

```html
<script type="module">
  import { mount, signal } from 'https://unpkg.com/@voltjs/volt@latest/dist/volt.js';

  const count = signal(0);

  mount(document.querySelector('#app'), {
    count,
    increment: () => count.set(count.get() + 1)
  });
</script>
```

This approach gives you full control over signal creation, initialization, and the scope object.

## Server-Side Rendering

For SSR applications, use the `hydrate()` function instead of `charge()` to preserve server-rendered HTML and attach interactivity:

```html
<script type="module">
  import { hydrate } from '@voltjs/volt';
  hydrate();
</script>
```

See the [Server-Side Rendering & Lifecycle](./lifecycle) documentation for complete SSR patterns and hydration strategies.

## Plugin Setup

Volt.js includes several built-in plugins that must be registered before use:

```html
<script type="module">
  import { charge, registerPlugin } from '@voltjs/volt';
  import { persistPlugin, scrollPlugin, urlPlugin } from '@voltjs/volt/plugins';

  registerPlugin('persist', persistPlugin);
  registerPlugin('scroll', scrollPlugin);
  registerPlugin('url', urlPlugin);

  charge();
</script>
```

Register plugins before calling `charge()`, `mount()`, or `hydrate()` to ensure they're available for binding resolution.

## Browser Compatibility

Volt.js requires modern browsers with support for:

- ES2020 syntax (optional chaining, nullish coalescing)
- ES modules
- Proxy objects
- CSS custom properties

**Minimum versions:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Next Up

- Read the [Framework Overview](./overview) to understand core concepts
- Learn about [State Management](./state) with signals and computed values
- Explore available [Bindings](./bindings) for DOM manipulation
- Check out [Expression Evaluation](./expressions) for template syntax
