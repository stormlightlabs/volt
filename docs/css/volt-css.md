# Volt CSS

A classless CSS stylesheet for elegant, readable web documents. Drop it into any HTML page for instant, semantic styling without touching a single class name.

## Philosophy

Volt CSS embraces semantic HTML5 and lets the content structure define the presentation. Inspired by academic typography and modern web design, it creates documents that are beautiful, accessible, and optimized for reading.

### Core Principles

- **Classless**: Style semantic HTML elements directly.
- **Accessible**: WCAG AA contrast ratios, keyboard navigation support, and semantic HTML patterns

- Optimized line lengths, modular type scale, and whitespace optimized for reading
- Automatic light and dark modes via `prefers-color-scheme`
- Mobile-first (ish) design that doesn't compromise readability

## Inspiration

Volt CSS synthesizes ideas from several excellent classless CSS frameworks:

- **magick.css**: Tufte-style [sidenotes](#tufte-style-sidenotes), playful personality, well-commented code
- **LaTeX.css**: Academic typography, wide margins, optimized for technical content
- **Sakura**: Minimal duotone color palettes, rapid prototyping
- **Matcha**: Semantic hierarchy, CSS custom properties architecture
- **MVP.css**: Sensible defaults, zero configuration needed

## Features

### Complete Element Coverage

All semantic HTML5 elements are styled out of the box:

- Typography: headings, paragraphs, links, lists (ordered, unordered, description)
- Content: blockquotes, code blocks, tables, figures with captions
- Forms: inputs, textareas, selects, buttons, checkboxes, radio buttons, file uploads
- Media: images, video, audio, iframes
- Semantic: article, section, aside, header, footer, nav, details/summary

### Tufte-Style Sidenotes

Inspired by Edward Tufte's design principles, margin notes can be added using simple `<small>` elements within paragraphs.

**Desktop**: Notes appear in the right margin
**Mobile**: Notes appear inline with subtle styling

### Example

```html
<p>
  The framework handles reactivity through signals.
  <small>
    Signals are similar to reactive primitives in Solid.js and Vue 3's
    ref() system, but with a simpler API surface.
  </small>
  This approach keeps the mental model straightforward.
</p>
```

### Modular Type Scale

Font sizes use a 1.25 ratio (major third) for "harmonious" hierarchy:

- Base: `18px` (`1rem`)
- Scale: `0.889rem`, `1.125rem`, `1.266rem`, `1.424rem`, `1.802rem`, `2.027rem`, `2.566rem`
- Headings use larger sizes from the scale, body text uses base and smaller sizes

### Optimized Reading Width

Main content is constrained to approximately 70 characters per line, around the optimal range for comfortable reading.
Sidenotes extend into the right margin when space allows.

### Dark Mode Support

The stylesheet automatically switches to dark mode when the user's system preference is set to dark:

```css
@media (prefers-color-scheme: dark) {
  /* Dark theme colors applied automatically */
}
```

## Usage

### Basic Setup

Include the stylesheet in your HTML `<head>`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/src/styles/base.css">
    <title>My Document</title>
  </head>
  <body>
    <!-- Your markup -->
  </body>
</html>
```

### Example Document Structure

```html
<body>
  <header>
    <h1>Document Title</h1>
    <p>Subtitle or introduction</p>
  </header>

  <article>
    <h2>Section Heading</h2>
    <p>
      Your content flows naturally.
      <small>Add sidenotes for additional context.</small>
      The stylesheet handles all the styling.
    </p>

    <blockquote>
      <p>Quotes are styled with subtle backgrounds and borders.</p>
      <cite>Author Name</cite>
    </blockquote>

    <pre>
      <code>
        // Code blocks use monospace fonts
        const example = "syntax highlighting not included";
      </code>
    </pre>

    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tables</td>
          <td>Styled with zebra striping</td>
        </tr>
      </tbody>
    </table>
  </article>

  <footer>
    <p>Footer content, copyright, etc.</p>
  </footer>
</body>
```

### Forms

Forms get styling with focus states, required field indicators, and spacing between controls:

```html
<form>
  <fieldset>
    <legend>User Information</legend>

    <label for="name">Name</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>

    <label for="message">Message</label>
    <textarea id="message" name="message"></textarea>

    <button type="submit">Send Message</button>
    <input type="reset" value="Clear Form">
  </fieldset>
</form>
```

## Customization

### CSS Custom Properties

All design tokens are defined as CSS custom properties (CSS variables) in the `:root` selector. Override them to customize the appearance:

```css
:root {
  /* Change the accent color */
  --color-accent: #d63384;
  --color-accent-hover: #b02a6b;

  /* Adjust spacing */
  --space-md: 1.25rem;

  /* Change fonts */
  --font-sans: "Your Font", system-ui, sans-serif;

  /* Modify content width */
  --content-width: 60ch;
}
```

### Properties

**Typography**:

- `--font-sans`, `--font-serif`, `--font-mono`: Font families
- `--font-size-*`: Size scale from sm to 5xl
- `--line-height-tight`, `--line-height-base`, `--line-height-relaxed`

**Colors**:

- `--color-bg`: Background color
- `--color-bg-alt`: Alternate background (code blocks, table stripes)
- `--color-text`: Primary text color
- `--color-text-muted`: Secondary text color
- `--color-accent`: Accent color for links, buttons
- `--color-accent-hover`: Hover state for accent color
- `--color-border`: Border color
- `--color-code-bg`: Code block background
- `--color-mark`: Highlighted text background
- `--color-success`, `--color-warning`, `--color-error`: Semantic colors

**Spacing**:

- `--space-xs` through `--space-3xl`: Spacing scale

**Layout**:

- `--content-width`: Maximum width for readable content
- `--sidenote-width`: Width of margin notes
- `--sidenote-gap`: Space between content and sidenotes

**Effects**:

- `--shadow-sm`, `--shadow-md`, `--shadow-lg`: Box shadows
- `--radius-sm`, `--radius-md`, `--radius-lg`: Border radius
- `--transition-fast`, `--transition-base`: Transition durations

### Dark Mode Customization

Override dark mode colors specifically:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-accent: #f0f;
    --color-bg: #000;
  }
}
```

### Scoped Customization

Apply custom styling to specific sections without affecting the whole document:

```html
<style>
  .special-section {
    --color-accent: #e74c3c;
    --font-sans: "Georgia", serif;
  }
</style>

<div class="special-section">
  <h2>This section uses different colors and fonts</h2>
  <p>All nested elements inherit the custom properties.</p>
</div>
```

## Browser Support

Volt CSS uses modern CSS features and targets evergreen browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Specifically relies on:

- CSS custom properties (CSS variables)
- CSS Grid and Flexbox
- `:has()` selector (for sidenote positioning)
- `prefers-color-scheme` media query

For older browsers, content remains readable but may lack advanced layout features like margin sidenotes.

## Accessibility

- All color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Clear, visible focus states for keyboard navigation
- Encourages logical heading hierarchy, landmark regions, and form labels
- Works on all devices and respects user font size preferences
- No animations that could trigger vestibular disorders

## Size & Performance

The complete stylesheet is approximately 15KB uncompressed, 3-4KB when gzipped

For maximum performance:

1. Serve with compression (gzip or brotli)
2. Set cache headers
3. Consider inlining in `<style>` tags for above-the-fold content on single-page sites

## Design Decisions

### Sans-Serif

While serif fonts are traditional for long-form reading, modern screens render sans-serif fonts with excellent clarity. The system font stack ensures fast loading and familiar reading experience while maintaining personality through spacing, hierarchy, and layout.

### `<small>` Sidenotes?

The `<small>` element semantically represents side comments and fine print, making it a natural choice for sidenotes. This approach requires no custom attributes or classes, keeping markup clean and portable.

### 70 Characters Line Length

Research shows optimal reading comprehension occurs with 45-75 characters per line. 70 characters balances readability with efficient use of screen space.

### Automatic Dark Mode

Respecting user preferences improves accessibility and reduces eye strain. Automatic theme switching via `prefers-color-scheme` requires zero configuration while providing the best experience for each user.

## License

Part of the Volt.js project. MIT licensed.

## Further Reading

- [Tufte CSS](https://edwardtufte.github.io/tufte-css/)
- [Practical Typography by Matthew Butterick](https://practicaltypography.com/)
- [The Elements of Typographic Style Applied to the Web](http://webtypography.net/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
