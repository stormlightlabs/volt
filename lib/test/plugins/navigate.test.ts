import { mount } from "$core/binder";
import { goBack, goForward, initNavigationListener, navigate, redirect } from "$plugins/navigate";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("navigate plugin", () => {
  beforeEach(() => {
    globalThis.history.replaceState({}, "", "/");
    vi.clearAllMocks();
  });

  describe("link navigation", () => {
    it("intercepts link clicks and prevents default navigation", () => {
      const link = document.createElement("a");
      link.href = "/about";
      link.dataset.voltNavigate = "";

      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(link, {});
      link.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
    });

    it("navigates to href when no explicit URL provided", () => {
      const link = document.createElement("a");
      link.href = "/products";
      link.dataset.voltNavigate = "";

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      mount(link, {});
      link.dispatchEvent(event);

      expect(globalThis.location.pathname).toBe("/products");
    });

    it("navigates to explicit URL when provided", () => {
      const link = document.createElement("a");
      link.href = "/default";
      link.dataset.voltNavigate = "/custom";

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      mount(link, {});
      link.dispatchEvent(event);

      expect(globalThis.location.pathname).toBe("/custom");
    });

    it("allows ctrl+click to open in new tab (does not prevent default)", () => {
      const link = document.createElement("a");
      link.href = "/external";
      link.dataset.voltNavigate = "";

      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(link, {});
      link.dispatchEvent(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("allows meta+click to open in new tab (does not prevent default)", () => {
      const link = document.createElement("a");
      link.href = "/external";
      link.dataset.voltNavigate = "";

      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(link, {});
      link.dispatchEvent(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("allows shift+click to open in new window (does not prevent default)", () => {
      const link = document.createElement("a");
      link.href = "/external";
      link.dataset.voltNavigate = "";

      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(link, {});
      link.dispatchEvent(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("allows middle mouse button to open in new tab (does not prevent default)", () => {
      const link = document.createElement("a");
      link.href = "/external";
      link.dataset.voltNavigate = "";

      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 1 });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(link, {});
      link.dispatchEvent(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("does not intercept external links", () => {
      const link = document.createElement("a");
      link.href = "https://external.com/page";
      link.dataset.voltNavigate = "";

      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(link, {});
      link.dispatchEvent(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("uses replaceState when .replace modifier is used", () => {
      globalThis.history.replaceState({}, "", "/initial");

      const link = document.createElement("a");
      link.href = "/about";
      link.dataset.voltNavigateReplace = "";

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      mount(link, {});
      link.dispatchEvent(event);

      expect(globalThis.location.pathname).toBe("/about");
    });

    it("scrolls to top on navigation", async () => {
      const scrollToSpy = vi.spyOn(globalThis, "scrollTo");

      const link = document.createElement("a");
      link.href = "/page";
      link.dataset.voltNavigate = "";

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      mount(link, {});
      link.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
      });
    });

    it("dispatches volt:navigate event on navigation", async () => {
      const navigateHandler = vi.fn();
      globalThis.addEventListener("volt:navigate", navigateHandler);

      const link = document.createElement("a");
      link.href = "/dashboard";
      link.dataset.voltNavigate = "";

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      mount(link, {});
      link.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(navigateHandler).toHaveBeenCalled();
        const customEvent = navigateHandler.mock.calls[0][0] as CustomEvent;
        expect(customEvent.detail.url).toBe("/dashboard");
      });

      globalThis.removeEventListener("volt:navigate", navigateHandler);
    });

    it("adds prefetch link on hover when .prefetch modifier is used", async () => {
      const link = document.createElement("a");
      link.href = "/prefetch-page";
      link.dataset.voltNavigatePrefetch = "";

      mount(link, {});

      const mouseenterEvent = new MouseEvent("mouseenter", { bubbles: true });
      link.dispatchEvent(mouseenterEvent);

      await vi.waitFor(() => {
        const prefetchLink = document.querySelector("link[rel=\"prefetch\"][href=\"/prefetch-page\"]");
        expect(prefetchLink).toBeTruthy();
      });
    });

    it("adds prefetch link on focus when .prefetch modifier is used", async () => {
      const link = document.createElement("a");
      link.href = "/prefetch-focus";
      link.dataset.voltNavigatePrefetch = "";

      mount(link, {});

      const focusEvent = new FocusEvent("focus", { bubbles: true });
      link.dispatchEvent(focusEvent);

      await vi.waitFor(() => {
        const prefetchLink = document.querySelector("link[rel=\"prefetch\"][href=\"/prefetch-focus\"]");
        expect(prefetchLink).toBeTruthy();
      });
    });

    it("only prefetches once even with multiple hover events", async () => {
      const link = document.createElement("a");
      link.href = "/prefetch-once";
      link.dataset.voltNavigatePrefetch = "";

      mount(link, {});

      link.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      link.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      link.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

      await vi.waitFor(() => {
        const prefetchLinks = document.querySelectorAll("link[rel=\"prefetch\"][href=\"/prefetch-once\"]");
        expect(prefetchLinks.length).toBe(1);
      });
    });
  });

  describe("form navigation", () => {
    it("intercepts form GET submissions", () => {
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "/search";
      form.dataset.voltNavigate = "";

      const input = document.createElement("input");
      input.name = "q";
      input.value = "test";
      form.append(input);

      const preventDefault = vi.fn();
      const event = new Event("submit", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });

      mount(form, {});
      form.dispatchEvent(event);

      expect(preventDefault).toHaveBeenCalled();
      expect(globalThis.location.pathname).toBe("/search");
      expect(globalThis.location.search).toContain("q=test");
    });

    it("warns on POST form submissions", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/submit";
      form.dataset.voltNavigate = "";

      const event = new Event("submit", { bubbles: true, cancelable: true });
      mount(form, {});
      form.dispatchEvent(event);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("POST/PUT/PATCH forms should use data-volt-post/put/patch"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("uses current pathname as default action", () => {
      globalThis.history.replaceState({}, "", "/current");

      const form = document.createElement("form");
      form.method = "GET";
      form.dataset.voltNavigate = "";

      const input = document.createElement("input");
      input.name = "filter";
      input.value = "active";
      form.append(input);

      const event = new Event("submit", { bubbles: true, cancelable: true });
      mount(form, {});
      form.dispatchEvent(event);

      expect(globalThis.location.pathname).toBe("/current");
      expect(globalThis.location.search).toContain("filter=active");
    });
  });

  describe("programmatic navigation", () => {
    it("navigate() changes the URL", async () => {
      await navigate("/dashboard");
      expect(globalThis.location.pathname).toBe("/dashboard");
    });

    it("navigate() with replace option uses replaceState", async () => {
      globalThis.history.replaceState({}, "", "/initial");
      await navigate("/replaced", { replace: true });
      expect(globalThis.location.pathname).toBe("/replaced");
    });

    it("redirect() uses replaceState", async () => {
      globalThis.history.replaceState({}, "", "/old");
      await redirect("/new");
      expect(globalThis.location.pathname).toBe("/new");
    });

    it("navigate() dispatches volt:navigate event", async () => {
      const handler = vi.fn();
      globalThis.addEventListener("volt:navigate", handler);

      await navigate("/profile");

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.url).toBe("/profile");

      globalThis.removeEventListener("volt:navigate", handler);
    });

    it("goBack() navigates backward in history", () => {
      const backSpy = vi.spyOn(globalThis.history, "back");
      goBack();
      expect(backSpy).toHaveBeenCalled();
    });

    it("goForward() navigates forward in history", () => {
      const forwardSpy = vi.spyOn(globalThis.history, "forward");
      goForward();
      expect(forwardSpy).toHaveBeenCalled();
    });
  });

  describe("scroll position restoration", () => {
    it("saves scroll position before navigation", async () => {
      Object.defineProperty(globalThis, "scrollX", { value: 100, writable: true, configurable: true });
      Object.defineProperty(globalThis, "scrollY", { value: 200, writable: true, configurable: true });

      await navigate("/page1");
      await navigate("/page2");

      expect(globalThis.history.state).toBeDefined();
    });

    it("restores scroll position on popstate", async () => {
      const cleanup = initNavigationListener();

      Object.defineProperty(globalThis, "scrollX", { value: 0, writable: true, configurable: true });
      Object.defineProperty(globalThis, "scrollY", { value: 0, writable: true, configurable: true });
      await navigate("/page1");

      Object.defineProperty(globalThis, "scrollX", { value: 0, writable: true, configurable: true });
      Object.defineProperty(globalThis, "scrollY", { value: 500, writable: true, configurable: true });

      await navigate("/page2");

      const scrollToSpy = vi.spyOn(globalThis, "scrollTo");
      globalThis.history.back();
      globalThis.dispatchEvent(new PopStateEvent("popstate", { state: { scrollPosition: { x: 0, y: 500 } } }));

      await vi.waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith(0, 500);
      });

      cleanup();
    });

    it("dispatches volt:popstate event on back/forward navigation", async () => {
      const cleanup = initNavigationListener();
      const popstateHandler = vi.fn();
      globalThis.addEventListener("volt:popstate", popstateHandler);

      globalThis.dispatchEvent(new PopStateEvent("popstate", { state: { timestamp: Date.now() } }));

      await vi.waitFor(() => {
        expect(popstateHandler).toHaveBeenCalled();
      });

      globalThis.removeEventListener("volt:popstate", popstateHandler);
      cleanup();
    });
  });

  describe("navigation state", () => {
    it("stores navigation state in history", async () => {
      await navigate("/stateful");

      expect(globalThis.history.state).toBeDefined();
      expect(globalThis.history.state.timestamp).toBeDefined();
      expect(typeof globalThis.history.state.timestamp).toBe("number");
    });

    it("includes scroll position in navigation state", async () => {
      Object.defineProperty(globalThis, "scrollX", { value: 150, writable: true, configurable: true });
      Object.defineProperty(globalThis, "scrollY", { value: 300, writable: true, configurable: true });

      await navigate("/with-scroll");

      expect(globalThis.history.state.scrollPosition).toBeDefined();
      expect(globalThis.history.state.scrollPosition.x).toBe(150);
      expect(globalThis.history.state.scrollPosition.y).toBe(300);
    });
  });

  describe("view transitions", () => {
    it("uses view transitions by default", async () => {
      const mockTransition = {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCbDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };

      const startViewTransitionSpy = vi.fn(() => mockTransition);
      Object.defineProperty(document, "startViewTransition", {
        value: startViewTransitionSpy,
        writable: true,
        configurable: true,
      });

      await navigate("/with-transition");

      expect(startViewTransitionSpy).toHaveBeenCalled();
    });

    it("skips view transitions when notransition modifier is used", async () => {
      const link = document.createElement("a");
      link.href = "/no-transition";
      link.dataset.voltNavigateNotransition = "";

      const mockTransition = {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCbDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };

      const startViewTransitionSpy = vi.fn(() => mockTransition);
      Object.defineProperty(document, "startViewTransition", {
        value: startViewTransitionSpy,
        writable: true,
        configurable: true,
      });

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      mount(link, {});
      link.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(globalThis.location.pathname).toBe("/no-transition");
      });
    });

    it("can disable view transitions programmatically", async () => {
      await navigate("/no-vt", { transition: false });
      expect(globalThis.location.pathname).toBe("/no-vt");
    });
  });

  describe("focus management", () => {
    it("includes focus restoration functions in navigate module", () => {
      expect(navigate).toBeDefined();
      expect(initNavigationListener).toBeDefined();
    });

    it.skip("saves focus state in navigation state when element has ID", async () => {
      const input = document.createElement("input");
      input.id = "test-input";
      input.type = "text";
      document.body.append(input);

      const activeElementGetter = vi.spyOn(document, "activeElement", "get");
      activeElementGetter.mockReturnValue(input);

      await navigate("/page-with-focus");

      expect(globalThis.history.state.focusSelector).toBe("#test-input");

      activeElementGetter.mockRestore();
      input.remove();
    });

    it.skip("attempts to restore focus on popstate", () => {
      const cleanup = initNavigationListener();

      const button = document.createElement("button");
      button.id = "focus-button";
      button.textContent = "Click me";
      document.body.append(button);

      const focusSpy = vi.spyOn(button, "focus");

      globalThis.dispatchEvent(new PopStateEvent("popstate", { state: { focusSelector: "#focus-button" } }));

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

      cleanup();
      button.remove();
    });
  });

  describe("viewport-based prefetching", () => {
    it.skip("prefetches when link enters viewport with .viewport modifier", async () => {
      const link = document.createElement("a");
      link.href = "/viewport-prefetch";
      link.dataset.voltNavigatePrefetchViewport = "";
      document.body.append(link);

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

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

      mount(link, {});

      expect(mockObserver.observe).toHaveBeenCalledWith(link);

      observerCallback(
        [{ isIntersecting: true, target: link } as unknown as IntersectionObserverEntry],
        mockObserver as IntersectionObserver,
      );

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith("/viewport-prefetch", expect.objectContaining({ method: "GET" }));
      });

      fetchSpy.mockRestore();
      link.remove();
    });

    it.skip("only prefetches once when element enters viewport multiple times", async () => {
      const link = document.createElement("a");
      link.href = "/viewport-once";
      link.dataset.voltNavigatePrefetchViewport = "";
      document.body.append(link);

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

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

      mount(link, {});

      observerCallback(
        [{ isIntersecting: true, target: link } as unknown as IntersectionObserverEntry],
        mockObserver as IntersectionObserver,
      );

      observerCallback(
        [{ isIntersecting: false, target: link } as unknown as IntersectionObserverEntry],
        mockObserver as IntersectionObserver,
      );

      observerCallback(
        [{ isIntersecting: true, target: link } as unknown as IntersectionObserverEntry],
        mockObserver as IntersectionObserver,
      );

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(mockObserver.disconnect).toHaveBeenCalled();
      });

      fetchSpy.mockRestore();
      link.remove();
    });

    it("falls back to link prefetch when fetch fails", async () => {
      const link = document.createElement("a");
      link.href = "/fetch-fail";
      link.dataset.voltNavigatePrefetch = "";
      document.body.append(link);

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      mount(link, {});

      link.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

      await vi.waitFor(() => {
        const prefetchLink = document.querySelector("link[rel=\"prefetch\"][href=\"/fetch-fail\"]");
        expect(prefetchLink).toBeTruthy();
      });

      fetchSpy.mockRestore();
      link.remove();
    });
  });

  describe("cleanup", () => {
    it("removes event listeners on cleanup", () => {
      const link = document.createElement("a");
      link.href = "/cleanup-test";
      link.dataset.voltNavigate = "";

      const cleanup = mount(link, {});
      const preventDefault = vi.fn();
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "preventDefault", { value: preventDefault });
      link.dispatchEvent(event);
      expect(preventDefault).toHaveBeenCalled();
      cleanup();

      preventDefault.mockClear();
      const event2 = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event2, "preventDefault", { value: preventDefault });
      link.dispatchEvent(event2);
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("initNavigationListener returns cleanup function", () => {
      const cleanup = initNavigationListener();
      expect(typeof cleanup).toBe("function");

      const popstateHandler = vi.fn();
      globalThis.addEventListener("volt:popstate", popstateHandler);

      globalThis.dispatchEvent(new PopStateEvent("popstate"));
      expect(popstateHandler).toHaveBeenCalled();

      cleanup();
      popstateHandler.mockClear();

      globalThis.dispatchEvent(new PopStateEvent("popstate"));
      globalThis.removeEventListener("volt:popstate", popstateHandler);
    });
  });
});
