/**
 * Demo module for showcasing VoltX features and voltx.css styling
 *
 * This module creates the entire demo structure programmatically using DOM APIs, then uses charge() to mount it declaratively.
 */

import { charge } from "$core/charge";
import { isSignal } from "$core/shared";
import { initNavigationListener } from "$plugins/navigate";
import { persistPlugin } from "$plugins/persist";
import { scrollPlugin } from "$plugins/scroll";
import { shiftPlugin } from "$plugins/shift";
import { surgePlugin } from "$plugins/surge";
import { urlPlugin } from "$plugins/url";
import type { Signal } from "$types/volt";
import { registerPlugin } from "$volt";
import { createAnimationsSection } from "./sections/animations";
import { createCssSection } from "./sections/css";
import { createFormsSection } from "./sections/forms";
import { createHomeSection } from "./sections/home";
import { createInteractivitySection } from "./sections/interactivity";
import { createPluginsSection } from "./sections/plugins";
import { createReactivitySection } from "./sections/reactivity";
import * as dom from "./utils";

registerPlugin("persist", persistPlugin);
registerPlugin("scroll", scrollPlugin);
registerPlugin("url", urlPlugin);
registerPlugin("surge", surgePlugin);
registerPlugin("shift", shiftPlugin);

/**
 * Helper functions for DOM operations that can't be expressed declaratively
 * These are added to the scope so they can be called from data-volt-on-* attributes
 */
const helpers = {
  openDialog(id: string) {
    const dialog = document.querySelector(`#${id}`) as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  },

  closeDialog(id: string) {
    const dialog = document.querySelector(`#${id}`) as HTMLDialogElement;
    if (dialog) {
      dialog.close();
    }
  },

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  scrollToSection(id: string) {
    const element = document.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  },

  handleFormSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log("Form submitted:", data);
    alert("Form submitted! Check console for data.");
  },
};

const buildNav = () =>
  dom.nav(
    null,
    dom.a({ "data-volt-navigate": "", href: "/" }, "Home"),
    " | ",
    dom.a({ "data-volt-navigate": "", href: "/css" }, "CSS"),
    " | ",
    dom.a({ "data-volt-navigate": "", href: "/interactivity" }, "Interactivity"),
    " | ",
    dom.a({ "data-volt-navigate": "", href: "/forms" }, "Forms"),
    " | ",
    dom.a({ "data-volt-navigate": "", href: "/reactivity" }, "Reactivity"),
    " | ",
    dom.a({ "data-volt-navigate": "", href: "/plugins" }, "Plugins"),
    " | ",
    dom.a({ "data-volt-navigate": "", href: "/animations" }, "Animations"),
  );

/**
 * Get the current page from the URL pathname
 */
function getCurrentPageFromPath(): string {
  const path = globalThis.location.pathname;
  if (path === "/" || path === "") return "home";
  return path.slice(1);
}

