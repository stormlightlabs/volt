# Volt CSS Semantics

Auto-generated documentation from base.css

## CSS Custom Properties

All design tokens defined in the stylesheet.

### Typography

- `--font-size-base`: `18px`
- `--font-size-sm`: `0.889rem`
- `--font-size-lg`: `1.125rem`
- `--font-size-xl`: `1.266rem`
- `--font-size-2xl`: `1.424rem`
- `--font-size-3xl`: `1.802rem`
- `--font-size-4xl`: `2.027rem`
- `--font-size-5xl`: `2.566rem`
- `--font-sans`: `"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- `--font-serif`: `"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif`
- `--font-mono`: `"SF Mono", "Cascadia Code", "Fira Code", "Roboto Mono", Consolas, monospace`
- `--line-height-tight`: `1.25`
- `--line-height-base`: `1.6`
- `--line-height-relaxed`: `1.8`
- `--font-size-base`: `16px`
- `--font-size-base`: `15px`

### Spacing

- `--space-xs`: `0.25rem`
- `--space-sm`: `0.5rem`
- `--space-md`: `1rem`
- `--space-lg`: `1.5rem`
- `--space-xl`: `2rem`
- `--space-2xl`: `3rem`
- `--space-3xl`: `4rem`
- `--space-2xl`: `2rem`
- `--space-3xl`: `3rem`

### Layout

- `--content-width`: `70ch`
- `--sidenote-width`: `18rem`
- `--sidenote-gap`: `2rem`

### Colors

- `--color-bg`: `#fefefe`
- `--color-bg-alt`: `#f5f5f5`
- `--color-text`: `#1a1a1a`
- `--color-text-muted`: `#666666`
- `--color-accent`: `#0066cc`
- `--color-accent-hover`: `#0052a3`
- `--color-border`: `#d4d4d4`
- `--color-code-bg`: `#f8f8f8`
- `--color-mark`: `#fff3cd`
- `--color-success`: `#22863a`
- `--color-warning`: `#bf8700`
- `--color-error`: `#cb2431`
- `--color-bg`: `#1a1a1a`
- `--color-bg-alt`: `#2a2a2a`
- `--color-text`: `#e6e6e6`
- `--color-text-muted`: `#a0a0a0`
- `--color-accent`: `#4da6ff`
- `--color-accent-hover`: `#66b3ff`
- `--color-border`: `#404040`
- `--color-code-bg`: `#2a2a2a`
- `--color-mark`: `#4a4a00`
- `--color-success`: `#34d058`
- `--color-warning`: `#ffdf5d`
- `--color-error`: `#f97583`

### Effects

- `--shadow-sm`: `0 1px 2px rgba(0, 0, 0, 0.05)`
- `--shadow-md`: `0 4px 6px rgba(0, 0, 0, 0.07)`
- `--shadow-lg`: `0 10px 15px rgba(0, 0, 0, 0.1)`
- `--radius-sm`: `3px`
- `--radius-md`: `6px`
- `--radius-lg`: `8px`
- `--transition-fast`: `150ms ease-in-out`
- `--transition-base`: `250ms ease-in-out`
- `--shadow-sm`: `0 1px 2px rgba(0, 0, 0, 0.3)`
- `--shadow-md`: `0 4px 6px rgba(0, 0, 0, 0.4)`
- `--shadow-lg`: `0 10px 15px rgba(0, 0, 0, 0.5)`

## Element Coverage

HTML elements with defined styling in the stylesheet.

**Coverage**: 58/60 elements

### Styled Elements

**Document Structure**: html, body
**Typography**: h1, h2, h3, h4, h5, h6, p, a, em, strong, mark, small, sub, sup, hr
**Lists**: ul, ol, li, dl, dt, dd
**Semantic**: blockquote, cite, article, section, aside, header, footer, nav, details, summary
**Forms**: form, fieldset, legend, label, input, select, textarea, button
**Tables**: table, thead, th, td
**Media**: img, figure, figcaption, video, audio, canvas, svg, iframe
**Code**: code, pre, kbd, samp, var

### Unstyled Elements

tbody, tr

## Documentation Comments

Inline documentation extracted from CSS comments.

### `:root`

Root-level CSS variables define the design system. Light theme is default, dark theme overrides via media query.

### `@media (prefers-color-scheme: dark)`

Dark Theme Overrides Automatically applied when user prefers dark color scheme

### `*, *::before, *::after`

Modern CSS reset with sensible defaults

### `html`

Document root configuration Sets base font size for rem calculations

### `body`

Body element - Primary container Sets default typography and colors for the entire document

### `h1, h2, h3, h4, h5, h6`

Headings hierarchy Uses modular scale for harmonious sizing Tighter line-height for larger text improves readability

### `h1`

Individual heading sizes h1-h3 use slightly larger weights for emphasis

### `p`

Paragraph spacing Generous spacing between paragraphs aids scanning

### `h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p`

First paragraph after headings - No top margin Common convention in academic typography

### `a`

Links - Accessible and distinctive Uses accent color with underline for clarity

### `em`

Emphasis and strong elements

### `mark`

Marked/highlighted text

### `sub, sup`

Subscript and superscript Prevents them from affecting line height

### `small`

Small text Also used for Tufte-style sidenotes (see sidenotes section)

### `ul, ol`

List spacing and indentation Nested lists inherit proper spacing

### `li`

List items

### `li > ul, li > ol`

Nested lists - Reduced spacing

### `dl`

Description lists - For key-value pairs

### `p:has(small)`

Parent paragraph must be positioned for absolute children

### `p small`

Pull small elements into the right margin Creates classic Tufte-style sidenote layout

### `@media (max-width: 767px)`

Mobile sidenotes - Inline with subtle styling

### `blockquote`

Blockquote styling Left border for visual distinction, italic for emphasis

### `cite`

Citation element

### `code`

Inline code Monospace font with subtle background for distinction

### `kbd`

Keyboard input Styled like keys on a keyboard

### `samp`

Sample output

### `var`

Variable

### `pre`

Preformatted code blocks Horizontal scrolling for overflow, no word wrap

### `hr`

Section dividers Centered decorative element with breathing room

### `table`

Table container for horizontal scrolling on small screens

### `thead`

Table header styling Bold text with bottom border for separation

### `td`

Table cells

### `tbody tr:nth-child(even)`

Zebra striping for easier row scanning

### `tbody tr:hover`

Hover state for interactive tables

### `form`

Form container spacing

### `fieldset`

Fieldset grouping

### `label`

Labels Block display for better touch targets

### `textarea`

Textarea specific

### `input[type="checkbox"],`

Checkboxes and radio buttons

### `input[type="file"]`

File input

### `input[type="range"]`

Range input

### `progress, meter`

Progress and meter

### `input[type="reset"]`

Reset button - Subdued styling

### `img`

Images Responsive by default, maintains aspect ratio

### `figure`

Figures with captions Common in academic and technical writing

### `video, audio`

Video and audio Responsive and accessible

### `canvas, svg`

Canvas and SVG

### `iframe`

iframe - Responsive wrapper

### `article, section`

Article and Section Spacing between major content blocks

### `aside`

Aside Complementary content, styled distinctly

### `header`

Header and Footer

### `nav`

Nav Navigation menus

### `details`

Details and Summary Disclosure widget for expandable content

### `.sr-only`

Screen reader only Hides content visually but keeps it accessible to assistive technology

### `@media print`

Print-specific optimizations

### `@media (max-width: 768px)`

Tablet and below - Reduce spacing

### `@media (max-width: 480px)`

Mobile - Further reduced spacing and sizing
