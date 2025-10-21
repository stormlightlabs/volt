import { createScopeMetadata } from "$core/scope-metadata";
import { createArc, createProbe, createPulse, createUid } from "$core/scope-vars";
import { signal } from "$core/signal";
import type { Scope } from "$types/volt";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Special Scope Variables", () => {
  let testElement: HTMLDivElement;
  let testScope: Scope;

  beforeEach(() => {
    testElement = document.createElement("div");
    testScope = {};
    createScopeMetadata(testScope, testElement);
  });

  describe("$pulse", () => {
    it("defers callback to next microtask", async () => {
      const pulse = createPulse();
      const cb = vi.fn();

      pulse(cb);
      expect(cb).not.toHaveBeenCalled();

      await Promise.resolve();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("executes callback after current execution context", async () => {
      const pulse = createPulse();
      const order: string[] = [];

      pulse(() => order.push("microtask"));
      order.push("sync");

      await Promise.resolve();

      expect(order).toEqual(["sync", "microtask"]);
    });

    it("supports multiple callbacks", async () => {
      const pulse = createPulse();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      pulse(cb1);
      pulse(cb2);

      await Promise.resolve();

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe("$uid", () => {
    it("generates unique IDs with incrementing counter", () => {
      const uid = createUid(testScope);

      const id1 = uid();
      const id2 = uid();
      const id3 = uid();

      expect(id1).toBe("volt-1");
      expect(id2).toBe("volt-2");
      expect(id3).toBe("volt-3");
    });

    it("supports optional prefix", () => {
      const uid = createUid(testScope);

      const id1 = uid("field");
      const id2 = uid("button");

      expect(id1).toBe("volt-field-1");
      expect(id2).toBe("volt-button-2");
    });

    it("maintains separate counters per scope", () => {
      const scope1: Scope = {};
      const scope2: Scope = {};
      const elem1 = document.createElement("div");
      const elem2 = document.createElement("div");

      createScopeMetadata(scope1, elem1);
      createScopeMetadata(scope2, elem2);

      const uid1 = createUid(scope1);
      const uid2 = createUid(scope2);

      expect(uid1()).toBe("volt-1");
      expect(uid2()).toBe("volt-1");
      expect(uid1()).toBe("volt-2");
      expect(uid2()).toBe("volt-2");
    });

    it("generates deterministic IDs for same scope", () => {
      const uid = createUid(testScope);

      const ids = [uid(), uid(), uid()];

      expect(ids).toEqual(["volt-1", "volt-2", "volt-3"]);
    });
  });

  describe("$arc", () => {
    it("dispatches CustomEvent from element", () => {
      const arc = createArc(testElement);
      const listener = vi.fn();

      testElement.addEventListener("user:save", listener);

      arc("user:save");

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("includes detail in CustomEvent", () => {
      const arc = createArc(testElement);
      const listener = vi.fn();

      testElement.addEventListener("user:save", listener);

      const detail = { id: 123, name: "Alice" };
      arc("user:save", detail);

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(detail);
    });

    it("creates bubbling event", () => {
      const parent = document.createElement("div");
      const child = document.createElement("div");
      parent.append(child);

      const arc = createArc(child);
      const listener = vi.fn();

      parent.addEventListener("custom-event", listener);

      arc("custom-event", { value: "test" });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("creates composed event (crosses shadow DOM)", () => {
      const arc = createArc(testElement);
      const listener = vi.fn();

      testElement.addEventListener("custom-event", listener);

      arc("custom-event");

      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.composed).toBe(true);
    });

    it("creates cancelable event", () => {
      const arc = createArc(testElement);
      const listener = vi.fn();

      testElement.addEventListener("custom-event", listener);

      arc("custom-event");

      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.cancelable).toBe(true);
    });
  });

  describe("$probe", () => {
    it("calls callback immediately with initial value", () => {
      const count = signal(5);
      testScope.count = count;

      const probe = createProbe(testScope);
      const cb = vi.fn();

      probe("count", cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(5);
    });

    it("calls callback when dependency changes", () => {
      const count = signal(0);
      testScope.count = count;

      const probe = createProbe(testScope);
      const cb = vi.fn();

      probe("count", cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(0);

      count.set(1);

      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenCalledWith(1);

      count.set(5);

      expect(cb).toHaveBeenCalledTimes(3);
      expect(cb).toHaveBeenCalledWith(5);
    });

    it("supports computed expressions", () => {
      const count = signal(10);
      testScope.count = count;

      const probe = createProbe(testScope);
      const cb = vi.fn();

      probe("count * 2", cb);

      expect(cb).toHaveBeenCalledWith(20);

      count.set(15);

      expect(cb).toHaveBeenCalledWith(30);
    });

    it("returns cleanup function that stops observing", () => {
      const count = signal(0);
      testScope.count = count;

      const probe = createProbe(testScope);
      const cb = vi.fn();

      const cleanup = probe("count", cb);

      expect(typeof cleanup).toBe("function");
      expect(cb).toHaveBeenCalledTimes(1);

      cleanup();

      count.set(1);

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("handles multiple dependencies", () => {
      const a = signal(1);
      const b = signal(2);
      testScope.a = a;
      testScope.b = b;

      const probe = createProbe(testScope);
      const cb = vi.fn();

      probe("a + b", cb);
      expect(cb).toHaveBeenCalledWith(3);

      a.set(5);
      expect(cb).toHaveBeenCalledWith(7);

      b.set(10);
      expect(cb).toHaveBeenCalledWith(15);
    });

    it("handles errors in expressions gracefully", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const probe = createProbe(testScope);

      probe("null.toString()", () => {});

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error evaluating expression"),
        expect.any(Error),
      );

      consoleError.mockRestore();
    });

    it("handles errors in callbacks gracefully", () => {
      const count = signal(0);
      testScope.count = count;

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const probe = createProbe(testScope);
      const callback = vi.fn(() => {
        throw new Error("Callback error");
      });

      probe("count", callback);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("Integration", () => {
    it("all functions are independent", () => {
      const pulse = createPulse();
      const uid = createUid(testScope);
      const arc = createArc(testElement);
      const probe = createProbe(testScope);

      expect(pulse).toBeDefined();
      expect(uid).toBeDefined();
      expect(arc).toBeDefined();
      expect(probe).toBeDefined();
    });

    it("functions can be called multiple times", async () => {
      const pulse = createPulse();
      const uid = createUid(testScope);
      const arc = createArc(testElement);
      const cb = vi.fn();
      pulse(cb);

      const id = uid("test");
      const listener = vi.fn();
      testElement.addEventListener("event", listener);
      arc("event");

      await Promise.resolve();

      expect(cb).toHaveBeenCalled();
      expect(id).toBe("volt-test-1");
      expect(listener).toHaveBeenCalled();
    });
  });
});
