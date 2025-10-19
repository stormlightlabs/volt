import { evaluate } from "$core/evaluator";
import { signal } from "$core/signal";
import { describe, expect, it } from "vitest";

describe("evaluator security", () => {
  describe("prototype pollution prevention", () => {
    it("blocks __proto__ property access", () => {
      const scope = { obj: {} };
      expect(evaluate("obj.__proto__", scope)).toBe(undefined);
    });

    it("blocks __proto__ assignment attempts", () => {
      const scope = { obj: {} };
      const result = evaluate("obj['__proto__']", scope);
      expect(result).toBe(undefined);
    });

    it("blocks prototype property access", () => {
      const scope = { arr: [] };
      expect(evaluate("arr.prototype", scope)).toBe(undefined);
    });

    it("blocks constructor property on objects", () => {
      const scope = { obj: {} };
      expect(evaluate("obj.constructor", scope)).toBe(undefined);
    });

    it("blocks constructor property on arrays", () => {
      const scope = { arr: [1, 2, 3] };
      expect(evaluate("arr.constructor", scope)).toBe(undefined);
    });

    it("blocks constructor property on strings", () => {
      const scope = { text: "hello" };
      expect(evaluate("text.constructor", scope)).toBe(undefined);
    });

    it("blocks nested constructor access", () => {
      const scope = { obj: { nested: {} } };
      expect(evaluate("obj.nested.constructor", scope)).toBe(undefined);
    });

    it("blocks bracket notation __proto__ access", () => {
      const scope = { obj: {}, key: "__proto__" };
      expect(evaluate("obj[key]", scope)).toBe(undefined);
    });

    it("blocks bracket notation constructor access", () => {
      const scope = { obj: {}, key: "constructor" };
      expect(evaluate("obj[key]", scope)).toBe(undefined);
    });

    it("blocks bracket notation prototype access", () => {
      const scope = { obj: {}, key: "prototype" };
      expect(evaluate("obj[key]", scope)).toBe(undefined);
    });
  });

  describe("sandbox escape prevention", () => {
    it("blocks direct constructor access from scope", () => {
      const scope = { constructor: function() {} };
      expect(evaluate("constructor", scope)).toBe(undefined);
    });

    it("blocks direct __proto__ access from scope", () => {
      const scope = { __proto__: {} };
      expect(evaluate("__proto__", scope)).toBe(undefined);
    });

    it("blocks direct prototype access from scope", () => {
      const scope = { prototype: {} };
      expect(evaluate("prototype", scope)).toBe(undefined);
    });

    it("prevents Function constructor access via constructor.constructor", () => {
      const scope = { fn: () => {} };
      expect(evaluate("fn.constructor", scope)).toBe(undefined);
    });

    it("prevents calling dangerous global functions", () => {
      const scope = { Function: globalThis.Function, eval: globalThis.eval };
      expect(evaluate("Function", scope)).toBe(undefined);
      expect(evaluate("eval", scope)).toBe(undefined);
    });
  });

  describe("method call security", () => {
    it("blocks constructor method calls", () => {
      const scope = { obj: {} };
      expect(evaluate("obj.constructor()", scope)).toBe(undefined);
    });

    it("blocks __proto__ method calls", () => {
      const scope = { obj: {} };
      expect(evaluate("obj.__proto__()", scope)).toBe(undefined);
    });

    it("allows safe method calls", () => {
      const scope = { text: "hello" };
      expect(evaluate("text.toUpperCase()", scope)).toBe("HELLO");
      expect(evaluate("text.substring(0, 3)", scope)).toBe("hel");
    });

    it("allows safe array method calls", () => {
      const scope = { items: [1, 2, 3] };
      expect(evaluate("items.slice(1)", scope)).toEqual([2, 3]);
      expect(evaluate("items.map(x => x * 2)", scope)).toEqual([2, 4, 6]);
    });
  });

  describe("object literal security", () => {
    it("allows creating safe object literals", () => {
      expect(evaluate("{ name: 'test', value: 42 }", {})).toEqual({ name: "test", value: 42 });
    });

    it("blocks dangerous keys in object literals", () => {
      expect(evaluate("{ __proto__: { polluted: true } }", {})).toBe(undefined);
    });

    it("blocks constructor key in object literals", () => {
      expect(evaluate("{ constructor: 'bad' }", {})).toBe(undefined);
    });

    it("blocks prototype key in object literals", () => {
      expect(evaluate("{ prototype: 'bad' }", {})).toBe(undefined);
    });
  });

  describe("array literal security", () => {
    it("allows creating safe array literals", () => {
      expect(evaluate("[1, 2, 3]", {})).toEqual([1, 2, 3]);
    });

    it("allows spreading safe arrays", () => {
      const scope = { items: [1, 2, 3] };
      expect(evaluate("[0, ...items, 4]", scope)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("arrow function security", () => {
    it("allows safe arrow functions", () => {
      const scope = { items: [1, 2, 3] };
      expect(evaluate("items.map(x => x * 2)", scope)).toEqual([2, 4, 6]);
    });

    it("blocks dangerous property access in arrow functions", () => {
      const scope = { items: [{}] };
      expect(evaluate("items.map(x => x.__proto__)", scope)).toBe(undefined);
    });

    it("blocks constructor access in arrow functions", () => {
      const scope = { items: [{}] };
      expect(evaluate("items.map(x => x.constructor)", scope)).toBe(undefined);
    });
  });

  describe("signal security", () => {
    it("allows accessing signal values safely", () => {
      const scope = { count: signal(5) };
      expect(evaluate("count", scope)).toBe(5);
    });

    it("allows calling signal methods", () => {
      const count = signal(5);
      const scope = { count };
      expect(evaluate("count.get()", scope)).toBe(5);
    });

    it("blocks dangerous property access on signals", () => {
      const count = signal(5);
      const scope = { count };
      expect(evaluate("count.constructor", scope)).toBe(undefined);
    });
  });

  describe("nested security", () => {
    it("blocks nested __proto__ access chains", () => {
      const scope = { a: { b: { c: {} } } };
      expect(evaluate("a.b.c.__proto__", scope)).toBe(undefined);
    });

    it("blocks mixed access patterns", () => {
      const scope = { obj: { arr: [{}] } };
      expect(evaluate("obj.arr[0].__proto__", scope)).toBe(undefined);
      expect(evaluate("obj.arr[0].constructor", scope)).toBe(undefined);
    });

    it("prevents prototype pollution via spread (enumerable properties only)", () => {
      const scope = { malicious: { constructor: "bad", normalProp: "ok" } };
      expect(evaluate("{ ...malicious }", scope)).toBe(undefined);
    });
  });

  describe("real-world attack scenarios", () => {
    it("prevents prototype pollution via object assignment", () => {
      const scope = { target: {}, key: "__proto__", value: { polluted: true } };
      expect(evaluate("target[key]", scope)).toBe(undefined);
    });

    it("prevents constructor.constructor access pattern", () => {
      const scope = { fn: () => {} };
      expect(evaluate("fn.constructor.constructor", scope)).toBe(undefined);
    });

    it("prevents accessing Function by name even if in scope", () => {
      const scope = { Function: globalThis.Function, eval: globalThis.eval };

      expect(evaluate("Function", scope)).toBe(undefined);
      expect(evaluate("eval", scope)).toBe(undefined);
    });

    it("prevents eval through constructor chain", () => {
      const scope = { arr: [] };
      expect(evaluate("arr.constructor.constructor", scope)).toBe(undefined);
    });
  });

  describe("legitimate use cases still work", () => {
    it("allows normal property access", () => {
      const scope = { user: { name: "Alice", age: 30 } };
      expect(evaluate("user.name", scope)).toBe("Alice");
      expect(evaluate("user.age", scope)).toBe(30);
    });

    it("allows array operations", () => {
      const scope = { items: [1, 2, 3, 4, 5] };
      expect(evaluate("items.length", scope)).toBe(5);
      expect(evaluate("items[0]", scope)).toBe(1);
      expect(evaluate("items.slice(1, 3)", scope)).toEqual([2, 3]);
    });

    it("allows string operations", () => {
      const scope = { text: "hello world" };
      expect(evaluate("text.length", scope)).toBe(11);
      expect(evaluate("text.toUpperCase()", scope)).toBe("HELLO WORLD");
      expect(evaluate("text.substring(0, 5)", scope)).toBe("hello");
    });

    it("allows object creation", () => {
      expect(evaluate("{ active: true, count: 5 }", {})).toEqual({ active: true, count: 5 });
    });

    it("allows array creation", () => {
      expect(evaluate("[1, 2, 3]", {})).toEqual([1, 2, 3]);
    });

    it("allows function composition", () => {
      const scope = { items: [1, 2, 3, 4, 5] };
      expect(evaluate("items.filter(x => x > 2).map(x => x * 2)", scope)).toEqual([6, 8, 10]);
    });

    it("allows complex expressions", () => {
      const scope = { count: 5, limit: 10, items: [1, 2, 3] };
      expect(evaluate("count < limit && items.length > 0", scope)).toBe(true);
    });

    it("allows ternary with safe operations", () => {
      const scope = { count: 5 };
      expect(evaluate("count > 0 ? 'positive' : 'zero'", scope)).toBe("positive");
    });

    it("allows signals in complex expressions", () => {
      const scope = { count: signal(5), limit: 10 };
      expect(evaluate("count * 2 > limit", scope)).toBe(false);
      expect(evaluate("count * 3 > limit", scope)).toBe(true);
    });
  });
});
