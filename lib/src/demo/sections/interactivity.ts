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
      dom.button({ "data-volt-on-click": "$helpers.openDialog('demo-dialog'); dialogMessage.set(''); dialogInput.set('')" }, "Open Dialog"),
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
              "data-volt-on-submit": "$event.preventDefault(); dialogMessage.set('You entered: ' + dialogInput); setTimeout(() => $helpers.closeDialog('demo-dialog'), 2000)",
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
        ...dom.buttons([
          ["Increment", "count.set(count + 1)"],
          ["Decrement", "count.set(count - 1)"],
          ["Reset", "count.set(0)"],
          ["Update Header", "message.set('Count is now ' + count)"],
        ]),
      ),
    ),
    // TODO: Eventually move tooltips to a dedicated CSS section/page
    dom.section(
      null,
      dom.h3(null, "Tooltips"),
      dom.p(null, "VoltX CSS includes pure-CSS tooltips with zero JavaScript. Try hovering over these examples:"),
      dom.p(
        null,
        dom.abbr({ "data-vx-tooltip": "Tooltips appear on top by default", "data-placement": "top" }, "Top"),
        " · ",
        dom.abbr({ "data-vx-tooltip": "Tooltips can appear on the right", "data-placement": "right" }, "Right"),
        " · ",
        dom.abbr({ "data-vx-tooltip": "Tooltips can appear on the bottom", "data-placement": "bottom" }, "Bottom"),
        " · ",
        dom.abbr({ "data-vx-tooltip": "Tooltips can appear on the left", "data-placement": "left" }, "Left"),
      ),
      dom.p(
        null,
        dom.small(
          null,
          "Tooltips use the data-vx-tooltip attribute and are styled with pure CSS. They automatically hide on mobile devices.",
        ),
      ),
    ),
  );
}
