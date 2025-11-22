# CLI

The VoltX.js CLI provides tools for creating and managing VoltX.js applications. Use it to scaffold new projects, run development servers, build for production, and download framework assets.

## Installation

The CLI is available as `create-voltx` on npm:

```bash
# Use with pnpm (recommended)
pnpm create voltx my-app

# Use with npm
npm create voltx@latest my-app

# Use with npx
npx create-voltx my-app
```

For ongoing development commands, install the CLI in your project:

```bash
pnpm add -D create-voltx
```

## Commands

### `init`

Create a new VoltX.js project with an interactive template selector.

```bash
# Interactive mode - prompts for project name and template
pnpm create voltx

# Specify project name
pnpm create voltx my-app

# Using the voltx command
voltx init my-app
```

**Templates:**

- **Minimal** - Basic VoltX.js app with a counter demo
- **With Router** - Multi-page app with client-side routing
- **With Plugins** - Demonstration of all VoltX.js plugins
- **Styles Only** - HTML + CSS using VoltX.js styles without the framework

The init command:

- Creates project directory
- Generates HTML, CSS, package.json, and README
- Downloads latest VoltX.js assets from CDN
- Sets up development scripts

**Generated Structure:**

```sh
my-app/
├── index.html       # Main HTML file
├── styles.css       # Custom styles
├── package.json     # Project configuration
├── README.md        # Getting started guide
├── voltx.min.js     # VoltX.js framework
└── voltx.min.css    # VoltX.js base styles
```

### `dev`

Start a Vite development server for your VoltX.js project.

```bash
voltx dev
```

**Options:**

- `-p, --port <port>` - Port to run the dev server on (default: 3000)
- `-o, --open` - Open browser automatically

**Examples:**

```bash
# Start dev server on default port (3000)
voltx dev

# Use custom port
voltx dev --port 8080

# Open browser automatically
voltx dev --open
```

The dev server provides:

- Hot module replacement (HMR)
- Fast refresh for development
- Automatic browser reload
- HTTPS support (via Vite)

### `build`

Build your VoltX.js project for production.

```bash
voltx build
```

**Options:**

- `--out <dir>` - Output directory (default: dist)

**Examples:**

```bash
# Build to default dist/ directory
voltx build

# Build to custom directory
voltx build --out public
```

The build command:

- Minifies HTML, CSS, and JavaScript
- Optimizes assets for production
- Generates source maps
- Creates optimized bundle

### `download`

Download VoltX.js assets (JS and CSS) from the CDN.

```bash
voltx download
```

**Options:**

- `--version <version>` - VoltX.js version to download (default: latest)
- `--no-js` - Skip downloading JavaScript file
- `--no-css` - Skip downloading CSS file
- `-o, --output <dir>` - Output directory (default: current directory)

**Examples:**

```bash
# Download latest JS and CSS
voltx download

# Download specific version
voltx download --version 0.5.0

# Download only CSS
voltx download --no-js

# Download to custom directory
voltx download --output assets
```

This command downloads minified assets from the jsDelivr CDN.

## Workflows

### Creating a New Project

```bash
# Create new project
pnpm create voltx my-app

# Navigate to project
cd my-app

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

### Development

```bash
# Start dev server (watches for changes)
pnpm dev

# In another terminal, run tests if available
pnpm test
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
npx vite preview --outDir dist
```

### Updating VoltX.js Assets

```bash
# Download latest version
voltx download

# Or download specific version
voltx download --version 0.5.1
```

## Project Scripts

All generated projects include these npm scripts:

```json
{
  "scripts": {
    "dev": "voltx dev",
    "build": "voltx build"
  }
}
```

Run them with your package manager:

```bash
pnpm dev
pnpm build
```

## Templates

### Minimal

A basic VoltX.js application demonstrating:

- Declarative state with `data-volt-state`
- Reactive bindings
- Event handlers
- Counter example

Best for: Learning VoltX.js basics, simple interactive pages.

### With Router

A multi-page application featuring:

- Client-side routing with History API
- Multiple routes (home, about, contact, 404)
- Navigation with `data-volt-navigate`
- Route matching with `data-volt-url`

Best for: Multi-page applications, documentation sites, dashboards.

### With Plugins

A comprehensive demo showcasing:

- Persist plugin (localStorage sync)
- Scroll plugin (smooth scrolling)
- URL plugin (URL parameter sync)
- Surge plugin (animations)
- Navigate plugin (routing)

Best for: Learning all VoltX.js features, reference implementation.

### Styles Only

HTML and CSS using VoltX.js styles without the reactive framework:

- VoltX.js CSS utilities
- Semantic HTML
- No JavaScript required

Best for: Static sites, progressively enhanced pages, CSS-only projects.

## Configuration

### Vite Configuration

The CLI uses Vite as the dev server and build tool. To customize Vite, create a `vite.config.js` in your project root:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  // Custom Vite configuration
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
```

See the [Vite documentation](https://vitejs.dev/config/) for all available options.

## Troubleshooting

### Dev Server Won't Start

Ensure you're in a VoltX.js project directory with an `index.html` file:

```bash
ls index.html
```

If `index.html` is missing, you may not be in a VoltX.js project.

### Download Fails

Check your internet connection and try again. The CLI downloads assets from:

```text
https://cdn.jsdelivr.net/npm/voltx.js@{version}/dist/
```

If jsDelivr is blocked, manually download from the [npm package](https://www.npmjs.com/package/voltx.js).

### Build Fails

Ensure all dependencies are installed:

```bash
pnpm install
```

Check for syntax errors in your HTML, CSS, or JavaScript files.

## Next Steps

- Read the [Installation Guide](./installation) for framework setup
- Explore [Usage Patterns](./usage/state) for state management
