/**
 * Reactivity Section
 * Demonstrates conditional rendering, list rendering, and class bindings
 */

import * as dom from "../utils";

export function createReactivitySection(): HTMLElement {
  const style = dom.el(
    "style",
    null,
    `.active {
  color: var(--color-accent);
  font-weight: bold;
}
.highlight {
  background: var(--color-mark);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}`,
  );

  return dom.article(
    { id: "reactivity" },
    dom.h2(null, "Reactivity Features"),
    dom.section(
      null,
      dom.h3(null, "Conditional Rendering"),
      dom.p(
        null,
        "Use ",
        dom.code(null, "data-volt-if"),
        " and ",
        dom.code(null, "data-volt-else"),
        " for conditional display:",
      ),
      dom.button(
        { "data-volt-on-click": "toggleAdvanced" },
        dom.span({ "data-volt-text": "showAdvanced.get() ? 'Hide' : 'Show'" }, "Show"),
        " Advanced Options",
      ),
      dom.div(
        { "data-volt-if": "showAdvanced.get()" },
        dom.h4(null, "Advanced Configuration"),
        dom.p(null, "These options are only visible when advanced mode is enabled."),
        dom.labelWith("Enable debug mode", { type: "checkbox" }),
        dom.labelWith("Use experimental features", { type: "checkbox" }),
      ),
      dom.div(
        { "data-volt-else": true },
        dom.p(null, dom.em(null, "Advanced options are hidden. Click the button above to reveal them.")),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "List Rendering"),
      dom.p(
        null,
        "Use ",
        dom.code(null, "data-volt-for"),
        " to render dynamic lists.",
        dom.small(
          null,
          `The syntax is "item in items" where items is a signal or expression. Each item gets its own scope with access to the item data and parent scope.`,
        ),
      ),
      dom.div(
        null,
        dom.input({
          type: "text",
          "data-volt-model": "newTodoText",
          placeholder: "New todo...",
          "data-volt-on-keydown": "$event.key === 'Enter' ? addTodo() : null",
        }),
        dom.button({ "data-volt-on-click": "addTodo" }, "Add Todo"),
      ),
      dom.h4(null, "Active Todos (", dom.span({ "data-volt-text": "activeTodos.get().length" }, "0"), ")"),
      dom.ul(
        null,
        dom.li(
          { "data-volt-for": "todo in todos.get().filter(t => !t.done)" },
          dom.input({ type: "checkbox", "data-volt-on-change": "toggleTodo(todo.id)" }),
          " ",
          dom.span({ "data-volt-text": "todo.text" }, "Todo item"),
          " ",
          dom.button({ "data-volt-on-click": "removeTodo(todo.id)" }, "Remove"),
        ),
      ),
      dom.h4(null, "Completed Todos (", dom.span({ "data-volt-text": "completedTodos.get().length" }, "0"), ")"),
      dom.ul(
        null,
        dom.li(
          { "data-volt-for": "todo in todos.get().filter(t => t.done)" },
          dom.input({ type: "checkbox", checked: true, "data-volt-on-change": "toggleTodo(todo.id)" }),
          " ",
          dom.del({ "data-volt-text": "todo.text" }, "Todo item"),
          " ",
          dom.button({ "data-volt-on-click": "removeTodo(todo.id)" }, "Remove"),
        ),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Class Bindings"),
      dom.p(null, "Toggle CSS classes reactively using ", dom.code(null, "data-volt-class"), ":"),
      dom.p(
        { "data-volt-class": "{ active: isActive.get(), highlight: isHighlighted.get() }" },
        "This paragraph has dynamic classes. Try the buttons below!",
      ),
      dom.button(
        { "data-volt-on-click": "toggleActive" },
        "Toggle Active (currently: ",
        dom.span({ "data-volt-text": "isActive.get() ? 'ON' : 'OFF'" }, "OFF"),
        ")",
      ),
      " ",
      dom.button(
        { "data-volt-on-click": "toggleHighlight" },
        "Toggle Highlight (currently: ",
        dom.span({ "data-volt-text": "isHighlighted.get() ? 'ON' : 'OFF'" }, "OFF"),
        ")",
      ),
      style,
    ),
  );
}
