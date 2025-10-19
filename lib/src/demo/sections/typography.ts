/**
 * Typography & Layout Section
 * Demonstrates Volt CSS typography features including Tufte-style sidenotes
 */

import * as dom from "../utils";

export function createTypographySection(): HTMLElement {
  return dom.article(
    { id: "typography" },
    dom.h2(null, "Typography & Layout"),
    dom.section(
      null,
      dom.h3(null, "Headings & Hierarchy"),
      dom.p(
        null,
        "Volt CSS provides a harmonious type scale based on a 1.25 ratio (major third).",
        dom.small(
          null,
          "The modular scale creates visual hierarchy without requiring any CSS classes. Font sizes range from 0.889rem to 2.566rem.",
        ),
        " All headings automatically receive appropriate sizing, spacing, and weight.",
      ),
      dom.h4(null, "Level 4 Heading"),
      dom.p(null, "Demonstrates the fourth level of hierarchy."),
      dom.h5(null, "Level 5 Heading"),
      dom.p(null, "Even smaller, but still distinct and readable."),
      dom.h6(null, "Level 6 Heading"),
      dom.p(null, "The smallest heading level in the hierarchy."),
    ),
    dom.section(
      null,
      dom.h3(null, "Tufte-Style Sidenotes"),
      dom.p(
        null,
        "One of the signature features of Volt CSS is Tufte-style sidenotes.",
        dom.small(
          null,
          "Edward Tufte is renowned for his work on information design and data visualization. His books feature extensive use of margin notes that provide context without interrupting the main narrative flow.",
        ),
        " These appear in the margin on desktop and inline on mobile devices.",
      ),
      dom.p(
        null,
        "Sidenotes are created using the semantic ",
        dom.code(null, "<small>"),
        " element.",
        dom.small(
          null,
          "The <small> element represents side comments and fine print, making it semantically appropriate for sidenotes. No custom attributes needed!",
        ),
        " This keeps markup clean and portable while maintaining semantic meaning.",
      ),
      dom.p(
        null,
        "The responsive behavior ensures readability across all devices.",
        dom.small(
          null,
          "On narrow screens, sidenotes appear inline with subtle styling. On wider screens (≥1200px), they float into the right margin.",
        ),
        " Try resizing your browser to see the effect.",
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Lists"),
      dom.p(null, "Both ordered and unordered lists are styled with appropriate spacing:"),
      dom.h4(null, "Unordered List"),
      dom.ul(
        null,
        ...dom.repeat(dom.li, [
          "Reactive signals for state management",
          "Computed values derived from signals",
          "Effect system for side effects",
          "Declarative data binding via attributes",
        ]),
      ),
      dom.h4(null, "Ordered List"),
      dom.ol(
        null,
        ...dom.repeat(dom.li, [
          "Define your signals and computed values",
          "Write semantic HTML markup",
          "Add data-volt-* attributes for reactivity",
          "Mount the scope and watch the magic happen",
        ]),
      ),
      dom.h4(null, "Description List"),
      dom.dl(
        null,
        ...dom.kv([["Signal", "A reactive primitive that holds a value and notifies subscribers of changes."], [
          "Computed",
          "A derived value that automatically updates when its dependencies change.",
        ], ["Effect", "A side effect that runs when its reactive dependencies change."]]),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Blockquotes & Citations"),
      dom.blockquote(
        null,
        dom.p(
          null,
          "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
        ),
        dom.cite(null, "Antoine de Saint-Exupéry"),
      ),
      dom.blockquote(
        null,
        dom.p(
          null,
          "The best programs are written so that computing machines can perform them quickly and so that human beings can understand them clearly.",
        ),
        dom.cite(null, "Donald Knuth"),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Code & Preformatted Text"),
      dom.p(null, "Inline code uses ", dom.code(null, "monospace font"), " for clarity."),
      dom.p(null, "Code blocks preserve formatting and provide syntax-appropriate styling:"),
      dom.pre(
        null,
        dom.code(
          null,
          `import { signal, computed, mount } from 'volt';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

mount(document.querySelector('#app'), {
  count,
  doubled,
  increment: () => count.set(count.get() + 1)
});`,
        ),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Tables"),
      dom.p(
        null,
        "Tables receive zebra striping and responsive styling automatically.",
        dom.small(
          null,
          "Tables use alternating row colors for improved scannability. On mobile, they remain scrollable horizontally if needed.",
        ),
      ),
      dom.table(
        null,
        dom.thead(null, dom.tr(null, ...dom.repeat(dom.th, ["Feature", "Volt.js", "Framework X", "Framework Y"]))),
        dom.tbody(
          null,
          dom.tr(null, ...dom.repeat(dom.td, ["Bundle Size", "< 15KB gzipped", "~40KB", "~30KB"])),
          dom.tr(null, dom.td(null, "Virtual DOM"), dom.td(null, "No"), dom.td(null, "Yes"), dom.td(null, "Yes")),
          dom.tr(null, ...dom.repeat(dom.td, ["Reactive System", "Signals", "Proxy-based", "Observable"])),
          dom.tr(null, ...dom.repeat(dom.td, ["Learning Curve", "Gentle", "Moderate", "Steep"])),
        ),
      ),
    ),
  );
}
