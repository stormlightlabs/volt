import { evaluate } from "@volt/core/evaluator";
import { signal } from "@volt/core/signal";
import { describe, expect, it } from "vitest";

describe("evaluator", () => {
  describe("literals", () => {
    it("evaluates boolean literals", () => {
      expect(evaluate("true", {})).toBe(true);
      expect(evaluate("false", {})).toBe(false);
    });

    it("evaluates null and undefined", () => {
      expect(evaluate("null", {})).toBe(null);
      expect(evaluate("undefined", {})).toBe(undefined);
    });

    it("evaluates number literals", () => {
      expect(evaluate("42", {})).toBe(42);
      expect(evaluate("3.14", {})).toBe(3.14);
      expect(evaluate("0", {})).toBe(0);
      expect(evaluate("-5", {})).toBe(-5);
      expect(evaluate("-3.5", {})).toBe(-3.5);
    });

    it("evaluates string literals", () => {
      expect(evaluate("'hello'", {})).toBe("hello");
      expect(evaluate("\"world\"", {})).toBe("world");
      expect(evaluate("'multi word string'", {})).toBe("multi word string");
      expect(evaluate("''", {})).toBe("");
    });

    it("handles escaped characters in strings", () => {
      expect(evaluate(String.raw`'it\'s'`, {})).toBe("it's");
      expect(evaluate(String.raw`"say \"hi\""`, {})).toBe("say \"hi\"");
    });
  });

  describe("property access", () => {
    it("resolves simple identifiers", () => {
      const scope = { count: 5, name: "Alice" };
      expect(evaluate("count", scope)).toBe(5);
      expect(evaluate("name", scope)).toBe("Alice");
    });

    it("resolves nested property paths with dot notation", () => {
      const scope = { user: { name: "Bob", age: 30 } };
      expect(evaluate("user.name", scope)).toBe("Bob");
      expect(evaluate("user.age", scope)).toBe(30);
    });

    it("resolves array elements with bracket notation", () => {
      const scope = { items: ["first", "second", "third"], index: 1 };
      expect(evaluate("items[0]", scope)).toBe("first");
      expect(evaluate("items[1]", scope)).toBe("second");
      expect(evaluate("items[index]", scope)).toBe("second");
    });

    it("handles mixed dot and bracket notation", () => {
      const scope = { data: { users: [{ name: "Alice" }, { name: "Bob" }] } };
      expect(evaluate("data.users[0].name", scope)).toBe("Alice");
      expect(evaluate("data.users[1].name", scope)).toBe("Bob");
    });

    it("returns undefined for missing properties", () => {
      const scope = { exists: 42 };
      expect(evaluate("missing", scope)).toBe(undefined);
      expect(evaluate("exists.nested", scope)).toBe(undefined);
    });

    it("auto-unwraps signals", () => {
      const scope = { count: signal(10), user: { age: signal(25) } };
      expect(evaluate("count", scope)).toBe(10);
      expect(evaluate("user.age", scope)).toBe(25);
    });
  });

  describe("arithmetic operators", () => {
    it("evaluates addition", () => {
      expect(evaluate("5 + 3", {})).toBe(8);
      expect(evaluate("10 + 20 + 30", {})).toBe(60);
    });

    it("evaluates subtraction", () => {
      expect(evaluate("10 - 3", {})).toBe(7);
      expect(evaluate("100 - 20 - 5", {})).toBe(75);
    });

    it("evaluates multiplication", () => {
      expect(evaluate("5 * 3", {})).toBe(15);
      expect(evaluate("2 * 3 * 4", {})).toBe(24);
    });

    it("evaluates division", () => {
      expect(evaluate("10 / 2", {})).toBe(5);
      expect(evaluate("100 / 4 / 5", {})).toBe(5);
    });

    it("evaluates modulo", () => {
      expect(evaluate("10 % 3", {})).toBe(1);
      expect(evaluate("7 % 2", {})).toBe(1);
      expect(evaluate("8 % 4", {})).toBe(0);
    });

    it("respects operator precedence", () => {
      expect(evaluate("2 + 3 * 4", {})).toBe(14);
      expect(evaluate("10 - 2 * 3", {})).toBe(4);
      expect(evaluate("20 / 4 + 3", {})).toBe(8);
      expect(evaluate("10 % 3 + 2", {})).toBe(3);
    });

    it("evaluates with variables", () => {
      const scope = { a: 5, b: 3, c: signal(2) };
      expect(evaluate("a + b", scope)).toBe(8);
      expect(evaluate("a * b", scope)).toBe(15);
      expect(evaluate("a + c", scope)).toBe(7);
      expect(evaluate("a * b + c", scope)).toBe(17);
    });
  });

  describe("comparison operators", () => {
    it("evaluates strict equality", () => {
      expect(evaluate("5 === 5", {})).toBe(true);
      expect(evaluate("5 === 3", {})).toBe(false);
      expect(evaluate("'hello' === 'hello'", {})).toBe(true);
      expect(evaluate("'hello' === 'world'", {})).toBe(false);
      expect(evaluate("true === true", {})).toBe(true);
      expect(evaluate("true === false", {})).toBe(false);
    });

    it("evaluates strict inequality", () => {
      expect(evaluate("5 !== 3", {})).toBe(true);
      expect(evaluate("5 !== 5", {})).toBe(false);
      expect(evaluate("'hello' !== 'world'", {})).toBe(true);
    });

    it("evaluates less than", () => {
      expect(evaluate("3 < 5", {})).toBe(true);
      expect(evaluate("5 < 3", {})).toBe(false);
      expect(evaluate("5 < 5", {})).toBe(false);
    });

    it("evaluates greater than", () => {
      expect(evaluate("5 > 3", {})).toBe(true);
      expect(evaluate("3 > 5", {})).toBe(false);
      expect(evaluate("5 > 5", {})).toBe(false);
    });

    it("evaluates less than or equal", () => {
      expect(evaluate("3 <= 5", {})).toBe(true);
      expect(evaluate("5 <= 5", {})).toBe(true);
      expect(evaluate("7 <= 5", {})).toBe(false);
    });

    it("evaluates greater than or equal", () => {
      expect(evaluate("5 >= 3", {})).toBe(true);
      expect(evaluate("5 >= 5", {})).toBe(true);
      expect(evaluate("3 >= 5", {})).toBe(false);
    });

    it("compares variables", () => {
      const scope = { count: 10, limit: 5, target: signal(10) };
      expect(evaluate("count > limit", scope)).toBe(true);
      expect(evaluate("count === target", scope)).toBe(true);
      expect(evaluate("limit < count", scope)).toBe(true);
    });
  });

  describe("logical operators", () => {
    it("evaluates logical AND", () => {
      expect(evaluate("true && true", {})).toBe(true);
      expect(evaluate("true && false", {})).toBe(false);
      expect(evaluate("false && true", {})).toBe(false);
      expect(evaluate("false && false", {})).toBe(false);
    });

    it("evaluates logical OR", () => {
      expect(evaluate("true || true", {})).toBe(true);
      expect(evaluate("true || false", {})).toBe(true);
      expect(evaluate("false || true", {})).toBe(true);
      expect(evaluate("false || false", {})).toBe(false);
    });

    it("evaluates logical NOT", () => {
      expect(evaluate("!true", {})).toBe(false);
      expect(evaluate("!false", {})).toBe(true);
      expect(evaluate("!!true", {})).toBe(true);
    });

    it("combines logical operators", () => {
      expect(evaluate("true && true || false", {})).toBe(true);
      expect(evaluate("false || true && true", {})).toBe(true);
      expect(evaluate("!false && true", {})).toBe(true);
    });

    it("evaluates with truthy/falsy values", () => {
      const scope = { zero: 0, one: 1, empty: "", text: "hello", nil: null };
      expect(evaluate("zero && one", scope)).toBe(false);
      expect(evaluate("one && text", scope)).toBe(true);
      expect(evaluate("empty || text", scope)).toBe(true);
      expect(evaluate("!zero", scope)).toBe(true);
      expect(evaluate("!one", scope)).toBe(false);
    });
  });

  describe("unary operators", () => {
    it("evaluates unary minus", () => {
      expect(evaluate("-5", {})).toBe(-5);
      expect(evaluate("-(-5)", {})).toBe(5);
      expect(evaluate("-(3 + 2)", {})).toBe(-5);
    });

    it("evaluates unary plus", () => {
      expect(evaluate("+5", {})).toBe(5);
      expect(evaluate("+(-5)", {})).toBe(-5);
    });

    it("evaluates unary NOT", () => {
      expect(evaluate("!true", {})).toBe(false);
      expect(evaluate("!false", {})).toBe(true);
      expect(evaluate("!0", {})).toBe(true);
      expect(evaluate("!1", {})).toBe(false);
    });
  });

  describe("grouped expressions", () => {
    it("evaluates parenthesized expressions", () => {
      expect(evaluate("(5 + 3) * 2", {})).toBe(16);
      expect(evaluate("10 / (2 + 3)", {})).toBe(2);
      expect(evaluate("(10 - 5) * (3 + 2)", {})).toBe(25);
    });

    it("handles nested parentheses", () => {
      expect(evaluate("((5 + 3) * 2)", {})).toBe(16);
      expect(evaluate("(5 + (3 * 2))", {})).toBe(11);
      expect(evaluate("((2 + 3) * (4 + 5))", {})).toBe(45);
    });

    it("overrides operator precedence", () => {
      expect(evaluate("2 + 3 * 4", {})).toBe(14);
      expect(evaluate("(2 + 3) * 4", {})).toBe(20);
    });
  });

  describe("complex expressions", () => {
    it("evaluates combined arithmetic and comparison", () => {
      const scope = { count: 10, limit: 5 };
      expect(evaluate("count * 2 > limit", scope)).toBe(true);
      expect(evaluate("count + 5 === 15", scope)).toBe(true);
      expect(evaluate("count - 3 < limit", scope)).toBe(false);
    });

    it("evaluates combined comparison and logical", () => {
      const scope = { age: 25, min: 18, max: 65 };
      expect(evaluate("age >= min && age <= max", scope)).toBe(true);
      expect(evaluate("age < min || age > max", scope)).toBe(false);
    });

    it("evaluates complex nested expressions", () => {
      const scope = { a: 5, b: 3, c: 2, d: signal(10) };
      expect(evaluate("(a + b) * c === d", scope)).toBe(false);
      expect(evaluate("a * b + c === d + 7", scope)).toBe(true);
      expect(evaluate("!(a < b) && c > 0", scope)).toBe(true);
    });

    it("handles array length checks", () => {
      const scope = { items: [1, 2, 3] };
      expect(evaluate("items.length === 3", scope)).toBe(true);
      expect(evaluate("items.length > 0", scope)).toBe(true);
      expect(evaluate("items.length === 0", scope)).toBe(false);
    });
  });

  describe("error handling", () => {
    it("returns undefined for invalid expressions", () => {
      expect(evaluate("@#$%", {})).toBe(undefined);
    });

    it("handles null/undefined gracefully", () => {
      const scope = { nil: null, undef: undefined };
      expect(evaluate("nil", scope)).toBe(null);
      expect(evaluate("undef", scope)).toBe(undefined);
      expect(evaluate("nil.property", scope)).toBe(undefined);
    });

    it("handles errors in complex expressions", () => {
      const result = evaluate("unclosed (", {});
      expect(result).toBe(undefined);
    });
  });

  describe("whitespace handling", () => {
    it("ignores whitespace", () => {
      expect(evaluate("  5   +   3  ", {})).toBe(8);
      expect(evaluate("\n10\n*\n2\n", {})).toBe(20);
      expect(evaluate("   true   &&   false   ", {})).toBe(false);
    });

    it("preserves whitespace in strings", () => {
      expect(evaluate("'hello world'", {})).toBe("hello world");
      expect(evaluate("'  spaces  '", {})).toBe("  spaces  ");
    });
  });

  describe("real-world use cases", () => {
    it("evaluates todo app conditions", () => {
      const scope = { todos: signal([{ completed: true }, { completed: false }]), filter: "active" };

      expect(evaluate("todos.length > 0", scope)).toBe(true);
      expect(evaluate("todos.length === 0", scope)).toBe(false);
      expect(evaluate("filter === 'active'", scope)).toBe(true);
    });

    it("evaluates form validation", () => {
      const scope = { email: signal("user@example.com"), password: signal("secret123"), agreed: signal(true) };

      expect(evaluate("email.length > 0", scope)).toBe(true);
      expect(evaluate("password.length >= 8", scope)).toBe(true);
      expect(evaluate("agreed === true", scope)).toBe(true);
      expect(evaluate("email.length > 0 && password.length >= 8 && agreed", scope)).toBe(true);
    });

    it("evaluates pagination", () => {
      const scope = { page: signal(2), totalPages: 5, items: [1, 2, 3] };

      expect(evaluate("page > 1", scope)).toBe(true);
      expect(evaluate("page < totalPages", scope)).toBe(true);
      expect(evaluate("items.length > 0", scope)).toBe(true);
      expect(evaluate("(page - 1) * 10", scope)).toBe(10);
    });
  });

  describe("method calls", () => {
    it("calls methods on objects", () => {
      const scope = { text: "hello world" };
      expect(evaluate("text.toUpperCase()", scope)).toBe("HELLO WORLD");
      expect(evaluate("text.substring(0, 5)", scope)).toBe("hello");
    });

    it("calls methods on arrays", () => {
      const scope = { items: [1, 2, 3, 4, 5] };
      expect(evaluate("items.slice(1, 3)", scope)).toEqual([2, 3]);
      expect(evaluate("items.indexOf(3)", scope)).toBe(2);
    });

    it("calls methods on signals", () => {
      const count = signal(5);
      const scope = { count };
      expect(evaluate("count.get()", scope)).toBe(5);
    });

    it("calls methods with multiple arguments", () => {
      const scope = { text: "one,two,three" };
      expect(evaluate("text.split(',')", scope)).toEqual(["one", "two", "three"]);
    });

    it("chains method calls", () => {
      const scope = { text: "  hello  " };
      expect(evaluate("text.trim().toUpperCase()", scope)).toBe("HELLO");
    });

    it("calls methods with no arguments", () => {
      const scope = { arr: [1, 2, 3] };
      expect(evaluate("arr.reverse()", scope)).toEqual([3, 2, 1]);
    });
  });

  describe("ternary operator", () => {
    it("evaluates simple ternary expressions", () => {
      expect(evaluate("true ? 'yes' : 'no'", {})).toBe("yes");
      expect(evaluate("false ? 'yes' : 'no'", {})).toBe("no");
    });

    it("evaluates ternary with variables", () => {
      const scope = { count: 5, limit: 10 };
      expect(evaluate("count > 0 ? 'positive' : 'zero or negative'", scope)).toBe("positive");
      expect(evaluate("count === limit ? 'equal' : 'not equal'", scope)).toBe("not equal");
    });

    it("evaluates ternary with signals", () => {
      const scope = { count: signal(1) };
      expect(evaluate("count === 1 ? 'single' : 'multiple'", scope)).toBe("single");
    });

    it("evaluates nested ternary expressions", () => {
      const scope = { value: 5 };
      expect(evaluate("value < 0 ? 'negative' : value === 0 ? 'zero' : 'positive'", scope)).toBe("positive");
    });

    it("evaluates ternary with complex conditions", () => {
      const scope = { age: 25, min: 18, max: 65 };
      expect(evaluate("age >= min && age <= max ? 'valid' : 'invalid'", scope)).toBe("valid");
    });

    it("evaluates ternary for pluralization", () => {
      expect(evaluate("1 === 1 ? 'item' : 'items'", {})).toBe("item");
      expect(evaluate("5 === 1 ? 'item' : 'items'", {})).toBe("items");
    });
  });

  describe("arrow functions", () => {
    it("evaluates single-parameter arrow functions", () => {
      const scope = { items: [1, 2, 3, 4, 5] };
      const result = evaluate("items.filter(x => x > 2)", scope);
      expect(result).toEqual([3, 4, 5]);
    });

    it("evaluates multi-parameter arrow functions", () => {
      const scope = { items: ["a", "b", "c"] };
      const result = evaluate("items.map((item, index) => index)", scope);
      expect(result).toEqual([0, 1, 2]);
    });

    it("captures scope in arrow functions", () => {
      const scope = { todos: [{ completed: false }, { completed: true }, { completed: false }] };
      const result = evaluate("todos.filter(t => !t.completed)", scope);
      expect(result).toEqual([{ completed: false }, { completed: false }]);
    });

    it("evaluates arrow functions with complex expressions", () => {
      const scope = { items: [1, 2, 3] };
      const result = evaluate("items.map(x => x * 2 + 1)", scope);
      expect(result).toEqual([3, 5, 7]);
    });

    it("evaluates arrow functions with property access", () => {
      const scope = { users: [{ name: "Alice", age: 25 }, { name: "Bob", age: 30 }] };
      const result = evaluate("users.map(u => u.name)", scope);
      expect(result).toEqual(["Alice", "Bob"]);
    });

    it("evaluates nested arrow functions", () => {
      const scope = { matrix: [[1, 2], [3, 4]] };
      const result = evaluate("matrix.map(row => row.map(n => n * 2))", scope);
      expect(result).toEqual([[2, 4], [6, 8]]);
    });

    it("evaluates arrow functions with no parameters", () => {
      const scope = { arr: [1, 2, 3] };
      const mapper = evaluate("() => 42", scope);
      expect(typeof mapper).toBe("function");
      expect((mapper as () => number)()).toBe(42);
    });
  });

  describe("object literals", () => {
    it("evaluates empty object literals", () => {
      expect(evaluate("{}", {})).toEqual({});
    });

    it("evaluates simple object literals", () => {
      expect(evaluate("{ active: true, disabled: false }", {})).toEqual({ active: true, disabled: false });
    });

    it("evaluates object literals with variables", () => {
      const scope = { isActive: true, count: 5 };
      expect(evaluate("{ active: isActive, num: count }", scope)).toEqual({ active: true, num: 5 });
    });

    it("evaluates object literals with string keys", () => {
      expect(evaluate("{ 'first-name': 'Alice', 'last-name': 'Smith' }", {})).toEqual({
        "first-name": "Alice",
        "last-name": "Smith",
      });
    });

    it("evaluates object literals with expressions", () => {
      const scope = { count: 5 };
      expect(evaluate("{ value: count * 2, label: 'items' }", scope)).toEqual({ value: 10, label: "items" });
    });

    it("evaluates object literals with nested objects", () => {
      expect(evaluate("{ user: { name: 'Bob', age: 30 } }", {})).toEqual({ user: { name: "Bob", age: 30 } });
    });
  });

  describe("array literals", () => {
    it("evaluates empty array literals", () => {
      expect(evaluate("[]", {})).toEqual([]);
    });

    it("evaluates simple array literals", () => {
      expect(evaluate("[1, 2, 3]", {})).toEqual([1, 2, 3]);
      expect(evaluate("['a', 'b', 'c']", {})).toEqual(["a", "b", "c"]);
    });

    it("evaluates array literals with variables", () => {
      const scope = { x: 5, y: 10 };
      expect(evaluate("[x, y, 15]", scope)).toEqual([5, 10, 15]);
    });

    it("evaluates array literals with expressions", () => {
      const scope = { count: 3 };
      expect(evaluate("[count, count * 2, count * 3]", scope)).toEqual([3, 6, 9]);
    });

    it("evaluates nested array literals", () => {
      expect(evaluate("[[1, 2], [3, 4]]", {})).toEqual([[1, 2], [3, 4]]);
    });

    it("evaluates mixed type array literals", () => {
      expect(evaluate("[1, 'two', true, null]", {})).toEqual([1, "two", true, null]);
    });
  });

  describe("spread operator", () => {
    it("spreads arrays in array literals", () => {
      const scope = { items: [2, 3, 4] };
      expect(evaluate("[1, ...items, 5]", scope)).toEqual([1, 2, 3, 4, 5]);
    });

    it("spreads multiple arrays", () => {
      const scope = { first: [1, 2], second: [3, 4] };
      expect(evaluate("[...first, ...second]", scope)).toEqual([1, 2, 3, 4]);
    });

    it("spreads objects in object literals", () => {
      const scope = { user: { name: "Alice", age: 25 } };
      expect(evaluate("{ ...user, age: 26 }", scope)).toEqual({ name: "Alice", age: 26 });
    });

    it("spreads with new properties", () => {
      const scope = { base: { a: 1, b: 2 } };
      expect(evaluate("{ ...base, c: 3 }", scope)).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("handles multiple spreads in objects", () => {
      const scope = { obj1: { a: 1 }, obj2: { b: 2 } };
      expect(evaluate("{ ...obj1, ...obj2, c: 3 }", scope)).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe("enhanced evaluator integration", () => {
    it("combines method calls with ternary operators", () => {
      const scope = { text: "hello", minLength: 3 };
      expect(evaluate("text.length >= minLength ? text.toUpperCase() : text", scope)).toBe("HELLO");
    });

    it("uses arrow functions with object literals", () => {
      const scope = { items: [1, 2, 3] };
      const result = evaluate("items.map(n => ({ value: n, doubled: n * 2 }))", scope);
      expect(result).toEqual([{ value: 1, doubled: 2 }, { value: 2, doubled: 4 }, { value: 3, doubled: 6 }]);
    });

    it("uses spread in method call results", () => {
      const scope = { todos: [{ id: 1 }, { id: 2 }], newTodo: { id: 3 } };
      expect(evaluate("[...todos, newTodo]", scope)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it("evaluates complex todo app mutations", () => {
      const scope = { todos: [{ id: 1, completed: false }, { id: 2, completed: true }] };
      const result = evaluate("todos.filter(t => !t.completed)", scope);
      expect(result).toEqual([{ id: 1, completed: false }]);
    });

    it("evaluates signal mutations with spread", () => {
      const count = signal(5);
      const scope = { count };
      expect(evaluate("count.get() + 1", scope)).toBe(6);
    });

    it("handles complex class binding expressions", () => {
      const scope = { isActive: true, isDisabled: false };
      expect(evaluate("isActive ? 'active' : ''", scope)).toBe("active");
    });
  });
});
