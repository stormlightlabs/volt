/**
 * Demo module for showcasing Volt.js features and volt.css styling
 *
 * This module creates the entire demo structure programmatically using DOM APIs,
 * demonstrating how to build complex UIs with Volt.js.
 */

import { persistPlugin } from "$plugins/persist";
import { scrollPlugin } from "$plugins/scroll";
import { urlPlugin } from "$plugins/url";
import { computed, effect, mount, registerPlugin, signal } from "$volt";
import { createFormsSection } from "./sections/forms";
import { createInteractivitySection } from "./sections/interactivity";
import { createPluginsSection } from "./sections/plugins";
import { createReactivitySection } from "./sections/reactivity";
import { createTypographySection } from "./sections/typography";
import * as dom from "./utils";

registerPlugin("persist", persistPlugin);
registerPlugin("scroll", scrollPlugin);
registerPlugin("url", urlPlugin);

const message = signal("Welcome to the Volt.js Demo");
const count = signal(0);
const doubled = computed(() => count.get() * 2);

const formData = signal({ name: "", email: "", bio: "", country: "us", newsletter: false, plan: "free" });

const todos = signal([{ id: 1, text: "Learn Volt.js", done: false }, { id: 2, text: "Build an app", done: false }, {
  id: 3,
  text: "Ship to production",
  done: false,
}]);

const newTodoText = signal("");
let todoIdCounter = 4;

const showAdvanced = signal(false);

const isActive = signal(true);
const isHighlighted = signal(false);

const dialogMessage = signal("");
const dialogInput = signal("");

const persistedCount = signal(0);
const scrollPosition = signal(0);
const urlParam = signal("");

const activeTodos = computed(() => todos.get().filter((todo) => !todo.done));
const completedTodos = computed(() => todos.get().filter((todo) => todo.done));

effect(() => {
  console.log("Count changed:", count.get());
});

const increment = () => {
  count.set(count.get() + 1);
};

const decrement = () => {
  count.set(count.get() - 1);
};

const reset = () => {
  count.set(0);
};

const updateMessage = () => {
  message.set(`Count is now ${count.get()}`);
};

const openDialog = () => {
  const dialog = document.querySelector("#demo-dialog") as HTMLDialogElement;
  if (dialog) {
    dialogMessage.set("");
    dialogInput.set("");
    dialog.showModal();
  }
};

const closeDialog = () => {
  const dialog = document.querySelector("#demo-dialog") as HTMLDialogElement;
  if (dialog) {
    dialog.close();
  }
};

const submitDialog = (event: Event) => {
  event.preventDefault();
  dialogMessage.set(`You entered: ${dialogInput.get()}`);
  setTimeout(closeDialog, 2000);
};

const addTodo = () => {
  const text = newTodoText.get().trim();
  if (text) {
    todos.set([...todos.get(), { id: todoIdCounter++, text, done: false }]);
    newTodoText.set("");
  }
};

const toggleTodo = (id: number) => {
  todos.set(todos.get().map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
};

const removeTodo = (id: number) => {
  todos.set(todos.get().filter((todo) => todo.id !== id));
};

const handleFormSubmit = (event: Event) => {
  event.preventDefault();
  console.log("Form submitted:", formData.get());
  alert(`Form submitted! Check console for data.`);
};

const toggleAdvanced = () => {
  showAdvanced.set(!showAdvanced.get());
};

const toggleActive = () => {
  isActive.set(!isActive.get());
};

const toggleHighlight = () => {
  isHighlighted.set(!isHighlighted.get());
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const scrollToSection = (id: string) => {
  const element = document.querySelector(`#${id}`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

export const demoScope = {
  message,
  count,
  doubled,
  formData,
  todos,
  newTodoText,
  activeTodos,
  completedTodos,
  showAdvanced,
  isActive,
  isHighlighted,
  dialogMessage,
  dialogInput,
  persistedCount,
  scrollPosition,
  urlParam,
  increment,
  decrement,
  reset,
  updateMessage,
  openDialog,
  closeDialog,
  submitDialog,
  addTodo,
  toggleTodo,
  removeTodo,
  handleFormSubmit,
  toggleAdvanced,
  toggleActive,
  toggleHighlight,
  scrollToTop,
  scrollToSection,
};

const buildNav = () =>
  dom.nav(
    null,
    dom.a({ href: "#typography" }, "Typography"),
    " | ",
    dom.a({ href: "#interactivity" }, "Interactivity"),
    " | ",
    dom.a({ href: "#forms" }, "Forms"),
    " | ",
    dom.a({ href: "#reactivity" }, "Reactivity"),
    " | ",
    dom.a({ href: "#plugins" }, "Plugins"),
  );

function buildDemoStructure(): HTMLElement {
  return dom.div(
    null,
    dom.header(
      null,
      dom.h1({ "data-volt-text": "message" }, "Loading..."),
      dom.p(
        null,
        "A comprehensive demo showcasing Volt.js reactive framework and Volt CSS classless styling.",
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
      createTypographySection(),
      createInteractivitySection(),
      createFormsSection(),
      createReactivitySection(),
      createPluginsSection(),
    ),
    dom.footer(
      null,
      dom.p(
        null,
        "Built with ",
        dom.a({ href: "https://github.com/stormlightlabs/volt" }, "Volt.js"),
        " - A lightweight, reactive hypermedia framework",
      ),
      dom.p(
        null,
        "This demo showcases both Volt.js reactive features and Volt CSS classless styling. View source to see how everything works!",
      ),
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

  mount(app, demoScope);

  window.addEventListener("scroll", () => {
    scrollPosition.set(window.scrollY);
  });
}
