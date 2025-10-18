/**
 * DOM utility functions
 */

/**
 * Walk the DOM tree and collect all elements with data-x-* attributes.
 * Returns elements in document order (parent before children).
 * Skips children of elements with data-x-for or data-x-if since those
 * will be processed when the parent element is cloned and mounted.
 *
 * @param root - The root element to start walking from
 * @returns Array of elements with data-x-* attributes
 */
export function walkDOM(root: Element): Element[] {
  const elements: Element[] = [];

  function walk(element: Element): void {
    if (hasVoltAttribute(element)) {
      elements.push(element);

      if (
        Object.hasOwn((element as HTMLElement).dataset, "xFor")
        || Object.hasOwn((element as HTMLElement).dataset, "xIf")
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
 * Check if an element has any data-x-* attributes.
 *
 * @param element - Element to check
 * @returns true if element has any Volt attributes
 */
export function hasVoltAttribute(element: Element): boolean {
  return [...element.attributes].some((attribute) => attribute.name.startsWith("data-x-"));
}

/**
 * Get all data-x-* attributes from an element.
 *
 * @param element - Element to get attributes from
 * @returns Map of attribute names to values (without the data-x- prefix)
 */
export function getVoltAttributes(element: Element): Map<string, string> {
  const attributes = new Map<string, string>();

  for (const attribute of element.attributes) {
    if (attribute.name.startsWith("data-x-")) {
      // Remove "data-x-" prefix
      attributes.set(attribute.name.slice(7), attribute.value);
    }
  }

  return attributes;
}

/**
 * Set the text content of an element safely.
 *
 * @param element - Element to update
 * @param value - Text value to set
 */
export function setText(element: Element, value: unknown): void {
  element.textContent = String(value ?? "");
}

/**
 * Set the HTML content of an element safely.
 * Note: This trusts the input HTML and should only be used with sanitized content.
 *
 * @param element - Element to update
 * @param value - HTML string to set
 */
export function setHTML(element: Element, value: string): void {
  element.innerHTML = value;
}

/**
 * Add or remove a CSS class from an element.
 *
 * @param element - Element to update
 * @param className - Class name to toggle
 * @param add - Whether to add (true) or remove (false) the class
 */
export function toggleClass(element: Element, className: string, add: boolean): void {
  element.classList.toggle(className, add);
}

/**
 * Parse a class binding expression.
 * Supports both string values ("active") and object notation ({active: true}).
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
  }

  return classes;
}
