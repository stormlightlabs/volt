/**
 * Home Section
 * Landing page with framework overview and feature highlights
 */

import * as dom from "../utils";

export function createHomeSection(): HTMLElement {
  return dom.article(
    { id: "home" },
    dom.section(
      null,
      dom.h2(null, "VoltX.js: Declarative Reactivity for the Modern Web"),
      dom.p(
        null,
        "VoltX.js is a lightweight reactive framework that brings signal-based reactivity to HTML.",
        dom.small(
          null,
          "Build rich, interactive applications using declarative markup without writing JavaScript. No virtual DOM, no build step, no dependencies—just pure reactive primitives and HTML attributes.",
        ),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Why VoltX.js?"),
      dom.dl(
        null,
        ...dom.kv([
          ["< 15KB Gzipped", "Smaller than most icon libraries. Ships only what you need with zero dependencies."],
          [
            "Declarative-First",
            "Build entire applications using only HTML attributes. JavaScript is optional for complex logic.",
          ],
          [
            "Signal-Based Reactivity",
            "Fine-grained reactivity that updates only what changed. No virtual DOM diffing.",
          ],
          ["Zero Build Step", "Import from npm or CDN and start building. No webpack, no rollup, no configuration."],
          ["Progressive Enhancement", "Works with server-rendered HTML. Add reactivity incrementally where needed."],
          ["Standards-Based", "Built on standard DOM APIs. No proprietary JSX or template syntax."],
        ]),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Quick Start"),
      dom.p(null, "Get started with VoltX.js in seconds:"),
      dom.pre(
        null,
        dom.code(
          null,
          `<!-- Include VoltX.js from CDN -->
<script type="module">
  import { charge } from 'https://esm.sh/voltx.js';
  charge();
</script>

<!-- Declare reactive state in HTML -->
<div data-volt data-volt-state='{"count": 0}'
     data-volt-computed:doubled="count * 2">
  <p>Count: <span data-volt-text="count"></span></p>
  <p>Doubled: <span data-volt-text="doubled"></span></p>
  <button data-volt-on-click="count.set(count + 1)">
    Increment
  </button>
</div>`,
        ),
      ),
      dom.p(
        null,
        "That's it! No build step, no configuration, no JavaScript beyond the import. ",
        dom.strong(null, "The state, reactivity, and interactions are all declared in HTML."),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Explore the Features"),
      dom.p(null, "Navigate through the demo to see VoltX.js in action:"),
      dom.ul(
        null,
        dom.li(
          null,
          dom.strong(null, "Typography & CSS"),
          " - Explore Volt CSS, our classless CSS framework with Tufte-style sidenotes",
        ),
        dom.li(
          null,
          dom.strong(null, "Interactivity"),
          " - See dialogs, buttons, and event handling with declarative bindings",
        ),
        dom.li(null, dom.strong(null, "Forms"), " - Two-way data binding with all standard form elements"),
        dom.li(null, dom.strong(null, "Reactivity"), " - Conditional rendering, list rendering, and computed values"),
        dom.li(null, dom.strong(null, "Plugins"), " - Persistence, scroll management, URL synchronization, and more"),
        dom.li(
          null,
          dom.strong(null, "Animations"),
          " - Built-in transitions and keyframe animations with zero configuration",
        ),
      ),
      dom.p(null, "Use the navigation above to explore each section."),
    ),
    dom.section(
      null,
      dom.h3(null, "Learn More"),
      dom.p(
        null,
        dom.a({ href: "https://github.com/stormlightlabs/volt" }, "GitHub Repository"),
        " | ",
        dom.a({ href: "https://stormlightlabs.github.io/volt" }, "Documentation"),
        " | ",
        dom.a({ href: "https://www.npmjs.com/package/voltx.js" }, "npm Package"),
        " | ",
        dom.a({ href: "https://jsr.io/@voltx/core" }, "JSR Package"),
      ),
    ),
  );
}
