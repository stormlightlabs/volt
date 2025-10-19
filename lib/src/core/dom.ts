/**
 * DOM utility functions
 */

/**
 * Walk the DOM tree and collect all elements with data-volt-* attributes in document order (parent before children).
 *
 * Skips children of elements with data-volt-for or data-volt-if since those will be processed when the parent element is cloned and mounted.
 *
 * @param root - The root element to start walking from
 * @returns Array of elements with data-volt-* attributes
 */
export function walkDOM(root: Element): Element[] {
  const elements: Element[] = [];

  function walk(element: Element): void {
    if (hasVoltAttr(element)) {
      elements.push(element);

      if (
        Object.hasOwn((element as HTMLElement).dataset, "voltFor")
        || Object.hasOwn((element as HTMLElement).dataset, "voltIf")
      ) {
        return;
      }
    }

    for (const child of element.children) {
      walk(child);
    }
  }

  walk(root);

  return elements;
}

/**
 * Check if an element has any data-volt-* attributes.
 *
 * @param el - Element to check
 * @returns true if element has any Volt attributes
 */
export function hasVoltAttr(el: Element): boolean {
  return [...el.attributes].some((attribute) => attribute.name.startsWith("data-volt-"));
}

/**
 * Get all data-volt-* attributes from an element.
 * Excludes charge metadata attributes (state, computed:*) that are processed separately.
 *
 * @param el - Element to get attributes from
 * @returns Map of attribute names to values (without the data-volt- prefix)
 */
export function getVoltAttrs(el: Element): Map<string, string> {
  const attributes = new Map<string, string>();

  for (const attribute of el.attributes) {
    if (attribute.name.startsWith("data-volt-")) {
      const name = attribute.name.slice(10);

      // Skip charge metadata attributes
      if (name === "state" || name.startsWith("computed:")) {
        continue;
      }

      attributes.set(name, attribute.value);
    }
  }

  return attributes;
}

/**
 * Set the text content of an element safely.
 *
 * @param el - Element to update
 * @param value - Text value to set
 */
export function setText(el: Element, value: unknown): void {
  el.textContent = String(value ?? "");
}

/**
 * Set the HTML content of an element safely.
 * Note: This trusts the input HTML and should only be used with sanitized content.
 *
 * @param el - Element to update
 * @param value - HTML string to set
 */
export function setHTML(el: Element, value: string): void {
  el.innerHTML = value;
}

/**
 * Add or remove a CSS class from an element.
 *
 * @param el - Element to update
 * @param cls - Class name to toggle
 * @param add - Whether to add (true) or remove (false) the class
 */
export function toggleClass(el: Element, cls: string, add: boolean): void {
  el.classList.toggle(cls, add);
}

/**
 * Parse a class binding expression.
 * Supports string values ("active"), object notation ({active: true}),
 * and other primitives (true, false, numbers) which are converted to strings.
 *
 * @param value - The class value or object
 * @returns Map of class names to boolean values
 */
export function parseClassBinding(value: unknown): Map<string, boolean> {
  const classes = new Map<string, boolean>();
  switch (typeof value) {
    case "string": {
      for (const className of value.split(/\s+/).filter(Boolean)) {
        classes.set(className, true);
      }
      break;
    }
    case "object": {
      if (value !== null) {
        for (const [key, value_] of Object.entries(value)) {
          classes.set(key, Boolean(value_));
        }
      }
      break;
    }
    case "boolean":
    case "number": {
      classes.set(String(value), true);
      break;
    }
  }

  return classes;
}
