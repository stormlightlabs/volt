import { mount } from "$core/binder";
import { registerPlugin } from "$core/plugin";
import { signal } from "$core/signal";
import { persistPlugin, registerStorageAdapter } from "$plugins/persist";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("persist plugin", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    registerPlugin("persist", persistPlugin);
  });

  describe("localStorage persistence", () => {
    it("supports attribute suffix syntax with camelCase signal and storage aliases", async () => {
      localStorage.setItem("volt:persistedCount", "7");

      const element = document.createElement("div");
      element.dataset["voltPersist:persistedcount"] = "localStorage";

      const persistedCount = signal(0);
      mount(element, { persistedCount });

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(persistedCount.get()).toBe(7);

      persistedCount.set(9);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(localStorage.getItem("volt:persistedCount")).toBe("9");
    });

    it("loads persisted value from localStorage on mount", () => {
      localStorage.setItem("volt:count", "42");

      const element = document.createElement("div");
      element.dataset.voltPersist = "count:local";

      const count = signal(0);
      mount(element, { count });

      expect(count.get()).toBe(42);
    });

    it("saves signal value to localStorage on change", async () => {
      const element = document.createElement("div");
      element.dataset.voltPersist = "count:local";

      const count = signal(0);
      mount(element, { count });

      count.set(99);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(localStorage.getItem("volt:count")).toBe("99");
    });

    it("persists string values", async () => {
      const element = document.createElement("div");
      element.dataset.voltPersist = "name:local";

      const name = signal("Alice");
      mount(element, { name });

      name.set("Bob");

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(localStorage.getItem("volt:name")).toBe("\"Bob\"");
    });

    it("persists object values", async () => {
      const element = document.createElement("div");
      element.dataset.voltPersist = "user:local";

      const user = signal({ name: "Alice", age: 30 });
      mount(element, { user });

      user.set({ name: "Bob", age: 35 });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem("volt:user");
      expect(stored).toBe("{\"name\":\"Bob\",\"age\":35}");
    });

    it("does not override signal if localStorage is empty", () => {
      const element = document.createElement("div");
      element.dataset.voltPersist = "count:local";

      const count = signal(100);
      mount(element, { count });

      expect(count.get()).toBe(100);
    });
  });

  describe("sessionStorage persistence", () => {
    it("loads persisted value from sessionStorage on mount", () => {
      sessionStorage.setItem("volt:sessionData", "123");

      const element = document.createElement("div");
      element.dataset.voltPersist = "sessionData:session";

      const sessionData = signal(0);
      mount(element, { sessionData });

      expect(sessionData.get()).toBe(123);
    });

    it("saves signal value to sessionStorage on change", async () => {
      const element = document.createElement("div");
      element.dataset.voltPersist = "sessionData:session";

      const sessionData = signal(0);
      mount(element, { sessionData });

      sessionData.set(456);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sessionStorage.getItem("volt:sessionData")).toBe("456");
    });
  });

  describe("custom storage adapters", () => {
    it("allows registering custom storage adapter", async () => {
      const customStore = new Map<string, unknown>();
      registerStorageAdapter("custom", {
        get: (key) => customStore.get(key),
        set: (key, value) => {
          customStore.set(key, value);
        },
        remove: (key) => {
          customStore.delete(key);
        },
      });

      customStore.set("volt:data", 999);

      const element = document.createElement("div");
      element.dataset.voltPersist = "data:custom";

      const data = signal(0);
      mount(element, { data });

      expect(data.get()).toBe(999);

      data.set(777);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(customStore.get("volt:data")).toBe(777);
    });

    it("supports async custom adapters", async () => {
      const customStore = new Map<string, unknown>();
      registerStorageAdapter("async", {
        get: async (key) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return customStore.get(key);
        },
        set: async (key, value) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          customStore.set(key, value);
        },
        remove: async (key) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          customStore.delete(key);
        },
      });

      customStore.set("volt:asyncData", 888);

      const element = document.createElement("div");
      element.dataset.voltPersist = "asyncData:async";

      const asyncData = signal(0);
      mount(element, { asyncData });

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(asyncData.get()).toBe(888);
    });
  });

  describe("error handling", () => {
    it("logs error for invalid binding format", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltPersist = "invalidformat";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid persist binding"));

      errorSpy.mockRestore();
    });

    it("logs error when signal not found", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltPersist = "nonexistent:local";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Signal \"nonexistent\" not found"));

      errorSpy.mockRestore();
    });

    it("logs error for unknown storage type", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltPersist = "data:unknown";

      const data = signal(0);
      mount(element, { data });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown storage type: \"unknown\""));

      errorSpy.mockRestore();
    });

    it("handles storage adapter errors gracefully", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      registerStorageAdapter("faulty", {
        get: () => {
          throw new Error("Read error");
        },
        set: () => {
          throw new Error("Write error");
        },
        remove: () => {},
      });

      const element = document.createElement("div");
      element.dataset.voltPersist = "data:faulty";

      const data = signal(0);
      mount(element, { data });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(errorSpy).toHaveBeenCalled();

      data.set(1);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe("cleanup", () => {
    it("stops persisting after unmount", async () => {
      const element = document.createElement("div");
      element.dataset.voltPersist = "count:local";

      const count = signal(0);
      const cleanup = mount(element, { count });

      count.set(10);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(localStorage.getItem("volt:count")).toBe("10");

      cleanup();

      count.set(20);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(localStorage.getItem("volt:count")).toBe("10");
    });
  });
});
