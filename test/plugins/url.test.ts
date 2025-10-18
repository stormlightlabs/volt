import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "../../src/core/binder";
import { registerPlugin } from "../../src/core/plugin";
import { signal } from "../../src/core/signal";
import { urlPlugin } from "../../src/plugins/url";

describe("url plugin", () => {
  beforeEach(() => {
    registerPlugin("url", urlPlugin);
    window.history.replaceState({}, "", "/");
  });

  describe("read mode", () => {
    it("reads URL parameter into signal on mount", () => {
      window.history.replaceState({}, "", "/?tab=profile");

      const element = document.createElement("div");
      element.dataset.xUrl = "read:tab";

      const tab = signal("");
      mount(element, { tab });

      expect(tab.get()).toBe("profile");
    });

    it("does not update URL when signal changes", async () => {
      window.history.replaceState({}, "", "/?tab=home");

      const element = document.createElement("div");
      element.dataset.xUrl = "read:tab";

      const tab = signal("");
      mount(element, { tab });

      tab.set("settings");

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(window.location.search).toBe("?tab=home");
    });

    it("handles missing URL parameter", () => {
      window.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.xUrl = "read:missing";

      const missing = signal("default");
      mount(element, { missing });

      expect(missing.get()).toBe("default");
    });

    it("deserializes boolean values", () => {
      window.history.replaceState({}, "", "/?active=true");

      const element = document.createElement("div");
      element.dataset.xUrl = "read:active";

      const active = signal(false);
      mount(element, { active });

      expect(active.get()).toBe(true);
    });

    it("deserializes number values", () => {
      window.history.replaceState({}, "", "/?count=42");

      const element = document.createElement("div");
      element.dataset.xUrl = "read:count";

      const count = signal(0);
      mount(element, { count });

      expect(count.get()).toBe(42);
    });
  });

  describe("sync mode", () => {
    it("reads URL parameter into signal on mount", () => {
      window.history.replaceState({}, "", "/?filter=active");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:filter";

      const filter = signal("");
      mount(element, { filter });

      expect(filter.get()).toBe("active");
    });

    it("updates URL when signal changes", async () => {
      window.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:query";

      const query = signal("");
      mount(element, { query });

      query.set("search term");

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(window.location.search).toContain("query=search+term");
    });

    it("removes parameter from URL when signal is empty", async () => {
      window.history.replaceState({}, "", "/?query=test");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:query";

      const query = signal("");
      mount(element, { query });

      query.set("");

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(window.location.search).toBe("");
    });

    it("handles popstate events from browser navigation", () => {
      window.history.replaceState({}, "", "/?filter=all");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:filter";

      const filter = signal("");
      mount(element, { filter });

      expect(filter.get()).toBe("all");

      window.history.replaceState({}, "", "/?filter=completed");
      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(filter.get()).toBe("completed");
    });

    it("sets signal to empty string when parameter removed from URL", () => {
      window.history.replaceState({}, "", "/?filter=test");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:filter";

      const filter = signal("");
      mount(element, { filter });

      expect(filter.get()).toBe("test");

      window.history.replaceState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(filter.get()).toBe("");
    });

    it("debounces URL updates", async () => {
      const pushStateSpy = vi.spyOn(window.history, "pushState");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:query";

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
      window.history.replaceState({}, "", "/?filter=test");

      const element = document.createElement("div");
      element.dataset.xUrl = "sync:filter";

      const filter = signal("");
      const cleanup = mount(element, { filter });

      expect(filter.get()).toBe("test");

      cleanup();

      window.history.replaceState({}, "", "/?filter=other");
      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(filter.get()).toBe("test");
    });
  });

  describe("hash mode", () => {
    it("reads hash into signal on mount", () => {
      window.location.hash = "#/about";

      const element = document.createElement("div");
      element.dataset.xUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/about");
    });

    it("updates hash when signal changes", () => {
      window.location.hash = "";

      const element = document.createElement("div");
      element.dataset.xUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      route.set("/contact");

      expect(window.location.hash).toBe("#/contact");
    });

    it("clears hash when signal is empty", () => {
      window.location.hash = "#/page";

      const element = document.createElement("div");
      element.dataset.xUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      route.set("");

      expect(window.location.hash).toBe("");
    });

    it("handles hashchange events", () => {
      window.location.hash = "#/home";

      const element = document.createElement("div");
      element.dataset.xUrl = "hash:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/home");

      window.location.hash = "#/settings";
      window.dispatchEvent(new Event("hashchange"));

      expect(route.get()).toBe("/settings");
    });

    it("cleans up hashchange listener on unmount", () => {
      window.location.hash = "#/page1";

      const element = document.createElement("div");
      element.dataset.xUrl = "hash:route";

      const route = signal("");
      const cleanup = mount(element, { route });

      expect(route.get()).toBe("/page1");

      cleanup();

      window.location.hash = "#/page2";
      window.dispatchEvent(new Event("hashchange"));

      expect(route.get()).toBe("/page1");
    });
  });

  describe("error handling", () => {
    it("logs error for invalid binding format", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.xUrl = "invalidformat";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid url binding"),
      );

      errorSpy.mockRestore();
    });

    it("logs error for unknown url mode", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.xUrl = "unknown:signal";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown url mode: "unknown"'),
      );

      errorSpy.mockRestore();
    });

    it("logs error when signal not found", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.xUrl = "read:nonexistent";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Signal "nonexistent" not found'),
      );

      errorSpy.mockRestore();
    });
  });
});
