import { clearPlugins, getRegisteredPlugins, hasPlugin, registerPlugin, unregisterPlugin } from "@volt/core/plugin";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("plugin system", () => {
  beforeEach(() => {
    clearPlugins();
  });

  describe("registerPlugin", () => {
    it("registers a plugin with a given name", () => {
      const handler = vi.fn();
      registerPlugin("test", handler);
      expect(hasPlugin("test")).toBe(true);
    });

    it("allows overwriting existing plugins with a warning", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      registerPlugin("test", handler1);
      registerPlugin("test", handler2);

      expect(warnSpy).toHaveBeenCalledWith("Plugin \"test\" is already registered. Overwriting.");
      expect(hasPlugin("test")).toBe(true);

      warnSpy.mockRestore();
    });

    it("registers multiple plugins independently", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      registerPlugin("plugin1", handler1);
      registerPlugin("plugin2", handler2);

      expect(hasPlugin("plugin1")).toBe(true);
      expect(hasPlugin("plugin2")).toBe(true);
    });
  });

  describe("hasPlugin", () => {
    it("returns true for registered plugins", () => {
      const handler = vi.fn();
      registerPlugin("test", handler);
      expect(hasPlugin("test")).toBe(true);
    });

    it("returns false for unregistered plugins", () => {
      expect(hasPlugin("nonexistent")).toBe(false);
    });

    it("returns false after plugin is unregistered", () => {
      const handler = vi.fn();
      registerPlugin("test", handler);
      unregisterPlugin("test");

      expect(hasPlugin("test")).toBe(false);
    });
  });

  describe("unregisterPlugin", () => {
    it("unregisters a plugin and returns true", () => {
      const handler = vi.fn();
      registerPlugin("test", handler);

      const result = unregisterPlugin("test");

      expect(result).toBe(true);
      expect(hasPlugin("test")).toBe(false);
    });

    it("returns false when unregistering nonexistent plugin", () => {
      const result = unregisterPlugin("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("getRegisteredPlugins", () => {
    it("returns empty array when no plugins registered", () => {
      expect(getRegisteredPlugins()).toEqual([]);
    });

    it("returns array of registered plugin names", () => {
      const handler = vi.fn();
      registerPlugin("plugin1", handler);
      registerPlugin("plugin2", handler);
      registerPlugin("plugin3", handler);

      const plugins = getRegisteredPlugins();
      expect(plugins).toHaveLength(3);
      expect(plugins).toContain("plugin1");
      expect(plugins).toContain("plugin2");
      expect(plugins).toContain("plugin3");
    });

    it("updates when plugins are added or removed", () => {
      const handler = vi.fn();

      registerPlugin("plugin1", handler);
      expect(getRegisteredPlugins()).toEqual(["plugin1"]);

      registerPlugin("plugin2", handler);
      expect(getRegisteredPlugins()).toHaveLength(2);

      unregisterPlugin("plugin1");
      expect(getRegisteredPlugins()).toEqual(["plugin2"]);
    });
  });

  describe("clearPlugins", () => {
    it("removes all registered plugins", () => {
      const handler = vi.fn();

      registerPlugin("plugin1", handler);
      registerPlugin("plugin2", handler);
      registerPlugin("plugin3", handler);
      clearPlugins();

      expect(getRegisteredPlugins()).toEqual([]);
      expect(hasPlugin("plugin1")).toBe(false);
      expect(hasPlugin("plugin2")).toBe(false);
      expect(hasPlugin("plugin3")).toBe(false);
    });
  });
});
