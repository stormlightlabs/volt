import { mount } from "@volt/core/binder";
import { registerPlugin } from "@volt/core/plugin";
import { signal } from "@volt/core/signal";
import { urlPlugin } from "@volt/plugins/url";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("url plugin", () => {
  beforeEach(() => {
    registerPlugin("url", urlPlugin);
    globalThis.history.replaceState({}, "", "/");
  });

  describe("read mode", () => {
    it("reads URL parameter into signal on mount", () => {
      globalThis.history.replaceState({}, "", "/?tab=profile");

      const element = document.createElement("div");
      element.dataset.voltUrl = "read:tab";

      const tab = signal("");
      mount(element, { tab });

      expect(tab.get()).toBe("profile");
    });

    it("does not update URL when signal changes", async () => {
      globalThis.history.replaceState({}, "", "/?tab=home");

      const element = document.createElement("div");
      element.dataset.voltUrl = "read:tab";

      const tab = signal("");
      mount(element, { tab });

      tab.set("settings");

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(globalThis.location.search).toBe("?tab=home");
    });

    it("handles missing URL parameter", () => {
      globalThis.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.voltUrl = "read:missing";

      const missing = signal("default");
      mount(element, { missing });

      expect(missing.get()).toBe("default");
    });

    it("deserializes boolean values", () => {
      globalThis.history.replaceState({}, "", "/?active=true");

      const element = document.createElement("div");
      element.dataset.voltUrl = "read:active";

      const active = signal(false);
      mount(element, { active });

      expect(active.get()).toBe(true);
    });

    it("deserializes number values", () => {
      globalThis.history.replaceState({}, "", "/?count=42");

      const element = document.createElement("div");
      element.dataset.voltUrl = "read:count";

      const count = signal(0);
      mount(element, { count });

      expect(count.get()).toBe(42);
    });
  });

  describe("sync mode", () => {
    it("reads URL parameter into signal on mount", () => {
      globalThis.history.replaceState({}, "", "/?filter=active");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:filter";

      const filter = signal("");
      mount(element, { filter });

      expect(filter.get()).toBe("active");
    });

    it("updates URL when signal changes", async () => {
      globalThis.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:query";

      const query = signal("");
      mount(element, { query });

      query.set("search term");

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(globalThis.location.search).toContain("query=search+term");
    });

    it("removes parameter from URL when signal is empty", async () => {
      globalThis.history.replaceState({}, "", "/?query=test");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:query";

      const query = signal("");
      mount(element, { query });

      query.set("");

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(globalThis.location.search).toBe("");
    });

    it("handles popstate events from browser navigation", () => {
      globalThis.history.replaceState({}, "", "/?filter=all");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:filter";

      const filter = signal("");
      mount(element, { filter });

      expect(filter.get()).toBe("all");

      globalThis.history.replaceState({}, "", "/?filter=completed");
      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(filter.get()).toBe("completed");
    });

    it("sets signal to empty string when parameter removed from URL", () => {
      globalThis.history.replaceState({}, "", "/?filter=test");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:filter";

      const filter = signal("");
      mount(element, { filter });

      expect(filter.get()).toBe("test");

      globalThis.history.replaceState({}, "", "/");
      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(filter.get()).toBe("");
    });

    it("debounces URL updates", async () => {
      const pushStateSpy = vi.spyOn(globalThis.history, "pushState");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:query";

      const query = signal("");
      mount(element, { query });

      query.set("a");
      query.set("ab");
      query.set("abc");

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(pushStateSpy).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(pushStateSpy).toHaveBeenCalledOnce();

      pushStateSpy.mockRestore();
    });

    it("cleans up popstate listener on unmount", () => {
      globalThis.history.replaceState({}, "", "/?filter=test");

      const element = document.createElement("div");
      element.dataset.voltUrl = "sync:filter";

      const filter = signal("");
      const cleanup = mount(element, { filter });

      expect(filter.get()).toBe("test");

      cleanup();

      globalThis.history.replaceState({}, "", "/?filter=other");
      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(filter.get()).toBe("test");
    });
  });

  describe("hash mode", () => {
    it("reads hash into signal on mount", () => {
      globalThis.location.hash = "#/about";

      const element = document.createElement("div");
      element.dataset.voltUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/about");
    });

    it("updates hash when signal changes", () => {
      globalThis.location.hash = "";

      const element = document.createElement("div");
      element.dataset.voltUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      route.set("/contact");

      expect(globalThis.location.hash).toBe("#/contact");
    });

    it("clears hash when signal is empty", () => {
      globalThis.location.hash = "#/page";

      const element = document.createElement("div");
      element.dataset.voltUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      route.set("");

      expect(globalThis.location.hash).toBe("");
    });

    it("handles hashchange events", () => {
      globalThis.location.hash = "#/home";

      const element = document.createElement("div");
      element.dataset.voltUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/home");

      globalThis.location.hash = "#/settings";
      globalThis.dispatchEvent(new Event("hashchange"));

      expect(route.get()).toBe("/settings");
    });

    it("cleans up hashchange listener on unmount", () => {
      globalThis.location.hash = "#/page1";

      const element = document.createElement("div");
      element.dataset.voltUrl = "hash:route";

      const route = signal("");
      const cleanup = mount(element, { route });

      expect(route.get()).toBe("/page1");

      cleanup();

      globalThis.location.hash = "#/page2";
      globalThis.dispatchEvent(new Event("hashchange"));

      expect(route.get()).toBe("/page1");
    });
  });

  describe("error handling", () => {
    it("logs error for invalid binding format", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltUrl = "invalidformat";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid url binding"));

      errorSpy.mockRestore();
    });

    it("logs error for unknown url mode", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltUrl = "unknown:signal";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown url mode: \"unknown\""));

      errorSpy.mockRestore();
    });

    it("logs error when signal not found", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltUrl = "read:nonexistent";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Signal \"nonexistent\" not found"));

      errorSpy.mockRestore();
    });
  });
});