function buildDemoStructure(): HTMLElement {
  const initialState = {
    currentPage: getCurrentPageFromPath(),
    message: "Welcome to the VoltX.js Demo",
    count: 0,
    formData: { name: "", email: "", bio: "", country: "us", newsletter: false, plan: "free" },
    todos: [{ id: 1, text: "Learn VoltX.js", done: false }, { id: 2, text: "Build an app", done: false }, {
      id: 3,
      text: "Ship to production",
      done: false,
    }],
    newTodoText: "",
    todoIdCounter: 4,
    showAdvanced: false,
    isActive: true,
    isHighlighted: false,
    dialogMessage: "",
    dialogInput: "",
    persistedCount: 0,
    scrollPosition: 0,
    urlParam: "",
    showFade: false,
    showSlideDown: false,
    showScale: false,
    showBlur: false,
    showSlowFade: false,
    showDelayedSlide: false,
    showGranular: false,
    showCombined: false,
    triggerBounce: 0,
    triggerShake: 0,
    triggerFlash: 0,
    triggerTripleBounce: 0,
    triggerLongShake: 0,
    spinningGear: true,
  };

  return dom.div(
    {
      "data-volt": "",
      "data-volt-state": JSON.stringify(initialState),
      "data-volt-computed:doubled": "count * 2",
      "data-volt-computed:active-todos": "todos.filter(t => !t.done)",
      "data-volt-computed:completed-todos": "todos.filter(t => t.done)",
    },
    dom.header(
      null,
      dom.h1({ "data-volt-text": "message" }, "Loading..."),
      dom.p(
        null,
        "A comprehensive demo showcasing VoltX.js reactive framework and Volt CSS classless styling.",
        dom.small(
          null,
          "This demo demonstrates both the framework's reactive capabilities and the elegant, semantic styling of Volt CSS. No CSS classes needed!",
        ),
        buildNav(),
      ),
    ),
    dom.el(
      "main",
      null,
      dom.div({ "data-volt-if": "currentPage === 'home'" }, createHomeSection()),
      dom.div({ "data-volt-if": "currentPage === 'css'" }, createCssSection()),
      dom.div({ "data-volt-if": "currentPage === 'interactivity'" }, createInteractivitySection()),
      dom.div({ "data-volt-if": "currentPage === 'forms'" }, createFormsSection()),
      dom.div({ "data-volt-if": "currentPage === 'reactivity'" }, createReactivitySection()),
      dom.div({ "data-volt-if": "currentPage === 'plugins'" }, createPluginsSection()),
      dom.div({ "data-volt-if": "currentPage === 'animations'" }, createAnimationsSection()),
    ),
    dom.footer(
      null,
      dom.p(
        null,
        "Built with ",
        dom.a({ href: "https://github.com/stormlightlabs/volt" }, "VoltX.js"),
        " - A lightweight, reactive hypermedia framework",
      ),
      dom.p(null, "This demo showcases both VoltX's reactive features and VoltX.css' classless styling."),
    ),
  );
}

export function setupDemo() {
  const app = document.querySelector("#app");
  if (!app) {
    console.error("App container not found");
    return;
  }

  const demoStructure = buildDemoStructure();
  app.append(demoStructure);

  const chargeResult = charge();
  const cleanupNav = initNavigationListener();

  const rootScope = chargeResult.roots[0]?.scope;
  if (!rootScope) {
    console.error("Failed to get root scope from charge result");
    return;
  }

  // Add helper functions to scope (not serializable, so added after charge)
  rootScope.$helpers = helpers;

  const handleNavigate = (event: Event) => {
    const customEvent = event as CustomEvent;
    const url = customEvent.detail?.url || globalThis.location.pathname;
    const page = url === "/" || url === "" ? "home" : url.slice(1);

    const currentPageSignal = rootScope.currentPage as Signal<string>;
    if (currentPageSignal && isSignal(currentPageSignal)) {
      currentPageSignal.set(page);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handlePopstate = () => {
    const page = getCurrentPageFromPath();
    const currentPageSignal = rootScope.currentPage as Signal<string>;
    if (currentPageSignal && isSignal(currentPageSignal)) {
      currentPageSignal.set(page);
    }
  };

  const handleScroll = () => {
    const scrollPositionSignal = rootScope.scrollPosition as Signal<number>;
    if (scrollPositionSignal && isSignal(scrollPositionSignal)) {
      scrollPositionSignal.set(window.scrollY);
    }
  };

  globalThis.addEventListener("volt:navigate", handleNavigate);
  globalThis.addEventListener("volt:popstate", handlePopstate);
  window.addEventListener("scroll", handleScroll);

  return () => {
    chargeResult.cleanup();
    cleanupNav();
    globalThis.removeEventListener("volt:navigate", handleNavigate);
    globalThis.removeEventListener("volt:popstate", handlePopstate);
    window.removeEventListener("scroll", handleScroll);
  };
}
