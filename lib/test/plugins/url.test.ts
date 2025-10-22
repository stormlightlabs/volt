import { mount } from "$core/binder";
import { registerPlugin } from "$core/plugin";
import { signal } from "$core/signal";
import { urlPlugin } from "$plugins/url";
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

  describe("history mode", () => {
    it("reads current pathname and search into signal on mount", () => {
      globalThis.history.replaceState({}, "", "/products?category=electronics");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/products?category=electronics");
    });

    it("initializes to root path when on root", () => {
      globalThis.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/");
    });

    it("updates URL when signal changes", () => {
      globalThis.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      route.set("/dashboard");

      expect(globalThis.location.pathname).toBe("/dashboard");
    });

    it("preserves search params when updating path", () => {
      globalThis.history.replaceState({}, "", "/");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      route.set("/search?q=test&page=2");

      expect(globalThis.location.pathname).toBe("/search");
      expect(globalThis.location.search).toBe("?q=test&page=2");
    });

    it("handles base path configuration", () => {
      globalThis.history.replaceState({}, "", "/app/dashboard");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route:/app";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/dashboard");
    });

    it("prepends base path when updating URL", () => {
      globalThis.history.replaceState({}, "", "/app");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route:/app";

      const route = signal("");
      mount(element, { route });

      route.set("/settings");

      expect(globalThis.location.pathname).toBe("/app/settings");
    });

    it("handles base path with trailing slash", () => {
      globalThis.history.replaceState({}, "", "/myapp/profile");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route:/myapp";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/profile");
    });

    it("returns root when on base path", () => {
      globalThis.history.replaceState({}, "", "/app");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route:/app";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/");
    });

    it("dispatches volt:navigate event when signal changes", () => {
      const navigateHandler = vi.fn();
      globalThis.addEventListener("volt:navigate", navigateHandler);

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("/");
      mount(element, { route });

      route.set("/about");

      expect(navigateHandler).toHaveBeenCalled();
      const event = navigateHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.url).toBe("/about");
      expect(event.detail.route).toBe("/about");

      globalThis.removeEventListener("volt:navigate", navigateHandler);
    });

    it("handles popstate events from browser navigation", () => {
      globalThis.history.replaceState({}, "", "/page1");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/page1");

      globalThis.history.replaceState({}, "", "/page2");
      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(route.get()).toBe("/page2");
    });

    it("dispatches volt:popstate event on back/forward navigation", () => {
      const popstateHandler = vi.fn();
      globalThis.addEventListener("volt:popstate", popstateHandler);

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("/");
      mount(element, { route });

      globalThis.history.replaceState({}, "", "/other");
      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(popstateHandler).toHaveBeenCalled();
      const event = popstateHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.route).toBe("/other");

      globalThis.removeEventListener("volt:popstate", popstateHandler);
    });

    it("syncs with volt:navigate events from navigate plugin", () => {
      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("/");
      mount(element, { route });

      globalThis.history.pushState({}, "", "/external-nav");
      globalThis.dispatchEvent(new CustomEvent("volt:navigate", { detail: { url: "/external-nav" } }));
      expect(route.get()).toBe("/external-nav");
    });

    it("does not update URL when already at target route", () => {
      globalThis.history.replaceState({}, "", "/current");

      const pushStateSpy = vi.spyOn(globalThis.history, "pushState");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      pushStateSpy.mockClear();

      route.set("/current");

      expect(pushStateSpy).not.toHaveBeenCalled();

      pushStateSpy.mockRestore();
    });

    it("prevents infinite loops between signal and URL updates", () => {
      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("/");
      const subscribeSpy = vi.fn();
      route.subscribe(subscribeSpy);

      mount(element, { route });

      subscribeSpy.mockClear();

      route.set("/test");

      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });

    it("cleans up listeners on unmount", () => {
      globalThis.history.replaceState({}, "", "/initial");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      const cleanup = mount(element, { route });

      expect(route.get()).toBe("/initial");

      cleanup();

      globalThis.history.replaceState({}, "", "/changed");
      globalThis.dispatchEvent(new PopStateEvent("popstate"));

      expect(route.get()).toBe("/initial");
    });

    it("handles complex routes with multiple path segments", () => {
      globalThis.history.replaceState({}, "", "/blog/2024/introducing-volt");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/blog/2024/introducing-volt");
    });

    it("handles routes with query parameters", () => {
      globalThis.history.replaceState({}, "", "/search?q=reactive&lang=ts");

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:route";

      const route = signal("");
      mount(element, { route });

      expect(route.get()).toBe("/search?q=reactive&lang=ts");
    });

    it("logs error when signal not found", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const element = document.createElement("div");
      element.dataset.voltUrl = "history:nonexistent";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Signal \"nonexistent\" not found"));

      errorSpy.mockRestore();
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
