import { mount } from "$core/binder";
import { signal } from "$core/signal";
import type { Nullable } from "$types/helpers";
import { describe, expect, it, vi } from "vitest";

describe("binding extensions", () => {
  describe("data-volt-show", () => {
    it("shows element when expression is truthy", () => {
      const element = document.createElement("div");
      element.dataset.voltShow = "visible";

      const scope = { visible: true };
      mount(element, scope);

      expect(element.style.display).not.toBe("none");
    });

    it("hides element when expression is falsy", () => {
      const element = document.createElement("div");
      element.dataset.voltShow = "visible";

      const scope = { visible: false };
      mount(element, scope);

      expect(element.style.display).toBe("none");
    });

    it("updates visibility when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.voltShow = "visible";

      const visible = signal(true);
      const scope = { visible };
      mount(element, scope);

      expect(element.style.display).not.toBe("none");

      visible.set(false);
      expect(element.style.display).toBe("none");

      visible.set(true);
      expect(element.style.display).not.toBe("none");
    });

    it("preserves original display value", () => {
      const element = document.createElement("div");
      element.style.display = "flex";
      element.dataset.voltShow = "visible";

      const visible = signal(true);
      const scope = { visible };
      mount(element, scope);

      visible.set(false);
      expect(element.style.display).toBe("none");

      visible.set(true);
      expect(element.style.display).toBe("flex");
    });

    it("handles computed display values", () => {
      const element = document.createElement("span");
      element.dataset.voltShow = "visible";
      document.body.append(element);

      const visible = signal(true);
      const scope = { visible };
      mount(element, scope);

      visible.set(false);
      expect(globalThis.getComputedStyle(element).display).toBe("none");

      visible.set(true);
      expect(globalThis.getComputedStyle(element).display).toBe("inline");
      expect(element.style.display).toBe("");

      element.remove();
    });

    it("handles expression with falsy values", () => {
      const element = document.createElement("div");
      element.dataset.voltShow = "count";

      const count = signal(0);
      const scope = { count };
      mount(element, scope);

      expect(element.style.display).toBe("none");

      count.set(1);
      expect(element.style.display).not.toBe("none");
    });
  });

  describe("data-volt-style", () => {
    it("applies styles from object notation", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const scope = { styles: { color: "red", fontSize: "16px" } };
      mount(element, scope);

      expect(element.style.color).toBe("red");
      expect(element.style.fontSize).toBe("16px");
    });

    it("applies styles from string notation", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styleString";

      const scope = { styleString: "color: blue; font-size: 20px" };
      mount(element, scope);

      expect(element.style.color).toBe("blue");
      expect(element.style.fontSize).toBe("20px");
    });

    it("updates styles when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const styles = signal({ color: "red" });
      const scope = { styles };
      mount(element, scope);

      expect(element.style.color).toBe("red");

      styles.set({ color: "blue" });
      expect(element.style.color).toBe("blue");
    });

    it("handles camelCase property names", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const scope = { styles: { backgroundColor: "yellow", borderRadius: "5px" } };
      mount(element, scope);

      expect(element.style.backgroundColor).toBe("yellow");
      expect(element.style.borderRadius).toBe("5px");
    });

    it("removes styles when value is null", () => {
      const element = document.createElement("div");
      element.style.color = "red";
      element.dataset.voltStyle = "styles";

      const styles = signal<{ color: Nullable<string> }>({ color: "blue" });
      const scope = { styles };
      mount(element, scope);

      expect(element.style.color).toBe("blue");

      styles.set({ color: null });
      expect(element.style.color).toBe("");
    });

    it("removes styles when value is undefined", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const styles = signal<{ color?: string; fontSize: string }>({ color: "red", fontSize: "16px" });
      const scope = { styles };
      mount(element, scope);

      expect(element.style.color).toBe("red");
      expect(element.style.fontSize).toBe("16px");

      styles.set({ color: undefined, fontSize: "20px" });
      expect(element.style.color).toBe("");
      expect(element.style.fontSize).toBe("20px");
    });

    it("handles multiple style updates", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const styles = signal<{ color: string; fontSize: string; fontWeight?: string }>({
        color: "red",
        fontSize: "16px",
      });
      const scope = { styles };
      mount(element, scope);

      expect(element.style.color).toBe("red");
      expect(element.style.fontSize).toBe("16px");

      styles.set({ color: "blue", fontSize: "20px", fontWeight: "bold" });
      expect(element.style.color).toBe("blue");
      expect(element.style.fontSize).toBe("20px");
      expect(element.style.fontWeight).toBe("bold");
    });

    it("handles string notation updates", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styleString";

      const styleString = signal("color: red");
      const scope = { styleString };
      mount(element, scope);

      expect(element.style.color).toBe("red");

      styleString.set("color: blue; font-size: 20px");
      expect(element.style.color).toBe("blue");
      expect(element.style.fontSize).toBe("20px");
    });

    it("handles CSS custom properties (CSS variables)", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const scope = { styles: { "--primary-color": "blue", "--spacing": "16px" } };
      mount(element, scope);

      expect(element.style.getPropertyValue("--primary-color")).toBe("blue");
      expect(element.style.getPropertyValue("--spacing")).toBe("16px");
    });

    it("handles vendor-prefixed properties", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const scope = { styles: { WebkitTransform: "scale(1.5)", MozUserSelect: "none" } };
      expect(() => mount(element, scope)).not.toThrow();
      expect(element.style.getPropertyValue("-webkit-transform")).toBe("scale(1.5)");
    });

    it("gracefully handles invalid property names", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const scope = { styles: { invalidProp123: "value", color: "red" } };
      mount(element, scope);

      expect(element.style.color).toBe("red");

      consoleWarnSpy.mockRestore();
    });

    it("converts numeric values to strings", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const scope = { styles: { opacity: 0.5, zIndex: 100 } };
      mount(element, scope);

      expect(element.style.opacity).toBe("0.5");
      expect(element.style.zIndex).toBe("100");
    });

    it("handles kebab-case property names directly", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const scope = { styles: { "font-size": "20px", "background-color": "yellow" } };
      mount(element, scope);

      expect(element.style.fontSize).toBe("20px");
      expect(element.style.backgroundColor).toBe("yellow");
    });

    it("updates CSS variables reactively", () => {
      const element = document.createElement("div");
      element.dataset.voltStyle = "styles";

      const styles = signal({ "--theme-color": "blue" });
      const scope = { styles };
      mount(element, scope);

      expect(element.style.getPropertyValue("--theme-color")).toBe("blue");

      styles.set({ "--theme-color": "red" });
      expect(element.style.getPropertyValue("--theme-color")).toBe("red");
    });
  });

  describe("data-volt-skip", () => {
    it("skips element with data-volt-skip", () => {
      const element = document.createElement("div");
      element.dataset.voltSkip = "";
      element.dataset.voltText = "message";

      const scope = { message: "Hello" };
      mount(element, scope);

      expect(element.textContent).toBe("");
    });

    it("skips descendants of data-volt-skip element", () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.append(child);

      parent.dataset.voltSkip = "";
      child.dataset.voltText = "message";

      const scope = { message: "Hello" };
      mount(parent, scope);

      expect(child.textContent).toBe("");
    });

    it("doesn't affect siblings", () => {
      const container = document.createElement("div");
      const skipped = document.createElement("div");
      const processed = document.createElement("div");

      container.append(skipped);
      container.append(processed);

      skipped.dataset.voltSkip = "";
      skipped.dataset.voltText = "skipped";
      processed.dataset.voltText = "message";

      const scope = { message: "Hello", skipped: "Skipped" };
      mount(container, scope);

      expect(skipped.textContent).toBe("");
      expect(processed.textContent).toBe("Hello");
    });

    it("skips nested descendants multiple levels deep", () => {
      const container = document.createElement("div");
      const skipped = document.createElement("div");
      const child = document.createElement("div");
      const grandchild = document.createElement("span");

      child.append(grandchild);
      skipped.append(child);
      container.append(skipped);

      skipped.dataset.voltSkip = "";
      grandchild.dataset.voltText = "message";

      const scope = { message: "Hello" };
      mount(container, scope);

      expect(grandchild.textContent).toBe("");
    });

    it("allows processing after skipped element", () => {
      const container = document.createElement("div");
      const before = document.createElement("div");
      const skipped = document.createElement("div");
      const after = document.createElement("div");

      container.append(before);
      container.append(skipped);
      container.append(after);

      before.dataset.voltText = "beforeMsg";
      skipped.dataset.voltSkip = "";
      skipped.dataset.voltText = "skippedMsg";
      after.dataset.voltText = "afterMsg";

      const scope = { beforeMsg: "Before", skippedMsg: "Skipped", afterMsg: "After" };
      mount(container, scope);

      expect(before.textContent).toBe("Before");
      expect(skipped.textContent).toBe("");
      expect(after.textContent).toBe("After");
    });
  });

  describe("data-volt-cloak", () => {
    it("removes data-volt-cloak attribute after mount", () => {
      const element = document.createElement("div");
      element.dataset.voltCloak = "";

      expect(Object.hasOwn(element.dataset, "voltCloak")).toBe(true);

      mount(element, {});

      expect(Object.hasOwn(element.dataset, "voltCloak")).toBe(false);
    });

    it("removes from nested elements", () => {
      const parent = document.createElement("div");
      const child = document.createElement("div");
      parent.append(child);

      parent.dataset.voltCloak = "";
      child.dataset.voltCloak = "";

      expect(Object.hasOwn(parent.dataset, "voltCloak")).toBe(true);
      expect(Object.hasOwn(child.dataset, "voltCloak")).toBe(true);

      mount(parent, {});

      expect(Object.hasOwn(parent.dataset, "voltCloak")).toBe(false);
      expect(Object.hasOwn(child.dataset, "voltCloak")).toBe(false);
    });

    it("works with other bindings", () => {
      const element = document.createElement("div");
      element.dataset.voltCloak = "";
      element.dataset.voltText = "message";

      const scope = { message: "Hello" };
      mount(element, scope);

      expect(Object.hasOwn(element.dataset, "voltCloak")).toBe(false);
      expect(element.textContent).toBe("Hello");
    });

    it("removes from multiple siblings", () => {
      const container = document.createElement("div");
      const child1 = document.createElement("div");
      const child2 = document.createElement("div");
      const child3 = document.createElement("div");

      container.append(child1);
      container.append(child2);
      container.append(child3);

      child1.dataset.voltCloak = "";
      child2.dataset.voltCloak = "";
      child3.dataset.voltCloak = "";

      mount(container, {});

      expect(Object.hasOwn(child1.dataset, "voltCloak")).toBe(false);
      expect(Object.hasOwn(child2.dataset, "voltCloak")).toBe(false);
      expect(Object.hasOwn(child3.dataset, "voltCloak")).toBe(false);
    });
  });

  describe("combined usage", () => {
    it("combines data-volt-show with data-volt-style", () => {
      const element = document.createElement("div");
      element.dataset.voltShow = "visible";
      element.dataset.voltStyle = "styles";

      const visible = signal(true);
      const styles = signal({ color: "red" });
      const scope = { visible, styles };
      mount(element, scope);

      expect(element.style.display).not.toBe("none");
      expect(element.style.color).toBe("red");

      visible.set(false);
      expect(element.style.display).toBe("none");
      expect(element.style.color).toBe("red");
    });

    it("data-volt-skip prevents data-volt-cloak removal", () => {
      const element = document.createElement("div");
      element.dataset.voltSkip = "";
      element.dataset.voltCloak = "";

      mount(element, {});
      expect(Object.hasOwn(element.dataset, "voltCloak")).toBe(true);
    });

    it("data-volt-cloak removed before bindings execute", () => {
      const element = document.createElement("div");
      element.dataset.voltCloak = "";
      element.dataset.voltText = "message";

      const scope = { message: "Hello" };
      mount(element, scope);

      expect(Object.hasOwn(element.dataset, "voltCloak")).toBe(false);
      expect(element.textContent).toBe("Hello");
    });
  });
});
