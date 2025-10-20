import { mount } from "$core/binder";
import { signal } from "$core/signal";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("input modifiers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("data-volt-model modifiers", () => {
    describe(".number modifier", () => {
      it("coerces string values to numbers", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelNumber = "count";

        const count = signal(0);
        mount(input, { count });

        input.value = "42";
        input.dispatchEvent(new Event("input"));

        expect(count.get()).toBe(42);
      });

      it("handles empty strings as NaN", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelNumber = "value";

        const value = signal(0);
        mount(input, { value });

        input.value = "";
        input.dispatchEvent(new Event("input"));

        expect(Number.isNaN(value.get())).toBe(true);
      });

      it("handles decimal numbers", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelNumber = "price";

        const price = signal(0);
        mount(input, { price });

        input.value = "19.99";
        input.dispatchEvent(new Event("input"));

        expect(price.get()).toBe(19.99);
      });
    });

    describe(".trim modifier", () => {
      it("trims whitespace from string values", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelTrim = "name";

        const name = signal("");
        mount(input, { name });

        input.value = "  John Doe  ";
        input.dispatchEvent(new Event("input"));

        expect(name.get()).toBe("John Doe");
      });

      it("handles strings with only whitespace", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelTrim = "value";

        const value = signal("");
        mount(input, { value });

        input.value = "   ";
        input.dispatchEvent(new Event("input"));

        expect(value.get()).toBe("");
      });
    });

    describe(".lazy modifier", () => {
      it("syncs on change event instead of input", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelLazy = "value";

        const value = signal("");
        mount(input, { value });

        input.value = "test";
        input.dispatchEvent(new Event("input"));
        expect(value.get()).toBe("");

        input.dispatchEvent(new Event("change"));
        expect(value.get()).toBe("test");
      });

      it("works with checkboxes", () => {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.dataset.voltModelLazy = "checked";

        const checked = signal(false);
        mount(input, { checked });

        input.checked = true;
        input.dispatchEvent(new Event("change"));

        expect(checked.get()).toBe(true);
      });
    });

    describe(".debounce modifier", () => {
      it("debounces signal updates with default delay (300ms)", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelDebounce = "search";

        const search = signal("");
        mount(input, { search });

        input.value = "hello";
        input.dispatchEvent(new Event("input"));

        expect(search.get()).toBe("");

        vi.advanceTimersByTime(299);
        expect(search.get()).toBe("");

        vi.advanceTimersByTime(1);
        expect(search.get()).toBe("hello");
      });

      it("supports custom debounce delay", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelDebounce500 = "search";

        const search = signal("");
        mount(input, { search });

        input.value = "test";
        input.dispatchEvent(new Event("input"));

        vi.advanceTimersByTime(499);
        expect(search.get()).toBe("");

        vi.advanceTimersByTime(1);
        expect(search.get()).toBe("test");
      });

      it("resets timer on subsequent inputs", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelDebounce100 = "value";

        const value = signal("");
        mount(input, { value });

        input.value = "a";
        input.dispatchEvent(new Event("input"));
        vi.advanceTimersByTime(50);

        input.value = "ab";
        input.dispatchEvent(new Event("input"));
        vi.advanceTimersByTime(50);

        expect(value.get()).toBe("");

        vi.advanceTimersByTime(50);
        expect(value.get()).toBe("ab");
      });

      it("cancels pending updates on cleanup", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelDebounce100 = "value";

        const value = signal("");
        const cleanup = mount(input, { value });

        input.value = "test";
        input.dispatchEvent(new Event("input"));

        vi.advanceTimersByTime(50);
        cleanup();

        vi.advanceTimersByTime(100);
        expect(value.get()).toBe("");
      });
    });

    describe("modifier combinations", () => {
      it("combines .number and .trim", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelNumberTrim = "value";

        const value = signal(0);
        mount(input, { value });

        input.value = "  42  ";
        input.dispatchEvent(new Event("input"));

        expect(value.get()).toBe(42);
      });

      it("combines .trim and .lazy", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelTrimLazy = "value";

        const value = signal("");
        mount(input, { value });

        input.value = "  test  ";
        input.dispatchEvent(new Event("input"));
        expect(value.get()).toBe("");

        input.dispatchEvent(new Event("change"));
        expect(value.get()).toBe("test");
      });

      it("combines .number and .debounce", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelNumberDebounce100 = "value";

        const value = signal(0);
        mount(input, { value });

        input.value = "123";
        input.dispatchEvent(new Event("input"));

        expect(value.get()).toBe(0);

        vi.advanceTimersByTime(100);
        expect(value.get()).toBe(123);
      });

      it("combines .trim, .number, and .debounce", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.voltModelTrimNumberDebounce100 = "value";

        const value = signal(0);
        mount(input, { value });

        input.value = "  456  ";
        input.dispatchEvent(new Event("input"));

        expect(value.get()).toBe(0);

        vi.advanceTimersByTime(100);
        expect(value.get()).toBe(456);
      });
    });
  });

  describe("data-volt-bind modifiers", () => {
    describe(".number modifier", () => {
      it("coerces attribute values to numbers", () => {
        const div = document.createElement("div");
        div.dataset.voltBindValueNumber = "count";

        const count = signal(42);
        mount(div, { count });

        expect(div.getAttribute("value")).toBe("42");

        count.set(100);
        expect(div.getAttribute("value")).toBe("100");
      });

      it("handles string expressions with .number", () => {
        const div = document.createElement("div");
        div.dataset.voltBindPriceNumber = "'  123  '";

        mount(div, {});

        expect(div.getAttribute("price")).toBe("123");
      });
    });

    describe(".trim modifier", () => {
      it("trims attribute values", () => {
        const div = document.createElement("div");
        div.dataset.voltBindTitleTrim = "title";

        const title = signal("  Hello World  ");
        mount(div, { title });

        expect(div.getAttribute("title")).toBe("Hello World");
      });

      it("handles expressions that evaluate to strings", () => {
        const div = document.createElement("div");
        div.dataset.voltBindNameTrim = "'  test  '";

        mount(div, {});

        expect(div.getAttribute("name")).toBe("test");
      });
    });

    describe("modifier combinations", () => {
      it("combines .trim and .number", () => {
        const div = document.createElement("div");
        div.dataset.voltBindValueTrimNumber = "value";

        const value = signal("  42  ");
        mount(div, { value });

        expect(div.getAttribute("value")).toBe("42");
      });
    });
  });

  describe("signal synchronization", () => {
    it("updates input value when signal changes", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.dataset.voltModelNumber = "count";

      const count = signal(10);
      mount(input, { count });

      expect(input.value).toBe("10");

      count.set(20);
      expect(input.value).toBe("20");
    });

    it("maintains two-way binding with .number modifier", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.dataset.voltModelNumber = "value";

      const value = signal(5);
      mount(input, { value });

      expect(input.value).toBe("5");

      value.set(10);
      expect(input.value).toBe("10");

      input.value = "15";
      input.dispatchEvent(new Event("input"));
      expect(value.get()).toBe(15);
    });
  });
});
