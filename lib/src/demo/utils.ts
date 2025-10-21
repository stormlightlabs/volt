/**
 * DOM creation utilities for building demo sections programmatically
 */

import { isNil } from "$core/shared";
import type { None, Nullable } from "$types/helpers";

type Attributes = Record<string, string | boolean | None>;

type Attrs = Nullable<Attributes | string>;

type CreateFn<K extends keyof HTMLElementTagNameMap> = (
  attrs?: Attrs,
  ...children: (Node | string)[]
) => HTMLElementTagNameMap[K];

type ElementFactory = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  ...children: (Node | string)[]
) => HTMLElementTagNameMap[K];

type ListFactory = <K extends keyof HTMLElementTagNameMap>(
  createFn: CreateFn<K>,
  items: string[],
  attrs?: Attrs,
) => HTMLElementTagNameMap[K][];

export const el: ElementFactory = (tag, attrs?, ...children) => {
  const element = document.createElement(tag);

  if (typeof attrs === "string") {
    element.className = attrs;
  } else if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (isNil(value) || value === false) continue;
      if (value === true) {
        element.setAttribute(key, "");
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      element.append(document.createTextNode(child));
    } else {
      element.append(child);
    }
  }

  return element;
};

export function text(content: string): Text {
  return document.createTextNode(content);
}

export function fragment(...children: (Node | string)[]): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const child of children) {
    if (typeof child === "string") {
      frag.append(document.createTextNode(child));
    } else {
      frag.append(child);
    }
  }
  return frag;
}

export const repeat: ListFactory = (createFn, items, attrs) => {
  return items.map((item) => createFn(attrs, item));
};

/**
 * Create key-value pairs for description lists (dt/dd)
 *
 * @example
 * dl(null, ...kv([
 *   ["Term", "Definition"],
 *   ["Signal", "A reactive primitive"]
 * ]))
 */
export function kv(pairs: Array<[string, string]>, dtAttrs?: Attrs, ddAttrs?: Attrs): HTMLElement[] {
  const elements = [];
  for (const [term, definition] of pairs) {
    elements.push(dt(dtAttrs, term), dd(ddAttrs, definition));
  }
  return elements;
}

/**
 * Create option elements for select dropdowns
 *
 * @example
 * select({ id: "country" }, ...options([
 *   ["us", "United States"],
 *   ["uk", "United Kingdom"]
 * ]))
 */
export function options(items: Array<[string, string]>, attrs?: Attrs): HTMLOptionElement[] {
  return items.map(([value, label]) => {
    const optionAttrs = typeof attrs === "string" ? { class: attrs, value } : { ...attrs, value };
    return option(optionAttrs, label);
  });
}

/**
 * Create a label and input as adjacent siblings
 * The label's `for` attribute will match the input's `id`
 *
 * @example
 * ...labelFor("Name", { id: "name", type: "text", required: true })
 */
export function labelFor(
  labelText: string,
  inputAttrs: Attrs & { id: string },
  labelAttrs?: Attrs,
): [HTMLLabelElement, HTMLInputElement] {
  const labelElement = label(
    typeof labelAttrs === "string" ? labelAttrs : { ...labelAttrs, for: inputAttrs.id },
    labelText,
  );
  const inputElement = input(inputAttrs);
  return [labelElement, inputElement];
}

/**
 * Create a label wrapping an input element
 * No `for` or `id` needed since the input is wrapped
 *
 * @example
 * labelWith("Subscribe to newsletter", { type: "checkbox", "data-volt-model": "newsletter" })
 */
export function labelWith(
  labelText: string | (Node | string)[],
  inputAttrs: Attrs,
  labelAttrs?: Attrs,
): HTMLLabelElement {
  const inputElement = input(inputAttrs);
  if (typeof labelText === "string") {
    return label(labelAttrs, inputElement, " ", labelText);
  }
  return label(labelAttrs, inputElement, " ", ...labelText);
}

/**
 * Create multiple buttons with different click handlers
 *
 * @example
 * ...buttons([
 *   ["Increment", "increment"],
 *   ["Decrement", "decrement"],
 *   { label: "Reset", onClick: "reset", type: "reset" }
 * ])
 */
export function buttons(
  items: Array<[string, string] | { label: string; onClick: string } & Attributes>,
  sharedAttrs?: Attrs,
): HTMLButtonElement[] {
  return items.map((item) => {
    if (Array.isArray(item)) {
      const [label, onClick] = item;
      const baseAttrs = typeof sharedAttrs === "object" && sharedAttrs !== null ? sharedAttrs : {};
      const attrs = { ...baseAttrs, "data-volt-on-click": onClick };
      return button(attrs, label);
    }
    const { label: buttonLabel, onClick, ...restAttrs } = item;
    const baseAttrs = typeof sharedAttrs === "object" && sharedAttrs !== null ? sharedAttrs : {};
    const attrs = { ...baseAttrs, ...restAttrs, "data-volt-on-click": onClick };
    return button(attrs, buttonLabel);
  });
}

