/**
 * Forms Section
 * Demonstrates form elements and two-way data binding
 */

import * as dom from "../utils";

export function createFormsSection(): HTMLElement {
  return dom.article(
    { id: "forms" },
    dom.h2(null, "Forms & Two-Way Binding"),
    dom.section(
      null,
      dom.h3(null, "Complete Form Example"),
      dom.p(
        null,
        "The ",
        dom.code(null, "data-volt-model"),
        " attribute provides two-way data binding.",
        dom.small(
          null,
          "Changes in the input automatically update the signal, and changes to the signal automatically update the input. No manual event handlers needed!",
        ),
      ),
      dom.form(
        { "data-volt-on-submit": "handleFormSubmit" },
        dom.fieldset(
          null,
          dom.legend(null, "User Information"),
          ...dom.labelFor("Name", {
            type: "text",
            id: "name",
            "data-volt-model": "formData.name",
            placeholder: "John Doe",
            required: true,
          }),
          ...dom.labelFor("Email", {
            type: "email",
            id: "email",
            "data-volt-model": "formData.email",
            placeholder: "john@example.com",
            required: true,
          }),
          dom.label({ for: "bio" }, "Bio"),
          dom.textarea({
            id: "bio",
            "data-volt-model": "formData.bio",
            placeholder: "Tell us about yourself...",
            rows: "4",
          }),
          dom.label({ for: "country" }, "Country"),
          dom.select(
            { id: "country", "data-volt-model": "formData.country" },
            ...dom.options([["us", "United States"], ["uk", "United Kingdom"], ["ca", "Canada"], ["au", "Australia"], [
              "other",
              "Other",
            ]]),
          ),
          dom.labelWith("Subscribe to newsletter", { type: "checkbox", "data-volt-model": "formData.newsletter" }),
          dom.fieldset(
            null,
            dom.legend(null, "Plan"),
            dom.labelWith("Free", { type: "radio", name: "plan", value: "free", "data-volt-model": "formData.plan" }),
            dom.labelWith("Pro", { type: "radio", name: "plan", value: "pro", "data-volt-model": "formData.plan" }),
            dom.labelWith("Enterprise", {
              type: "radio",
              name: "plan",
              value: "enterprise",
              "data-volt-model": "formData.plan",
            }),
          ),
          dom.button({ type: "submit" }, "Submit Form"),
          dom.button({ type: "reset" }, "Clear"),
        ),
      ),
      dom.details(
        null,
        dom.summary(null, "Current Form Data (Live)"),
        dom.pre(null, dom.code({ "data-volt-text": "JSON.stringify(formData.get(), null, 2)" }, "Loading...")),
      ),
    ),
  );
}
