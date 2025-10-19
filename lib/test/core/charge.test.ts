import { charge } from "$core/charge";
import type { Signal } from "$types/volt";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("charge", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("basic charging", () => {
    it("discovers and mounts elements with data-volt attribute", () => {
      container.innerHTML = `<div data-volt id="root1"></div>`;

      const result = charge();

      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].element).toBe(container.querySelector("#root1"));
      expect(typeof result.cleanup).toBe("function");

      result.cleanup();
    });

    it("mounts multiple roots", () => {
      container.innerHTML = `
        <div data-volt id="root1"></div>
        <div data-volt id="root2"></div>
        <div data-volt id="root3"></div>
      `;

      const result = charge();

      expect(result.roots).toHaveLength(3);
      result.cleanup();
    });

    it("accepts custom selector", () => {
      container.innerHTML = `
        <div data-volt id="root1"></div>
        <div class="custom" id="root2"></div>
      `;

      const result = charge(".custom");

      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].element.id).toBe("root2");
      result.cleanup();
    });

    it("returns empty array when no roots found", () => {
      container.innerHTML = `<div id="noRoots"></div>`;

      const result = charge();

      expect(result.roots).toHaveLength(0);
      result.cleanup();
    });
  });

  describe("data-volt-state parsing", () => {
    it("creates signals from data-volt-state JSON", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"count": 0, "message": "hello"}'>
          <span data-volt-text="count"></span>
          <span data-volt-text="message"></span>
        </div>
      `;

      const result = charge();
      const root = container.querySelector("div[data-volt]")!;
      const spans = root.querySelectorAll("span");

      expect(spans[0].textContent).toBe("0");
      expect(spans[1].textContent).toBe("hello");

      result.cleanup();
    });

    it("creates signals for nested objects", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"user": {"name": "Alice", "age": 30}}'>
          <span data-volt-text="user.name"></span>
          <span data-volt-text="user.age"></span>
        </div>
      `;

      const result = charge();
      const spans = container.querySelectorAll("span");

      expect(spans[0].textContent).toBe("Alice");
      expect(spans[1].textContent).toBe("30");

      result.cleanup();
    });

    it("creates reactive signals that can be updated", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"count": 0}'>
          <span data-volt-text="count"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;
      const scope = result.roots[0].scope;

      expect(span.textContent).toBe("0");

      (scope.count as Signal<number>).set(5);
      expect(span.textContent).toBe("5");

      (scope.count as Signal<number>).set(10);
      expect(span.textContent).toBe("10");

      result.cleanup();
    });

    it("handles arrays in state", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"items": ["a", "b", "c"]}'>
          <ul>
            <li data-volt-for="item in items" data-volt-text="item"></li>
          </ul>
        </div>
      `;

      const result = charge();
      const items = container.querySelectorAll("li");

      expect(items).toHaveLength(3);
      expect(items[0].textContent).toBe("a");
      expect(items[1].textContent).toBe("b");
      expect(items[2].textContent).toBe("c");

      result.cleanup();
    });

    it("handles empty state object", () => {
      container.innerHTML = `<div data-volt data-volt-state='{}'>Content</div>`;

      const result = charge();

      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].scope).toEqual({});

      result.cleanup();
    });

    it("handles missing data-volt-state gracefully", () => {
      container.innerHTML = `<div data-volt><span data-volt-text="'static'"></span></div>`;

      const result = charge();
      const span = container.querySelector("span")!;

      expect(span.textContent).toBe("static");

      result.cleanup();
    });

    it("logs error for invalid JSON", () => {
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args: unknown[]) => errors.push(args);

      container.innerHTML = `<div data-volt data-volt-state='invalid json'>Content</div>`;

      const result = charge();

      expect(errors.length).toBeGreaterThan(0);
      console.error = consoleError;

      result.cleanup();
    });

    it("logs error for non-object state", () => {
      const consoleError = console.error;
      const errors: unknown[] = [];
      console.error = (...args: unknown[]) => errors.push(args);

      container.innerHTML = `<div data-volt data-volt-state='"string"'>Content</div>`;

      const result = charge();

      expect(errors.length).toBeGreaterThan(0);
      console.error = consoleError;

      result.cleanup();
    });
  });

  describe("data-volt-computed", () => {
    it("creates computed values from expressions", () => {
      container.innerHTML = `
        <div data-volt
             data-volt-state='{"count": 5}'
             data-volt-computed:double="count * 2">
          <span data-volt-text="count"></span>
          <span data-volt-text="double"></span>
        </div>
      `;

      const result = charge();
      const spans = container.querySelectorAll("span");

      expect(spans[0].textContent).toBe("5");
      expect(spans[1].textContent).toBe("10");

      result.cleanup();
    });

    it("updates computed values when dependencies change", () => {
      container.innerHTML = `
        <div data-volt
             data-volt-state='{"count": 3}'
             data-volt-computed:double="count * 2"
             data-volt-computed:triple="count * 3">
          <span id="double" data-volt-text="double"></span>
          <span id="triple" data-volt-text="triple"></span>
        </div>
      `;

      const result = charge();
      const scope = result.roots[0].scope;
      const double = container.querySelector("#double")!;
      const triple = container.querySelector("#triple")!;

      expect(double.textContent).toBe("6");
      expect(triple.textContent).toBe("9");

      (scope.count as Signal<number>).set(5);

      expect(double.textContent).toBe("10");
      expect(triple.textContent).toBe("15");

      result.cleanup();
    });

    it("supports computed values with multiple dependencies", () => {
      container.innerHTML = `
        <div data-volt
             data-volt-state='{"a": 5, "b": 3}'
             data-volt-computed:sum="a + b"
             data-volt-computed:product="a * b">
          <span id="sum" data-volt-text="sum"></span>
          <span id="product" data-volt-text="product"></span>
        </div>
      `;

      const result = charge();
      const scope = result.roots[0].scope;

      expect(container.querySelector("#sum")!.textContent).toBe("8");
      expect(container.querySelector("#product")!.textContent).toBe("15");

      (scope.a as Signal<number>).set(10);

      expect(container.querySelector("#sum")!.textContent).toBe("13");
      expect(container.querySelector("#product")!.textContent).toBe("30");

      result.cleanup();
    });

    it("supports complex expressions in computed", () => {
      container.innerHTML = `
        <div data-volt
             data-volt-state='{"count": 10, "limit": 5}'
             data-volt-computed:is-valid="count > limit && count < 20">
          <span data-volt-text="isValid"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;

      expect(span.textContent).toBe("true");

      result.cleanup();
    });

    it("handles computed with no dependencies", () => {
      container.innerHTML = `
        <div data-volt
             data-volt-computed:constant="42 * 2">
          <span data-volt-text="constant"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;

      expect(span.textContent).toBe("84");

      result.cleanup();
    });

    it("supports computed accessing nested properties", () => {
      container.innerHTML = `
        <div data-volt
             data-volt-state='{"user": {"firstName": "John", "lastName": "Doe"}}'
             data-volt-computed:full-name="user.firstName">
          <span data-volt-text="fullName"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;

      expect(span.textContent).toBe("John");

      result.cleanup();
    });
  });

  describe("isolated scopes", () => {
    it("creates isolated scopes for each root", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"count": 1}'>
          <span id="root1" data-volt-text="count"></span>
        </div>
        <div data-volt data-volt-state='{"count": 2}'>
          <span id="root2" data-volt-text="count"></span>
        </div>
      `;

      const result = charge();

      expect(container.querySelector("#root1")!.textContent).toBe("1");
      expect(container.querySelector("#root2")!.textContent).toBe("2");

      const scope = result.roots[0].scope;

      (scope.count as Signal<number>).set(10);

      expect(container.querySelector("#root1")!.textContent).toBe("10");
      expect(container.querySelector("#root2")!.textContent).toBe("2");

      result.cleanup();
    });

    it("does not share state between roots", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"shared": "root1"}'>
          <span id="s1" data-volt-text="shared"></span>
        </div>
        <div data-volt data-volt-state='{"shared": "root2"}'>
          <span id="s2" data-volt-text="shared"></span>
        </div>
      `;

      const result = charge();

      expect(container.querySelector("#s1")!.textContent).toBe("root1");
      expect(container.querySelector("#s2")!.textContent).toBe("root2");

      result.cleanup();
    });
  });

  describe("cleanup", () => {
    it("cleans up all roots when calling global cleanup", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"count": 0}'>
          <span data-volt-text="count"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;
      const scope = result.roots[0].scope;

      (scope.count as Signal<number>).set(5);
      expect(span.textContent).toBe("5");

      result.cleanup();

      (scope.count as Signal<number>).set(10);
      expect(span.textContent).toBe("5");
    });

    it("cleans up individual roots", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"count": 0}'>
          <span data-volt-text="count"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;
      const scope = result.roots[0].scope;

      (scope.count as Signal<number>).set(5);
      expect(span.textContent).toBe("5");

      result.roots[0].cleanup();

      (scope.count as Signal<number>).set(10);
      expect(span.textContent).toBe("5");
    });
  });

  describe("integration with bindings", () => {
    it("works with all binding types", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"message": "Hello", "active": true}'>
          <span data-volt-text="message" data-volt-class="active"></span>
        </div>
      `;

      const result = charge();
      const span = container.querySelector("span")!;

      expect(span.textContent).toBe("Hello");
      expect(span.classList.contains("true")).toBe(true);

      result.cleanup();
    });

    it("works with conditional rendering", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"show": true}'>
          <p data-volt-if="show">Visible</p>
        </div>
      `;

      const result = charge();

      expect(container.querySelector("p")).toBeTruthy();

      const scope = result.roots[0].scope;
      (scope.show as Signal<boolean>).set(false);

      expect(container.querySelector("p")).toBeNull();

      result.cleanup();
    });

    it("works with list rendering", () => {
      container.innerHTML = `
        <div data-volt data-volt-state='{"items": ["a", "b"]}'>
          <ul>
            <li data-volt-for="item in items" data-volt-text="item"></li>
          </ul>
        </div>
      `;

      const result = charge();

      expect(container.querySelectorAll("li")).toHaveLength(2);

      result.cleanup();
    });
  });
});
