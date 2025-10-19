/* eslint-disable @typescript-eslint/no-unused-expressions */
import { isReactive, reactive, toRaw } from "$core/reactive";
import { computed, effect, signal } from "$core/signal";
import { describe, expect, it, vi } from "vitest";

describe("reactive", () => {
  describe("basic reactivity", () => {
    it("creates a reactive object", () => {
      const obj = reactive({ count: 0 });
      expect(obj.count).toBe(0);
    });

    it("allows setting properties", () => {
      const obj = reactive({ count: 0 });
      obj.count = 5;
      expect(obj.count).toBe(5);
    });

    it("triggers effects when properties change", () => {
      const obj = reactive({ count: 0 });
      const effectFn = vi.fn(() => {
        obj.count;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      obj.count = 5;
      expect(effectFn).toHaveBeenCalledTimes(2);
    });

    it("works with computed signals", () => {
      const obj = reactive({ count: 5 });
      const doubled = computed(() => obj.count * 2);

      expect(doubled.get()).toBe(10);

      obj.count = 10;
      expect(doubled.get()).toBe(20);
    });

    it("supports multiple properties", () => {
      const obj = reactive({ a: 1, b: 2 });
      const sum = computed(() => obj.a + obj.b);

      expect(sum.get()).toBe(3);

      obj.a = 5;
      expect(sum.get()).toBe(7);

      obj.b = 10;
      expect(sum.get()).toBe(15);
    });

    it("does not trigger effects when value is the same", () => {
      const obj = reactive({ count: 0 });
      const effectFn = vi.fn(() => {
        obj.count;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      obj.count = 0;
      expect(effectFn).toHaveBeenCalledTimes(1);
    });

    it("handles property deletion", () => {
      const obj = reactive({ count: 5 as number | undefined, name: "test" });
      const effectFn = vi.fn(() => {
        obj.count;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      delete obj.count;
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(obj.count).toBeUndefined();
    });

    it("handles 'in' operator", () => {
      const obj = reactive({ count: 5 });
      expect("count" in obj).toBe(true);
      expect("missing" in obj).toBe(false);
    });
  });

  describe("nested reactivity", () => {
    it("makes nested objects reactive", () => {
      const obj = reactive({ nested: { count: 0 } });
      const effectFn = vi.fn(() => {
        obj.nested.count;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      obj.nested.count = 5;
      expect(effectFn).toHaveBeenCalledTimes(2);
    });

    it("handles deeply nested objects", () => {
      const obj = reactive({ a: { b: { c: 0 } } });
      const effectFn = vi.fn(() => {
        obj.a.b.c;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      obj.a.b.c = 5;
      expect(effectFn).toHaveBeenCalledTimes(2);
    });

    it("replaces nested objects reactively", () => {
      const obj = reactive({ nested: { count: 0 } });
      const effectFn = vi.fn(() => {
        obj.nested.count;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      obj.nested = { count: 10 };
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(obj.nested.count).toBe(10);
    });
  });

  describe("array reactivity", () => {
    it("creates a reactive array", () => {
      const arr = reactive([1, 2, 3]);
      expect(arr[0]).toBe(1);
      expect(arr.length).toBe(3);
    });

    it("triggers effects on array index changes", () => {
      const arr = reactive([1, 2, 3]);
      const effectFn = vi.fn(() => {
        arr[0];
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr[0] = 10;
      expect(effectFn).toHaveBeenCalledTimes(2);
    });

    it("triggers effects on push", () => {
      const arr = reactive([1, 2, 3]);
      const effectFn = vi.fn(() => {
        arr.length;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr.push(4);
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr.length).toBe(4);
      expect(arr[3]).toBe(4);
    });

    it("triggers effects on pop", () => {
      const arr = reactive([1, 2, 3]);
      const effectFn = vi.fn(() => {
        arr.length;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      const popped = arr.pop();
      expect(popped).toBe(3);
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr.length).toBe(2);
    });

    it("triggers effects on shift", () => {
      const arr = reactive([1, 2, 3]);
      const effectFn = vi.fn(() => {
        arr.length;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      const shifted = arr.shift();
      expect(shifted).toBe(1);
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr.length).toBe(2);
    });

    it("triggers effects on unshift", () => {
      const arr = reactive([1, 2, 3]);
      const effectFn = vi.fn(() => {
        arr.length;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr.unshift(0);
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr.length).toBe(4);
      expect(arr[0]).toBe(0);
    });

    it("triggers effects on splice", () => {
      const arr = reactive([1, 2, 3, 4, 5]);
      const effectFn = vi.fn(() => {
        arr[2];
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr.splice(2, 1, 10);
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr).toEqual([1, 2, 10, 4, 5]);
    });

    it("triggers effects on sort", () => {
      const arr = reactive([3, 1, 2]);
      const effectFn = vi.fn(() => {
        arr[0];
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr.sort();
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr).toEqual([1, 2, 3]);
    });

    it("triggers effects on reverse", () => {
      const arr = reactive([1, 2, 3]);
      const effectFn = vi.fn(() => {
        arr[0];
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr.reverse();
      expect(effectFn).toHaveBeenCalledTimes(2);
      expect(arr).toEqual([3, 2, 1]);
    });

    it("handles nested arrays", () => {
      const arr = reactive([[1, 2], [3, 4]]);
      const effectFn = vi.fn(() => {
        arr[0][0];
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      arr[0][0] = 10;
      expect(effectFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("isReactive and toRaw", () => {
    it("identifies reactive objects", () => {
      const obj = reactive({ count: 0 });
      expect(isReactive(obj)).toBe(true);
    });

    it("returns false for non-reactive objects", () => {
      const obj = { count: 0 };
      expect(isReactive(obj)).toBe(false);
    });

    it("returns false for primitives", () => {
      expect(isReactive(5)).toBe(false);
      expect(isReactive("test")).toBe(false);
      expect(isReactive(null)).toBe(false);
      expect(isReactive(void 0)).toBe(false);
    });

    it("returns the raw object from a reactive proxy", () => {
      const original = { count: 0 };
      const obj = reactive(original);
      const raw = toRaw(obj);

      expect(raw).toBe(original);
      expect(isReactive(raw)).toBe(false);
    });

    it("returns the value as-is for non-reactive values", () => {
      const obj = { count: 0 };
      expect(toRaw(obj)).toBe(obj);
      expect(toRaw(5)).toBe(5);
    });
  });

  describe("edge cases", () => {
    it("returns the same proxy for the same object", () => {
      const original = { count: 0 };
      const proxy1 = reactive(original);
      const proxy2 = reactive(original);

      expect(proxy1).toBe(proxy2);
    });

    it("does not double-wrap reactive objects", () => {
      const obj = reactive({ count: 0 });
      const obj2 = reactive(obj);

      expect(obj).toBe(obj2);
    });

    it("handles null and undefined gracefully", () => {
      expect(reactive(null as unknown as object)).toBe(null);
      expect(reactive(undefined as unknown as object)).toBe(undefined);
    });

    it("handles primitive values gracefully", () => {
      expect(reactive(5 as unknown as object)).toBe(5);
      expect(reactive("test" as unknown as object)).toBe("test");
    });

    it("works with mixed signal and reactive", () => {
      const sig = signal(5);
      const obj = reactive({ count: 0 });

      const total = computed(() => sig.get() + obj.count);

      expect(total.get()).toBe(5);

      sig.set(10);
      expect(total.get()).toBe(10);

      obj.count = 5;
      expect(total.get()).toBe(15);
    });

    it("handles circular references", () => {
      const obj: { self?: unknown } = reactive({ self: undefined });
      obj.self = obj;

      expect(obj.self).toBe(obj);
    });

    it("supports non-enumerable properties", () => {
      const original: { hidden?: number } = {};
      Object.defineProperty(original, "hidden", { value: 42, enumerable: false });

      const obj = reactive(original);
      expect(obj.hidden).toBe(42);
    });
  });

  describe("integration with existing reactivity", () => {
    it("works in computed chains", () => {
      const obj = reactive({ a: 1, b: 2 });
      const sum = computed(() => obj.a + obj.b);
      const doubled = computed(() => sum.get() * 2);

      expect(doubled.get()).toBe(6);

      obj.a = 5;
      expect(sum.get()).toBe(7);
      expect(doubled.get()).toBe(14);
    });

    it("works with multiple effects", () => {
      const obj = reactive({ count: 0 });
      const effect1 = vi.fn(() => {
        obj.count;
      });
      const effect2 = vi.fn(() => {
        obj.count;
      });

      effect(effect1);
      effect(effect2);

      expect(effect1).toHaveBeenCalledTimes(1);
      expect(effect2).toHaveBeenCalledTimes(1);

      obj.count = 5;

      expect(effect1).toHaveBeenCalledTimes(2);
      expect(effect2).toHaveBeenCalledTimes(2);
    });

    it("allows unsubscribing from effects", () => {
      const obj = reactive({ count: 0 });
      const effectFn = vi.fn(() => {
        obj.count;
      });

      const cleanup = effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      cleanup();

      obj.count = 5;
      expect(effectFn).toHaveBeenCalledTimes(1);
    });
  });
});
