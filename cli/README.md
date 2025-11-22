# create-voltx

CLI for creating and managing VoltX.js applications.

## Usage

### Create a New Project

```bash
# Using pnpm (recommended)
pnpm create voltx my-app

# Using npm
npm create voltx@latest my-app

# Using npx
npx create-voltx my-app
```

### Commands

#### `init [project-name]`

Create a new VoltX.js project with interactive template selection.

```bash
voltx init my-app
```

**Templates:**

- **Minimal** - Basic VoltX.js app with counter
- **With Router** - Multi-page app with routing
- **With Plugins** - All plugins demo
- **Styles Only** - Just HTML + CSS, no framework

#### `dev`

Start Vite development server.

```bash
voltx dev [--port 3000] [--open]
```

#### `build`

Build project for production.

```bash
voltx build [--out dist]
```

#### `download`

Download VoltX.js assets from CDN.

```bash
voltx download [--version latest] [--output .]
```

## Documentation

See the [CLI Guide](https://stormlightlabs.github.io/volt/cli) for complete documentation.

## Development

```bash
# Install dependencies
pnpm install

# Build CLI
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## License

MIT
