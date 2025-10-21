# Contributing to VoltX

## Documentation

### API Doc Parser Spec

- `docsCommand` currently walks every `.ts` file under `src/` and emits markdown for exported functions, interfaces, and type aliases.
    - Extend `parseFile` before adding new declaration shapes so documentation stays complete.
- When enhancing the parser:
    - Normalize all leading whitespace with the `getFullText` helpers
    - Prefer passing structured data (description, tags, examples) into `generateMD`.
    - Avoid baking markdown formatting inside the extractor so the generator can evolve independently.
- Preserve ordering: `parseFile` visits nodes in source order.
    - When adding new collectors, keep this invariant so the docs mirror the file’s story.
- Add unit coverage under `test/dev/docs-parser.test.ts` (or a new spec) whenever you touch comment parsing.
    - Sample TS files with edge-case syntax (generics, overloads, multi-line examples) make regressions easy to catch.
- After updating comments or the parser, build new API docs and inspect the refreshed files in `docs/api/` before submitting changes

### Writing API Documentation (TypeScript)

- Start each source file that ships public APIs with a `@packageDocumentation` tag
    - Give a one-sentence summary on the first line, follow with paragraphs that explain when to reach for the module
    - Avoid other tags in this block so `extractModDocs` can surface clean prose (see `dev/src/commands/docs.ts`).
- Document every exported symbol (functions, interfaces, types, classes, consts) with a JSDoc block placed immediately above the declaration.
    - Keep the first sentence under 121 characters; subsequent sentences can wrap naturally.\
    - Publicly exported symbols are in entry points (`index.ts`, `debug.ts`)
- Structure symbol docs as:
    1. Summary line
    2. Optional paragraphs
    3. `@remarks` for nuance
    4. Any number of `@example` blocks
        - Use markdown code block syntax tagged with `ts` or `typescript`
- The parser doesn't render `@param`, `@returns`, and `@throws` (as of 2025-10-20),
    - Fold critical argument and return-value notes into `@remarks` or provide a short table in markdown
    - When the parser gains tag support, prefer one tag per line (`@param input Signal to watch`) so it can be emitted as a definition list
- Use deliberate naming in overloads and generics; the generator flattens signatures (`extractFnSig`) and shows exactly what the compiler sees.
    - Keep overloads minimal and consider documenting helper types separately if they deserve their own section.

### Writing CSS Documentation

- Place JSDoc-style blocks immediately above the selector or at-rule they describe.
    - The CSS parser associates the next non-empty line that opens a block with the comment so keep unrelated declarations between the comment and selector out of the way.
        - See `extractCSSComments` in `dev/src/commands/css-docs.ts`
- Keep comments under ~180 characters or split them into multiple sentences
    - `generateSemanticsDocs` currently (2025-10-20) discards longer blobs
    - Should answer:
        1. "What does this selector represent?"
        2. "Why does it exist?"
- Explain theme or state-specific overrides (`@media`, `[data-variant]`, etc.) directly in the comment so the semantics page contextualizes duplicated selectors.
    - For shared guidance, prefer separate comments per selector rather than trailing inline notes.
- Name CSS custom properties with the established prefixes (`--color-*`, `--space-*`, `--font-*`, …).
    - The generator buckets them by prefix (`categorizeCSSVar`), so consistent naming keeps the documentation grouped sensibly.
- After editing CSS docs, rebuild and review `docs/css/semantics.md` for accidental duplicates or missing selectors
    - Adjust comments or parser thresholds before committing if the output reads awkwardly
