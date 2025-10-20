/**
 * Plugins Section
 * Demonstrates persist, scroll, and URL plugins
 */

import * as dom from "../utils";

export function createPluginsSection(): HTMLElement {
  return dom.article(
    { id: "plugins" },
    dom.h2(null, "Plugin Demos"),
    dom.section(
      null,
      dom.h3(null, "Persist Plugin"),
      dom.p(
        null,
        "The persist plugin syncs signals with localStorage, sessionStorage, or IndexedDB.",
        dom.small(
          null,
          "Try incrementing the counter, then refresh the page. The value persists! This uses localStorage by default.",
        ),
      ),
      dom.p(null, "Persisted Count: ", dom.strong({ "data-volt-text": "persistedCount" }, "0")),
      dom.div(
        { "data-volt-persist:persistedCount": "localStorage" },
        dom.button({ "data-volt-on-click": "persistedCount.set(persistedCount.get() + 1)" }, "Increment Persisted"),
        " ",
        dom.button({ "data-volt-on-click": "persistedCount.set(0)" }, "Reset Persisted"),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Scroll Plugin"),
      dom.p(
        null,
        "The scroll plugin provides scroll tracking and smooth scrolling utilities.",
        dom.small(
          null,
          "Current scroll position is tracked in real-time. The scroll position updates as you scroll the page, and you can jump to sections smoothly.",
        ),
      ),
      dom.p(
        null,
        "Current Scroll Position: ",
        dom.strong({ "data-volt-text": "Math.round(scrollPosition.get())" }, "0"),
        "px",
      ),
      dom.div(
        { style: "display: flex; gap: 0.5rem; flex-wrap: wrap;" },
        dom.button({ "data-volt-on-click": "scrollToTop" }, "Scroll to Top"),
        dom.button({ "data-volt-on-click": "scrollToSection('typography')" }, "Go to Typography"),
        dom.button({ "data-volt-on-click": "scrollToSection('forms')" }, "Go to Forms"),
        dom.button({ "data-volt-on-click": "scrollToSection('plugins')" }, "Go to Plugins"),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "URL Plugin"),
      dom.p(
        null,
        "The URL plugin syncs signals with URL query parameters or hash.",
        dom.small(
          null,
          "Try typing in the input below. Notice how the URL updates automatically! Bookmark the URL and return later - the state is preserved.",
        ),
      ),
      dom.div(
        // FIXME: this needs to be constrained in the stylesheet to allow for the sidenotes
        { "data-volt-url:urlParam": "query", "style": "max-width: var(--content-width);" },
        ...dom.labelFor("URL Parameter (synced with ?urlParam=...)", {
          type: "text",
          id: "url-input",
          "data-volt-model": "urlParam",
          placeholder: "Type to update URL...",
        }),
        dom.p(null, "Current value: ", dom.strong({ "data-volt-text": "urlParam.get() || '(empty)'" }, "Loading...")),
      ),
    ),
  );
}
