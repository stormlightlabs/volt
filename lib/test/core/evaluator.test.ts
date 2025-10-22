import { evaluate, evaluateStatements, EvaluationError } from "$core/evaluator";
import { signal } from "$core/signal";
import type { Scope, Signal } from "$types/volt";
import { beforeEach, describe, expect, it } from "vitest";

describe("Evaluator - Functional Tests", () => {
  let scope: Scope;

  beforeEach(() => {
    scope = {};
  });

  describe("Literals", () => {
    it("should evaluate number literals", () => {
      expect(evaluate("42", scope)).toBe(42);
      expect(evaluate("-10", scope)).toBe(-10);
      expect(evaluate("3.14", scope)).toBe(3.14);
    });

    it("should evaluate string literals", () => {
      expect(evaluate("'hello'", scope)).toBe("hello");
      expect(evaluate("\"world\"", scope)).toBe("world");
      expect(evaluate("\"hello world\"", scope)).toBe("hello world");
    });

    it("should evaluate boolean literals", () => {
      expect(evaluate("true", scope)).toBe(true);
      expect(evaluate("false", scope)).toBe(false);
    });

    it("should evaluate null and undefined", () => {
      expect(evaluate("null", scope)).toBe(null);
      expect(evaluate("undefined", scope)).toBe(undefined);
    });
  });

  describe("Arithmetic Operators", () => {
    it("should handle addition", () => {
      expect(evaluate("1 + 2", scope)).toBe(3);
      expect(evaluate("10 + 5", scope)).toBe(15);
    });

    it("should handle subtraction", () => {
      expect(evaluate("10 - 5", scope)).toBe(5);
      expect(evaluate("5 - 10", scope)).toBe(-5);
    });

    it("should handle multiplication", () => {
      expect(evaluate("3 * 4", scope)).toBe(12);
      expect(evaluate("10 * 0", scope)).toBe(0);
    });

    it("should handle division", () => {
      expect(evaluate("10 / 2", scope)).toBe(5);
      expect(evaluate("7 / 2", scope)).toBe(3.5);
    });

    it("should handle modulo", () => {
      expect(evaluate("10 % 3", scope)).toBe(1);
      expect(evaluate("7 % 2", scope)).toBe(1);
    });

    it("should respect operator precedence", () => {
      expect(evaluate("2 + 3 * 4", scope)).toBe(14);
      expect(evaluate("(2 + 3) * 4", scope)).toBe(20);
    });
  });

  describe("Comparison Operators", () => {
    it("should handle equality", () => {
      expect(evaluate("5 === 5", scope)).toBe(true);
      expect(evaluate("5 === 6", scope)).toBe(false);
      expect(evaluate("5 !== 6", scope)).toBe(true);
      expect(evaluate("5 !== 5", scope)).toBe(false);
    });

    it("should handle relational operators", () => {
      expect(evaluate("5 < 10", scope)).toBe(true);
      expect(evaluate("10 < 5", scope)).toBe(false);
      expect(evaluate("5 > 3", scope)).toBe(true);
      expect(evaluate("3 > 5", scope)).toBe(false);
      expect(evaluate("5 <= 5", scope)).toBe(true);
      expect(evaluate("5 >= 5", scope)).toBe(true);
    });
  });

  describe("Logical Operators", () => {
    it("should handle AND operator", () => {
      expect(evaluate("true && true", scope)).toBe(true);
      expect(evaluate("true && false", scope)).toBe(false);
      expect(evaluate("false && true", scope)).toBe(false);
    });

    it("should handle OR operator", () => {
      expect(evaluate("true || false", scope)).toBe(true);
      expect(evaluate("false || true", scope)).toBe(true);
      expect(evaluate("false || false", scope)).toBe(false);
    });

    it("should handle NOT operator", () => {
      expect(evaluate("!true", scope)).toBe(false);
      expect(evaluate("!false", scope)).toBe(true);
      expect(evaluate("!!true", scope)).toBe(true);
    });
  });

  describe("Ternary Operator", () => {
    it("should evaluate ternary expressions", () => {
      expect(evaluate("true ? 'yes' : 'no'", scope)).toBe("yes");
      expect(evaluate("false ? 'yes' : 'no'", scope)).toBe("no");
      expect(evaluate("5 > 3 ? 'greater' : 'lesser'", scope)).toBe("greater");
    });

    it("should handle nested ternaries", () => {
      expect(evaluate("true ? (false ? 'a' : 'b') : 'c'", scope)).toBe("b");
    });
  });

  describe("Variable Access", () => {
    it("should access scope variables", () => {
      scope.name = "Alice";
      scope.age = 30;
      expect(evaluate("name", scope)).toBe("Alice");
      expect(evaluate("age", scope)).toBe(30);
    });

    it("should return undefined for missing variables", () => {
      expect(evaluate("missing", scope)).toBe(undefined);
    });

    it("should handle variables in expressions", () => {
      scope.x = 10;
      scope.y = 5;
      expect(evaluate("x + y", scope)).toBe(15);
      expect(evaluate("x * y", scope)).toBe(50);
    });
  });

  describe("Property Access", () => {
    it("should access object properties with dot notation", () => {
      scope.user = { name: "Bob", age: 25 };
      expect(evaluate("user.name", scope)).toBe("Bob");
      expect(evaluate("user.age", scope)).toBe(25);
    });

    it("should access object properties with bracket notation", () => {
      scope.user = { name: "Charlie", age: 35 };
      expect(evaluate("user['name']", scope)).toBe("Charlie");
      expect(evaluate("user['age']", scope)).toBe(35);
    });

    it("should access nested properties", () => {
      scope.data = { user: { profile: { name: "Dave" } } };
      expect(evaluate("data.user.profile.name", scope)).toBe("Dave");
    });

    it("should access array elements", () => {
      scope.items = [10, 20, 30];
      expect(evaluate("items[0]", scope)).toBe(10);
      expect(evaluate("items[1]", scope)).toBe(20);
      expect(evaluate("items[2]", scope)).toBe(30);
    });
  });

  describe("Function Calls", () => {
    it("should call scope functions", () => {
      scope.double = (x: number) => x * 2;
      expect(evaluate("double(5)", scope)).toBe(10);
    });

    it("should call functions with multiple arguments", () => {
      scope.add = (a: number, b: number) => a + b;
      expect(evaluate("add(3, 7)", scope)).toBe(10);
    });

    it("should call object methods", () => {
      scope.calc = { multiply: (a: number, b: number) => a * b };
      expect(evaluate("calc.multiply(4, 5)", scope)).toBe(20);
    });

    it("should call safe global functions", () => {
      expect(evaluate("Math.max(10, 20)", scope)).toBe(20);
      expect(evaluate("Math.min(10, 20)", scope)).toBe(10);
      expect(evaluate("Math.abs(-5)", scope)).toBe(5);
    });
  });

  describe("Array Literals", () => {
    it("should create array literals", () => {
      const result = evaluate("[1, 2, 3]", scope);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle empty arrays", () => {
      const result = evaluate("[]", scope);
      expect(result).toEqual([]);
    });

    it("should handle arrays with expressions", () => {
      scope.x = 10;
      const result = evaluate("[x, x + 1, x + 2]", scope);
      expect(result).toEqual([10, 11, 12]);
    });

    it("should handle spread in arrays", () => {
      scope.arr = [2, 3, 4];
      const result = evaluate("[1, ...arr, 5]", scope);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("Object Literals", () => {
    it("should create object literals", () => {
      const result = evaluate("{ name: 'Alice', age: 30 }", scope);
      expect(result).toEqual({ name: "Alice", age: 30 });
    });

    it("should handle empty objects", () => {
      const result = evaluate("{}", scope);
      expect(result).toEqual({});
    });

    it("should handle objects with computed values", () => {
      scope.x = 10;
      const result = evaluate("{ value: x, double: x * 2 }", scope);
      expect(result).toEqual({ value: 10, double: 20 });
    });

    it("should handle spread in objects", () => {
      scope.base = { a: 1, b: 2 };
      const result = evaluate("{ ...base, c: 3 }", scope);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe("Arrow Functions", () => {
    it("should support arrow functions", () => {
      const fn = evaluate("(x) => x * 2", scope) as (x: number) => number;
      expect(fn(5)).toBe(10);
    });

    it("should support arrow functions with no parameters", () => {
      const fn = evaluate("() => 42", scope) as () => number;
      expect(fn()).toBe(42);
    });

    it("should support arrow functions with multiple parameters", () => {
      const fn = evaluate("(a, b) => a + b", scope) as (a: number, b: number) => number;
      expect(fn(3, 7)).toBe(10);
    });

    it("should support arrow functions that capture scope", () => {
      scope.multiplier = 3;
      const fn = evaluate("(x) => x * multiplier", scope) as (x: number) => number;
      expect(fn(5)).toBe(15);
    });
  });

  describe("Signal Auto-Unwrapping", () => {
    it("should auto-unwrap signals on read", () => {
      scope.count = signal(10);
      expect(evaluate("count", scope)).toBe(10);
    });

    it("should auto-unwrap signals in expressions", () => {
      scope.count = signal(5);
      expect(evaluate("count + 10", scope)).toBe(15);
      expect(evaluate("count * 2", scope)).toBe(10);
    });

    it("should auto-unwrap nested signal properties", () => {
      scope.user = signal({ name: "Alice", age: 30 });
      expect(evaluate("user.name", scope)).toBe("Alice");
      expect(evaluate("user.age", scope)).toBe(30);
    });

    it("should allow signal.set() calls", () => {
      scope.count = signal(10);
      evaluateStatements("count.set(20)", scope);
      expect((scope.count as Signal<number>).get()).toBe(20);
    });

    it("should support strict equality comparisons with signals", () => {
      scope.status = signal("active");
      scope.page = signal("home");
      expect(evaluate("status === 'active'", scope)).toBe(true);
      expect(evaluate("status === 'inactive'", scope)).toBe(false);
      expect(evaluate("page === 'home'", scope)).toBe(true);
      expect(evaluate("page === 'about'", scope)).toBe(false);
    });

    it("should support loose equality comparisons with signals", () => {
      scope.status = signal("active");
      expect(evaluate("status == 'active'", scope)).toBe(true);
      expect(evaluate("status == 'inactive'", scope)).toBe(false);
    });
  });

  describe("Expression Caching", () => {
    it("should cache compiled expressions", () => {
      const expr = "x + y";
      scope.x = 10;
      scope.y = 5;

      const result1 = evaluate(expr, scope);
      const result2 = evaluate(expr, scope);

      expect(result1).toBe(15);
      expect(result2).toBe(15);
    });

    it("should cache statement expressions separately", () => {
      scope.x = 10;

      evaluateStatements("x = 20", scope);
      expect(scope.x).toBe(20);

      const result = evaluate("x", scope);
      expect(result).toBe(20);
    });
  });

  describe("Statement Evaluation", () => {
    it("should execute single statements", () => {
      scope.x = 10;
      evaluateStatements("x = 20", scope);
      expect(scope.x).toBe(20);
    });

    it("should execute multiple statements", () => {
      scope.x = 1;
      scope.y = 2;
      evaluateStatements("x = 10; y = 20", scope);
      expect(scope.x).toBe(10);
      expect(scope.y).toBe(20);
    });

    it("should allow function calls in statements", () => {
      scope.log = [];
      scope.add = (value: number) => {
        (scope.log as number[]).push(value);
      };
      evaluateStatements("add(1); add(2); add(3)", scope);
      expect(scope.log).toEqual([1, 2, 3]);
    });
  });

  describe("Error Handling", () => {
    it("should throw EvaluationError for invalid syntax", () => {
      expect(() => evaluate("1 +", scope)).toThrow(EvaluationError);
    });

    it("should throw EvaluationError for runtime errors", () => {
      expect(() => evaluate("undefined.property", scope)).toThrow(EvaluationError);
    });

    it("should include expression in error message", () => {
      try {
        evaluate("1 +", scope);
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        expect((error as EvaluationError).expr).toBe("1 +");
      }
    });

    it("should preserve original error cause", () => {
      try {
        evaluate("undefined.property", scope);
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        expect((error as EvaluationError).cause).toBeDefined();
      }
    });
  });
});
