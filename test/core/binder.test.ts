import { describe, expect, it } from "vitest";
import { mount } from "../../src/core/binder";
import { signal } from "../../src/core/signal";

describe("binder", () => {
  describe("mount", () => {
    it("returns a cleanup function", () => {
      const element = document.createElement("div");
      const cleanup = mount(element, {});

      expect(typeof cleanup).toBe("function");
      cleanup();
    });

    it("binds data-x-text to element text content", () => {
      const element = document.createElement("div");
      element.dataset.xText = "message";

      const scope = { message: "Hello, World!" };
      mount(element, scope);

      expect(element.textContent).toBe("Hello, World!");
    });

    it("updates text content when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.xText = "count";

      const count = signal(0);
      const scope = { count };
      mount(element, scope);

      expect(element.textContent).toBe("0");

      count.set(5);
      expect(element.textContent).toBe("5");

      count.set(10);
      expect(element.textContent).toBe("10");
    });

    it("binds data-x-html to element HTML content", () => {
      const element = document.createElement("div");
      element.dataset.xHtml = "content";

      const scope = { content: "<strong>Bold</strong>" };
      mount(element, scope);

      expect(element.innerHTML).toBe("<strong>Bold</strong>");
    });

    it("updates HTML content when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.xHtml = "html";

      const html = signal("<em>Italic</em>");
      const scope = { html };
      mount(element, scope);

      expect(element.innerHTML).toBe("<em>Italic</em>");

      html.set("<strong>Bold</strong>");
      expect(element.innerHTML).toBe("<strong>Bold</strong>");
    });

    it("binds data-x-class with string value", () => {
      const element = document.createElement("div");
      element.dataset.xClass = "classes";

      const scope = { classes: "active highlight" };
      mount(element, scope);

      expect(element.classList.contains("active")).toBe(true);
      expect(element.classList.contains("highlight")).toBe(true);
    });

    it("binds data-x-class with object value", () => {
      const element = document.createElement("div");
      element.dataset.xClass = "classes";

      const scope = { classes: { active: true, disabled: false } };
      mount(element, scope);

      expect(element.classList.contains("active")).toBe(true);
      expect(element.classList.contains("disabled")).toBe(false);
    });

    it("updates classes when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.xClass = "classes";

      const classes = signal({ active: false, disabled: false });
      const scope = { classes };
      mount(element, scope);

      expect(element.classList.contains("active")).toBe(false);

      classes.set({ active: true, disabled: false });
      expect(element.classList.contains("active")).toBe(true);
      expect(element.classList.contains("disabled")).toBe(false);

      classes.set({ active: false, disabled: true });
      expect(element.classList.contains("active")).toBe(false);
      expect(element.classList.contains("disabled")).toBe(true);
    });

    it("removes old classes when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.xClass = "classes";

      const classes = signal("foo bar");
      const scope = { classes };
      mount(element, scope);

      expect(element.classList.contains("foo")).toBe(true);
      expect(element.classList.contains("bar")).toBe(true);

      classes.set("baz");
      expect(element.classList.contains("foo")).toBe(false);
      expect(element.classList.contains("bar")).toBe(false);
      expect(element.classList.contains("baz")).toBe(true);
    });

    it("binds nested elements", () => {
      const parent = document.createElement("div");
      const child1 = document.createElement("span");
      const child2 = document.createElement("span");
      parent.append(child1, child2);

      child1.dataset.xText = "first";
      child2.dataset.xText = "second";

      const scope = { first: "First", second: "Second" };
      mount(parent, scope);

      expect(child1.textContent).toBe("First");
      expect(child2.textContent).toBe("Second");
      expect(parent.textContent).toBe("FirstSecond");
    });

    it("cleans up subscriptions on unmount", () => {
      const element = document.createElement("div");
      element.dataset.xText = "count";

      const count = signal(0);
      const scope = { count };
      const cleanup = mount(element, scope);

      count.set(5);
      expect(element.textContent).toBe("5");

      cleanup();

      count.set(10);
      expect(element.textContent).toBe("5");
    });

    it("handles multiple bindings on the same element", () => {
      const element = document.createElement("div");
      element.dataset.xText = "message";
      element.dataset.xClass = "classes";

      const message = signal("Hello");
      const classes = signal("active");
      const scope = { message, classes };
      mount(element, scope);

      expect(element.textContent).toBe("Hello");
      expect(element.classList.contains("active")).toBe(true);

      message.set("Goodbye");
      classes.set("inactive");

      expect(element.textContent).toBe("Goodbye");
      expect(element.classList.contains("inactive")).toBe(true);
    });

    it("evaluates nested property paths", () => {
      const element = document.createElement("div");
      element.dataset.xText = "user.name";

      const scope = { user: { name: "Alice" } };
      mount(element, scope);

      expect(element.textContent).toBe("Alice");
    });

    it("handles static values (no signals)", () => {
      const element = document.createElement("div");
      element.dataset.xText = "message";

      const scope = { message: "Static" };
      mount(element, scope);

      expect(element.textContent).toBe("Static");
    });

    it("handles literal expressions", () => {
      const element = document.createElement("div");
      element.dataset.xText = "'Hello'";

      mount(element, {});

      expect(element.textContent).toBe("Hello");
    });
  });
});