export const h1: CreateFn<"h1"> = (attrs?, ...children) => el("h1", attrs, ...children);
export const h2: CreateFn<"h2"> = (attrs?, ...children) => el("h2", attrs, ...children);
export const h3: CreateFn<"h3"> = (attrs?, ...children) => el("h3", attrs, ...children);
export const h4: CreateFn<"h4"> = (attrs?, ...children) => el("h4", attrs, ...children);
export const h5: CreateFn<"h5"> = (attrs?, ...children) => el("h5", attrs, ...children);
export const h6: CreateFn<"h6"> = (attrs?, ...children) => el("h6", attrs, ...children);
export const p: CreateFn<"p"> = (attrs?, ...children) => el("p", attrs, ...children);
export const div: CreateFn<"div"> = (attrs?, ...children) => el("div", attrs, ...children);
export const span: CreateFn<"span"> = (attrs?, ...children) => el("span", attrs, ...children);
export const small: CreateFn<"small"> = (attrs?, ...children) => el("small", attrs, ...children);
export const article: CreateFn<"article"> = (attrs?, ...children) => el("article", attrs, ...children);
export const aside: CreateFn<"aside"> = (attrs?, ...children) => el("aside", attrs, ...children);
export const section: CreateFn<"section"> = (attrs?, ...children) => el("section", attrs, ...children);
export const header: CreateFn<"header"> = (attrs?, ...children) => el("header", attrs, ...children);
export const footer: CreateFn<"footer"> = (attrs?, ...children) => el("footer", attrs, ...children);
export const nav: CreateFn<"nav"> = (attrs?, ...children) => el("nav", attrs, ...children);
export const ul: CreateFn<"ul"> = (attrs?, ...children) => el("ul", attrs, ...children);
export const ol: CreateFn<"ol"> = (attrs?, ...children) => el("ol", attrs, ...children);
export const li: CreateFn<"li"> = (attrs?, ...children) => el("li", attrs, ...children);
export const dl: CreateFn<"dl"> = (attrs?, ...children) => el("dl", attrs, ...children);
export const dt: CreateFn<"dt"> = (attrs?, ...children) => el("dt", attrs, ...children);
export const dd: CreateFn<"dd"> = (attrs?, ...children) => el("dd", attrs, ...children);
export const a: CreateFn<"a"> = (attrs?, ...children) => el("a", attrs, ...children);
export const button: CreateFn<"button"> = (attrs?, ...children) => el("button", attrs, ...children);
export const input: CreateFn<"input"> = (attrs?: Attributes | string | null) => el("input", attrs);
export const textarea: CreateFn<"textarea"> = (attrs?, ...children) => el("textarea", attrs, ...children);
export const select: CreateFn<"select"> = (attrs?, ...children) => el("select", attrs, ...children);
export const option: CreateFn<"option"> = (attrs?, ...children) => el("option", attrs, ...children);
export const label: CreateFn<"label"> = (attrs?, ...children) => el("label", attrs, ...children);
export const form: CreateFn<"form"> = (attrs?, ...children) => el("form", attrs, ...children);
export const fieldset: CreateFn<"fieldset"> = (attrs?, ...children) => el("fieldset", attrs, ...children);
export const legend: CreateFn<"legend"> = (attrs?, ...children) => el("legend", attrs, ...children);
export const table: CreateFn<"table"> = (attrs?, ...children) => el("table", attrs, ...children);
export const thead: CreateFn<"thead"> = (attrs?, ...children) => el("thead", attrs, ...children);
export const tbody: CreateFn<"tbody"> = (attrs?, ...children) => el("tbody", attrs, ...children);
export const tr: CreateFn<"tr"> = (attrs?, ...children) => el("tr", attrs, ...children);
export const th: CreateFn<"th"> = (attrs?, ...children) => el("th", attrs, ...children);
export const td: CreateFn<"td"> = (attrs?, ...children) => el("td", attrs, ...children);
export const blockquote: CreateFn<"blockquote"> = (attrs?, ...children) => el("blockquote", attrs, ...children);
export const cite: CreateFn<"cite"> = (attrs?, ...children) => el("cite", attrs, ...children);
export const code: CreateFn<"code"> = (attrs?, ...children) => el("code", attrs, ...children);
export const pre: CreateFn<"pre"> = (attrs?, ...children) => el("pre", attrs, ...children);
export const dialog: CreateFn<"dialog"> = (attrs?, ...children) => el("dialog", attrs, ...children);
export const details: CreateFn<"details"> = (attrs?, ...children) => el("details", attrs, ...children);
export const summary: CreateFn<"summary"> = (attrs?, ...children) => el("summary", attrs, ...children);
export const strong: CreateFn<"strong"> = (attrs?, ...children) => el("strong", attrs, ...children);
export const em: CreateFn<"em"> = (attrs?, ...children) => el("em", attrs, ...children);
export const del: CreateFn<"del"> = (attrs?, ...children) => el("del", attrs, ...children);
export const hr: CreateFn<"hr"> = (attrs?) => el("hr", attrs);
