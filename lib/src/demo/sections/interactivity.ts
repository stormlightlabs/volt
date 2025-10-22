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
        " VoltX CSS styles it elegantly, and VoltX.js handles the interaction.",
      ),
      dom.button({
        "data-volt-on-click": "$helpers.openDialog('demo-dialog'); dialogMessage.set(''); dialogInput.set('')",
      }, "Open Dialog"),
      dom.p({ "data-volt-if": "dialogMessage", "data-volt-text": "dialogMessage" }),
      dom.dialog(
        { id: "demo-dialog" },
        dom.article(
          null,
          dom.header(
            null,
            dom.h3(null, "Dialog Demo"),
            dom.button({ "data-volt-on-click": "$helpers.closeDialog('demo-dialog')", "aria-label": "Close" }, "×"),
          ),
          dom.form(
            {
              id: "demo-dialog-form",
              "data-volt-on-submit":
                "$event.preventDefault(); dialogMessage.set('You entered: ' + dialogInput); setTimeout(() => $helpers.closeDialog('demo-dialog'), 2000)",
            },
            ...dom.labelFor("Enter something:", {
              type: "text",
              id: "dialog-input",
              "data-volt-model": "dialogInput",
              placeholder: "Type here...",
              required: true,
            }),
          ),
          dom.footer(
            null,
            dom.button({ type: "button", "data-volt-on-click": "$helpers.closeDialog('demo-dialog')" }, "Cancel"),
            dom.button({ type: "submit", form: "demo-dialog-form" }, "Submit"),
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
        ...dom.buttons([["Increment", "count.set(count + 1)"], ["Decrement", "count.set(count - 1)"], [
          "Reset",
          "count.set(0)",
        ], ["Update Header", "message.set('Count is now ' + count)"]]),
      ),
    ),
  );
}
