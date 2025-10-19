import { findScopedSignal, getComputedAttributes, isNil, isSignal, kebabToCamel } from "$core/shared";
import { signal } from "$core/signal";
import { describe, expect, it } from "vitest";

describe("shared utilities", () => {
  describe("isNil", () => {
    it.each([
      { value: null, expected: true, label: "null" },
      { value: undefined, expected: true, label: "undefined" },
      { value: 0, expected: false, label: "0" },
      { value: "", expected: false, label: "empty string" },
      { value: false, expected: false, label: "false" },
      { value: {}, expected: false, label: "empty object" },
      { value: [], expected: false, label: "empty array" },
      { value: Number.NaN, expected: false, label: "NaN" },
      { value: "test", expected: false, label: "string" },
      { value: 42, expected: false, label: "number" },
      { value: true, expected: false, label: "true" },
      { value: { a: 1 }, expected: false, label: "object" },
      { value: [1, 2], expected: false, label: "array" },
    ])("returns $expected for $label", ({ value, expected }) => {
      expect(isNil(value)).toBe(expected);
    });
  });

  describe("kebabToCamel", () => {
    it.each([
      { input: "hello-world", expected: "helloWorld" },
      { input: "font-size", expected: "fontSize" },
      { input: "background-color", expected: "backgroundColor" },
      { input: "data-volt-text", expected: "dataVoltText" },
      { input: "simple", expected: "simple" },
      { input: "a-b-c-d", expected: "aBCD" },
      { input: "", expected: "" },
    ])("converts '$input' to '$expected'", ({ input, expected }) => {
      expect(kebabToCamel(input)).toBe(expected);
    });
  });

  describe("isSignal", () => {
    it("returns true for signals", () => {
      const sig = signal(0);
      expect(isSignal(sig)).toBe(true);
    });

    it.each([
      { value: null, label: "null" },
      { value: undefined, label: "undefined" },
      { value: 42, label: "number" },
      { value: "test", label: "string" },
      { value: {}, label: "empty object" },
      { value: { get: "not a function" }, label: "object with get property" },
      { value: { get: () => {} }, label: "object with only get method" },
      { value: { subscribe: () => {} }, label: "object with only subscribe method" },
    ])("returns false for $label", ({ value }) => {
      expect(isSignal(value)).toBe(false);
    });
  });

  describe("findScopedSignal", () => {
    it("finds signal at top level", () => {
      const count = signal(5);
      const scope = { count };

      const found = findScopedSignal(scope, "count");
      expect(found).toBe(count);
    });

    it("finds signal in nested path", () => {
      const count = signal(5);
      const scope = { user: { stats: { count } } };

      const found = findScopedSignal(scope, "user.stats.count");
      expect(found).toBe(count);
    });

    it("returns undefined for non-existent path", () => {
      const scope = { count: signal(5) };

      const found = findScopedSignal(scope, "missing");
      expect(found).toBeUndefined();
    });

    it("returns undefined for non-signal values", () => {
      const scope = { value: 42 };

      const found = findScopedSignal(scope, "value");
      expect(found).toBeUndefined();
    });

    it("returns undefined when traversing through null", () => {
      const scope = { user: null };
      const found = findScopedSignal(scope, "user.name");
      expect(found).toBeUndefined();
    });

    it("handles whitespace in path", () => {
      const count = signal(5);
      const scope = { count };
      const found = findScopedSignal(scope, "  count  ");
      expect(found).toBe(count);
    });
  });

  describe("getComputedAttributes", () => {
    it("extracts computed attributes from element", () => {
      const element = document.createElement("div");
      element.dataset["voltComputed:doubled"] = "count * 2";
      element.dataset["voltComputed:tripled"] = "count * 3";

      const computed = getComputedAttributes(element);
      expect(computed.size).toBe(2);
      expect(computed.get("doubled")).toBe("count * 2");
      expect(computed.get("tripled")).toBe("count * 3");
    });

    it("converts kebab-case names to camelCase", () => {
      const element = document.createElement("div");
      element.dataset["voltComputed:fullName"] = "firstName + ' ' + lastName";

      const computed = getComputedAttributes(element);
      expect(computed.get("fullName")).toBe("firstName + ' ' + lastName");
    });

    it("returns empty map when no computed attributes", () => {
      const element = document.createElement("div");
      element.dataset.voltText = "message";

      const computed = getComputedAttributes(element);
      expect(computed.size).toBe(0);
    });

    it("ignores non-computed data-volt attributes", () => {
      const element = document.createElement("div");
      element.dataset.voltText = "message";
      element.dataset["voltComputed:value"] = "count * 2";
      element.dataset.voltShow = "visible";

      const computed = getComputedAttributes(element);
      expect(computed.size).toBe(1);
      expect(computed.get("value")).toBe("count * 2");
    });
  });
});
