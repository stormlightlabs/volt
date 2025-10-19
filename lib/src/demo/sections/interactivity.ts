/**
 * Interactivity Section
 * Demonstrates dialogs and event-based interactions
 */

import * as dom from "../utils";

export function createInteractivitySection(): HTMLElement {
  return dom.article(
    { id: "interactivity" },
    dom.h2(null, "Dialogs & Interactivity"),
    dom.section(
      null,
      dom.h3(null, "Native Dialog Element"),
      dom.p(
        null,
        "The HTML ",
        dom.code(null, "<dialog>"),
        " element provides semantic modal functionality.",
        dom.small(
          null,
          "Modern browsers support the dialog element natively, providing built-in accessibility features and keyboard handling (ESC to close, focus trapping, etc.).",
        ),
        " Volt CSS styles it elegantly, and Volt.js handles the interaction.",
      ),
      dom.button({ "data-volt-on-click": "openDialog" }, "Open Dialog"),
      dom.p({ "data-volt-if": "dialogMessage.get()", "data-volt-text": "dialogMessage" }),
      dom.dialog(
        { id: "demo-dialog" },
        dom.article(
          null,
          dom.header(
            null,
            dom.h3(null, "Dialog Demo"),
            dom.button({
              "data-volt-on-click": "closeDialog",
              "aria-label": "Close",
              style: "float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer;",
            }, "×"),
          ),
          dom.form(
            { "data-volt-on-submit": "submitDialog" },
            ...dom.labelFor("Enter something:", {
              type: "text",
              id: "dialog-input",
              "data-volt-model": "dialogInput",
              placeholder: "Type here...",
              required: true,
            }),
            dom.footer(
              { style: "display: flex; gap: 1rem; justify-content: flex-end;" },
              dom.button({ type: "button", "data-volt-on-click": "closeDialog" }, "Cancel"),
              dom.button({ type: "submit" }, "Submit"),
            ),
          ),
        ),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Button Interactions"),
      dom.p(
        null,
        "Count: ",
        dom.strong({ "data-volt-text": "count" }, "0"),
        " | Doubled: ",
        dom.strong({ "data-volt-text": "doubled" }, "0"),
      ),
      dom.div(
        { style: "display: flex; gap: 0.5rem; flex-wrap: wrap;" },
        ...dom.buttons([["Increment", "increment"], ["Decrement", "decrement"], ["Reset", "reset"], [
          "Update Header",
          "updateMessage",
        ]]),
      ),
    ),
  );
}
