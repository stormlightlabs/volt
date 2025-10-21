import { evaluate, evaluateStatements } from "$core/evaluator";
import type { Scope } from "$types/volt";
import { describe, expect, it } from "vitest";

describe("Evaluator - Security Tests", () => {
  describe("Prototype Pollution Protection", () => {
    it("should block __proto__ access", () => {
      const scope: Scope = {};
      const result = evaluate("__proto__", scope);
      expect(result).toBe(undefined);
    });

    it("should block __proto__ assignment", () => {
      const scope: Scope = {};
      evaluateStatements("__proto__ = {}", scope);
      expect(Object.hasOwn(scope, "__proto__")).toBe(false);
    });

    it("should block constructor access", () => {
      const scope: Scope = { obj: {} };
      expect(evaluate("obj.constructor", scope)).toBe(undefined);
    });

    it("should block constructor.prototype access", () => {
      const scope: Scope = { obj: {} };
      expect(() => evaluate("obj.constructor.prototype", scope)).toThrow();
    });

    it("should block prototype property access", () => {
      const scope: Scope = { fn: () => {} };
      expect(evaluate("fn.prototype", scope)).toBe(undefined);
    });
  });

  describe("Dangerous Global Blocking", () => {
    it("should block Function constructor access", () => {
      const scope: Scope = {};
      const result = evaluate("Function", scope);
      expect(result).toBe(undefined);
    });

    it("should block eval access", () => {
      const scope: Scope = {};
      const result = evaluate("eval", scope);
      expect(result).toBe(undefined);
    });

    it("should block globalThis access", () => {
      const scope: Scope = {};
      const result = evaluate("globalThis", scope);
      expect(result).toBe(undefined);
    });

    it("should block window access", () => {
      const scope: Scope = {};
      expect(evaluate("window", scope)).toBe(undefined);
    });

    it("should block self access", () => {
      const scope: Scope = {};
      expect(evaluate("self", scope)).toBe(undefined);
    });

    it("should block import access", () => {
      const scope: Scope = {};
      expect(() => evaluate("import", scope)).toThrow();
    });
  });

  describe("Constructor Escape Protection", () => {
    it("should prevent constructor escape via array", () => {
      const scope: Scope = { arr: [] };
      expect(evaluate("arr.constructor", scope)).toBe(undefined);
    });

    it("should prevent constructor escape via object", () => {
      const scope: Scope = { obj: {} };
      expect(evaluate("obj.constructor", scope)).toBe(undefined);
    });

    it("should prevent constructor escape via function", () => {
      const scope: Scope = { fn: () => {} };
      expect(evaluate("fn.constructor", scope)).toBe(undefined);
    });

    it("should prevent prototype chain traversal", () => {
      const scope: Scope = { obj: {} };
      expect(evaluate("obj.__proto__", scope)).toBe(undefined);
    });
  });

  describe("Safe Global Access", () => {
    it("should allow Math access", () => {
      const scope: Scope = {};
      expect(evaluate("Math.PI", scope)).toBe(Math.PI);
      expect(evaluate("Math.max(10, 20)", scope)).toBe(20);
    });

    it("should allow Date access", () => {
      const scope: Scope = {};
      const result = evaluate("Date.now()", scope);
      expect(typeof result).toBe("number");
    });

    it("should allow String access", () => {
      const scope: Scope = {};
      expect(evaluate("String(123)", scope)).toBe("123");
    });

    it("should allow Number access", () => {
      const scope: Scope = {};
      expect(evaluate("Number('42')", scope)).toBe(42);
    });

    it("should allow Boolean access", () => {
      const scope: Scope = {};
      expect(evaluate("Boolean(1)", scope)).toBe(true);
    });

    it("should allow Array access", () => {
      const scope: Scope = {};
      const result = evaluate("Array.isArray([])", scope);
      expect(result).toBe(true);
    });

    it("should allow Object access for safe methods", () => {
      const scope: Scope = {};
      const result = evaluate("Object.keys({ a: 1, b: 2 })", scope);
      expect(result).toEqual(["a", "b"]);
    });

    it("should allow JSON access", () => {
      const scope: Scope = {};
      const result = evaluate("JSON.parse('{\"key\":\"value\"}')", scope);
      expect(result).toEqual({ key: "value" });
    });

    it("should allow console access", () => {
      const scope: Scope = {};
      expect(() => evaluate("console", scope)).not.toThrow();
    });
  });

  describe("Scope Isolation", () => {
    it("should not leak variables between scopes", () => {
      const scope1: Scope = { secret: "value1" };
      const scope2: Scope = { secret: "value2" };

      expect(evaluate("secret", scope1)).toBe("value1");
      expect(evaluate("secret", scope2)).toBe("value2");
    });

    it("should return undefined for missing variables", () => {
      const scope: Scope = {};
      expect(evaluate("missing", scope)).toBe(undefined);
    });

    it("should not allow access to scope object internals", () => {
      const scope: Scope = { value: 42 };
      const result = evaluate("constructor", scope);
      expect(result).toBe(undefined);
    });
  });

  describe("Safe Property Names", () => {
    it("should allow normal property names", () => {
      const scope: Scope = { user: { name: "Alice", age: 30 } };
      expect(evaluate("user.name", scope)).toBe("Alice");
      expect(evaluate("user.age", scope)).toBe(30);
    });

    it("should allow underscore-prefixed properties", () => {
      const scope: Scope = { _private: "value" };
      expect(evaluate("_private", scope)).toBe("value");
    });

    it("should allow dollar-prefixed properties", () => {
      const scope: Scope = { $special: "value" };
      expect(evaluate("$special", scope)).toBe("value");
    });

    it("should allow numeric property access", () => {
      const scope: Scope = { items: ["a", "b", "c"] };
      expect(evaluate("items[0]", scope)).toBe("a");
      expect(evaluate("items[1]", scope)).toBe("b");
    });
  });

  describe("Attack Vector Prevention", () => {
    it("should prevent prototype pollution via __proto__", () => {
      const scope: Scope = { obj: {} };
      expect(() => evaluateStatements("obj.__proto__.polluted = true", scope)).toThrow();
      expect((Object.prototype as Record<string, unknown>).polluted).toBe(undefined);
    });

    it("should prevent prototype pollution via constructor.prototype", () => {
      const scope: Scope = { obj: {} };
      expect(() => evaluateStatements("obj.constructor.prototype.polluted = true", scope)).toThrow();
      expect((Object.prototype as Record<string, unknown>).polluted).toBe(undefined);
    });

    it("should prevent code injection via Function constructor", () => {
      const scope: Scope = { code: "alert('xss')" };
      expect(() => evaluate("Function(code)", scope)).toThrow(/not a function/);
    });

    it("should prevent code injection via eval", () => {
      const scope: Scope = { code: "console.log('test')" };
      expect(() => evaluate("eval(code)", scope)).toThrow(/not a function/);
    });

    it("should prevent indirect eval via globalThis", () => {
      const scope: Scope = { code: "console.log('test')" };
      expect(() => evaluate("globalThis.eval(code)", scope)).toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null values safely", () => {
      const scope: Scope = { value: null };
      expect(evaluate("value", scope)).toBe(null);
    });

    it("should handle undefined values safely", () => {
      const scope: Scope = { value: undefined };
      expect(evaluate("value", scope)).toBe(undefined);
    });

    it("should handle empty strings safely", () => {
      const scope: Scope = { value: "" };
      expect(evaluate("value", scope)).toBe("");
    });

    it("should handle symbol keys safely", () => {
      const scope: Scope = {};
      const sym = Symbol("test");
      scope[sym as unknown as string] = "value";
      expect(evaluate("test", scope)).toBe(undefined);
    });
  });

  describe("Object.create(null) Protection", () => {
    it("should work with null-prototype objects", () => {
      const scope: Scope = { nullProto: Object.create(null) };
      // @ts-expect-error cast from unknown
      scope.nullProto.value = 42;
      expect(evaluate("nullProto.value", scope)).toBe(42);
    });

    it("should prevent attacks on null-prototype objects", () => {
      const scope: Scope = { nullProto: Object.create(null) };
      // constructor property is blocked, returns undefined
      expect(evaluate("nullProto.constructor", scope)).toBe(undefined);
    });
  });
});
