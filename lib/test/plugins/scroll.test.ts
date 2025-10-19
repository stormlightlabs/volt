import { mount } from "$core/binder";
import { registerPlugin } from "$core/plugin";
import { signal } from "$core/signal";
import { scrollPlugin } from "$plugins/scroll";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("scroll plugin", () => {
  beforeEach(() => {
    registerPlugin("scroll", scrollPlugin);
  });

  describe("restore mode", () => {
    it("restores scroll position from signal on mount", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "restore:scrollPos";
      Object.defineProperty(element, "scrollTop", { writable: true, value: 0 });

      const scrollPos = signal(250);
      mount(element, { scrollPos });

      expect(element.scrollTop).toBe(250);
    });

    it("saves scroll position to signal on scroll", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "restore:scrollPos";

      const scrollPos = signal(0);
      mount(element, { scrollPos });

      Object.defineProperty(element, "scrollTop", { writable: true, value: 100 });

      element.dispatchEvent(new Event("scroll"));

      expect(scrollPos.get()).toBe(100);
    });

    it("does not restore if signal value is not a number", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "restore:scrollPos";
      Object.defineProperty(element, "scrollTop", { writable: true, value: 0 });

      const scrollPos = signal("not a number" as unknown as number);
      mount(element, { scrollPos });

      expect(element.scrollTop).toBe(0);
    });

    it("cleans up scroll listener on unmount", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "restore:scrollPos";

      const scrollPos = signal(0);
      const cleanup = mount(element, { scrollPos });

      Object.defineProperty(element, "scrollTop", { writable: true, value: 100 });
      element.dispatchEvent(new Event("scroll"));
      expect(scrollPos.get()).toBe(100);

      cleanup();

      Object.defineProperty(element, "scrollTop", { writable: true, value: 200 });
      element.dispatchEvent(new Event("scroll"));
      expect(scrollPos.get()).toBe(100);
    });
  });

  describe("scrollTo mode", () => {
    it("scrolls to element when signal matches element ID", () => {
      const element = document.createElement("div");
      element.id = "section1";
      element.dataset.voltScroll = "scrollTo:targetId";

      const scrollIntoViewMock = vi.fn();
      element.scrollIntoView = scrollIntoViewMock;

      const targetId = signal("");
      mount(element, { targetId });

      targetId.set("section1");

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });

    it("scrolls to element when signal matches #elementId format", () => {
      const element = document.createElement("div");
      element.id = "section2";
      element.dataset.voltScroll = "scrollTo:targetId";

      const scrollIntoViewMock = vi.fn();
      element.scrollIntoView = scrollIntoViewMock;

      const targetId = signal("");
      mount(element, { targetId });

      targetId.set("#section2");

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });

    it("does not scroll if signal does not match element ID", () => {
      const element = document.createElement("div");
      element.id = "section1";
      element.dataset.voltScroll = "scrollTo:targetId";

      const scrollIntoViewMock = vi.fn();
      element.scrollIntoView = scrollIntoViewMock;

      const targetId = signal("otherSection");
      mount(element, { targetId });

      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it("scrolls on initial mount if signal already matches", () => {
      const element = document.createElement("div");
      element.id = "section1";
      element.dataset.voltScroll = "scrollTo:targetId";

      const scrollIntoViewMock = vi.fn();
      element.scrollIntoView = scrollIntoViewMock;

      const targetId = signal("section1");
      mount(element, { targetId });

      expect(scrollIntoViewMock).toHaveBeenCalledOnce();
    });
  });

  describe("spy mode", () => {
    it("updates signal when element enters viewport", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "spy:isVisible";

      const isVisible = signal(false);

      let observerCallback!: IntersectionObserverCallback;
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
        takeRecords: vi.fn(),
        root: null,
        rootMargin: "",
        thresholds: [],
      };

      (globalThis as typeof globalThis).IntersectionObserver = vi.fn((callback) => {
        observerCallback = callback;
        return mockObserver;
      }) as unknown as typeof IntersectionObserver;

      mount(element, { isVisible });

      expect(mockObserver.observe).toHaveBeenCalledWith(element);

      observerCallback(
        [{ isIntersecting: true, target: element } as unknown as IntersectionObserverEntry],
        mockObserver as IntersectionObserver,
      );

      expect(isVisible.get()).toBe(true);

      observerCallback(
        [{ isIntersecting: false, target: element } as unknown as IntersectionObserverEntry],
        mockObserver as IntersectionObserver,
      );

      expect(isVisible.get()).toBe(false);
    });

    it("disconnects observer on cleanup", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "spy:isVisible";

      const isVisible = signal(false);

      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
        takeRecords: vi.fn(),
        root: null,
        rootMargin: "",
        thresholds: [],
      };

      (globalThis as typeof globalThis).IntersectionObserver = vi.fn(() => {
        return mockObserver;
      }) as unknown as typeof IntersectionObserver;

      const cleanup = mount(element, { isVisible });

      cleanup();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe("smooth mode", () => {
    it("applies smooth scroll behavior when signal is true", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "smooth:smoothScroll";

      const smoothScroll = signal(true);
      mount(element, { smoothScroll });

      expect(element.style.scrollBehavior).toBe("smooth");
    });

    it("applies smooth scroll behavior when signal is 'smooth'", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "smooth:smoothScroll";

      const smoothScroll = signal("smooth");
      mount(element, { smoothScroll });

      expect(element.style.scrollBehavior).toBe("smooth");
    });

    it("applies auto scroll behavior when signal is false", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "smooth:smoothScroll";

      const smoothScroll = signal(false);
      mount(element, { smoothScroll });

      expect(element.style.scrollBehavior).toBe("auto");
    });

    it("applies auto scroll behavior when signal is 'auto'", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "smooth:smoothScroll";

      const smoothScroll = signal("auto");
      mount(element, { smoothScroll });

      expect(element.style.scrollBehavior).toBe("auto");
    });

    it("updates scroll behavior when signal changes", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "smooth:smoothScroll";

      const smoothScroll = signal(false);
      mount(element, { smoothScroll });

      expect(element.style.scrollBehavior).toBe("auto");

      smoothScroll.set(true);
      expect(element.style.scrollBehavior).toBe("smooth");

      smoothScroll.set(false);
      expect(element.style.scrollBehavior).toBe("auto");
    });

    it("resets scroll behavior on cleanup", () => {
      const element = document.createElement("div");
      element.dataset.voltScroll = "smooth:smoothScroll";

      const smoothScroll = signal(true);
      const cleanup = mount(element, { smoothScroll });

      expect(element.style.scrollBehavior).toBe("smooth");

      cleanup();

      expect(element.style.scrollBehavior).toBe("");
    });
  });

  describe("error handling", () => {
    it("logs error for invalid binding format", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltScroll = "invalidformat";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid scroll binding"));

      errorSpy.mockRestore();
    });

    it("logs error for unknown scroll mode", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltScroll = "unknown:signal";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown scroll mode: \"unknown\""));

      errorSpy.mockRestore();
    });

    it("logs error when signal not found", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");
      element.dataset.voltScroll = "restore:nonexistent";

      mount(element, {});

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Signal \"nonexistent\" not found"));

      errorSpy.mockRestore();
    });
  });
});
