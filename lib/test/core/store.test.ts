import { getStore, registerStore } from "$core/store";
import { signal } from "$core/signal";
import { beforeEach, describe, expect, it } from "vitest";

describe("Global Store", () => {
  beforeEach(() => {
    // Clear store between tests by getting a fresh instance
    const store = getStore();
    for (const key of Object.keys(store)) {
      if (key !== "_signals" && key !== "get" && key !== "set" && key !== "has") {
        delete (store as Record<string, unknown>)[key];
      }
    }
    store._signals.clear();
  });

  describe("registerStore", () => {
    it("registers raw values as signals", () => {
      registerStore({ count: 0, theme: "dark" });

      const store = getStore();
      expect(store.get("count")).toBe(0);
      expect(store.get("theme")).toBe("dark");
    });

    it("registers existing signals directly", () => {
      const count = signal(42);
      registerStore({ count });

      const store = getStore();
      expect(store.get("count")).toBe(42);

      // Verify it's the same signal
      count.set(100);
      expect(store.get("count")).toBe(100);
    });

    it("makes signals accessible as direct properties", () => {
      registerStore({ theme: "dark" });

      const store = getStore();
      const themeSignal = (store as Record<string, unknown>).theme;

      expect(themeSignal).toBeDefined();
      expect(typeof themeSignal).toBe("object");
    });

    it("allows updating values via set()", () => {
      registerStore({ count: 0 });

      const store = getStore();
      store.set("count", 5);

      expect(store.get("count")).toBe(5);
    });

    it("creates new signal if key doesn't exist when using set()", () => {
      const store = getStore();
      expect(store.has("newKey")).toBe(false);

      store.set("newKey", "value");

      expect(store.has("newKey")).toBe(true);
      expect(store.get("newKey")).toBe("value");
    });
  });

  describe("getStore", () => {
    it("returns the same store instance", () => {
      const store1 = getStore();
      const store2 = getStore();

      expect(store1).toBe(store2);
    });

    it("has helper methods", () => {
      const store = getStore();

      expect(typeof store.get).toBe("function");
      expect(typeof store.set).toBe("function");
      expect(typeof store.has).toBe("function");
    });
  });

  describe("store.has()", () => {
    it("returns true for registered keys", () => {
      registerStore({ count: 0 });

      const store = getStore();
      expect(store.has("count")).toBe(true);
    });

    it("returns false for unregistered keys", () => {
      const store = getStore();
      expect(store.has("unknown")).toBe(false);
    });
  });

  describe("store.get()", () => {
    it("returns undefined for unregistered keys", () => {
      const store = getStore();
      expect(store.get("unknown")).toBeUndefined();
    });

    it("returns unwrapped signal values", () => {
      const count = signal(42);
      registerStore({ count });

      const store = getStore();
      expect(store.get("count")).toBe(42);
    });
  });

  describe("Integration", () => {
    it("allows sharing state across multiple scopes", () => {
      registerStore({ theme: "dark" });

      const store = getStore();
      expect(store.get("theme")).toBe("dark");

      store.set("theme", "light");
      expect(store.get("theme")).toBe("light");
    });

    // TODO: Add test for store reactivity in expressions once binder integration is complete
    // TODO: Add test for declarative store registration via <script data-volt-store>
  });
});
