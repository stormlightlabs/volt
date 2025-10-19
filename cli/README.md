# Volt Developer CLI

Development tools for the Volt.js project. Uses:

- `commander` for command-line parsing
- `chalk` for colored output
- TypeScript Compiler API for parsing source files

## Installation

From the project root:

```sh
pnpm install
```

The `volt` command will be available after installation.

## Commands

### `volt docs`

Generates API documentation from TypeScript source files.

- Scans all `.ts` files in `src/`
- Extracts JSDoc comments and type signatures
- Outputs markdown files to `docs/api/`
- Supports `@example` tags in JSDoc

Generated documentation includes:

- Function signatures and descriptions
- Interface definitions and members
- Type aliases
- Code examples from `@example` tags

### `volt stats`

Displays lines of code statistics.

- Default: counts code in `src/` only
- Excludes JSDoc comments, single-line comments, and empty lines
- Use `--full` to include test files

Outputs:

- Total files
- Total lines (including comments)
- Code lines (excluding docs/comments)
- Documentation/comment lines

## Development

### Build

```sh
pnpm build
```

Compiles TypeScript to `dist/` using tsdown.

### Test

```sh
pnpm test           # Watch mode
pnpm test:run       # Single run
```

### Type Check

```sh
pnpm typecheck
```
