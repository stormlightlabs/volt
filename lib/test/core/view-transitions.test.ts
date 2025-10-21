import {
  namedViewTransition,
  startViewTransition,
  supportsViewTransitions,
  withViewTransition,
} from "$core/view-transitions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("View Transitions API", () => {
  let mockStartViewTransition: ReturnType<typeof vi.fn>;
  let originalStartViewTransition: unknown;
  let originalMatchMedia: unknown;

  beforeEach(() => {
    mockStartViewTransition = vi.fn((callback: () => void | Promise<void>) => {
      const result = callback();
      return {
        finished: Promise.resolve(result).then(() => {}),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(result).then(() => {}),
        skipTransition: vi.fn(),
      };
    });

    originalStartViewTransition = (document as Document & { startViewTransition?: unknown }).startViewTransition;
    originalMatchMedia = globalThis.matchMedia;

    (document as Document & { startViewTransition: typeof mockStartViewTransition }).startViewTransition =
      mockStartViewTransition;

    globalThis.matchMedia = vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof globalThis.matchMedia;
  });

  afterEach(() => {
    if (originalStartViewTransition === undefined) {
      // @ts-expect-error mocking browser without view transitions API
      delete (document as Document & { startViewTransition?: unknown }).startViewTransition;
    } else {
      // @ts-expect-error mocking view transitions API
      (document as Document & { startViewTransition: unknown }).startViewTransition = originalStartViewTransition;
    }

    globalThis.matchMedia = originalMatchMedia as typeof globalThis.matchMedia;

    vi.restoreAllMocks();
  });

  describe("supportsViewTransitions", () => {
    it("should return true when View Transitions API is supported", () => {
      expect(supportsViewTransitions()).toBe(true);
    });

    it("should return false when View Transitions API is not supported", () => {
      // @ts-expect-error mocking browser without view transitions API
      delete (document as Document & { startViewTransition?: unknown }).startViewTransition;
      expect(supportsViewTransitions()).toBe(false);
    });
  });

  describe("startViewTransition", () => {
    it("should use View Transitions API when supported", async () => {
      const callback = vi.fn();

      await startViewTransition(callback);

      expect(mockStartViewTransition).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
    });

    it("should fallback to direct execution when API is not supported", async () => {
      // @ts-expect-error mocking browser without view transitions API
      delete (document as Document & { startViewTransition?: unknown }).startViewTransition;

      const callback = vi.fn();
      await startViewTransition(callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should skip transition when prefers-reduced-motion is enabled", async () => {
      globalThis.matchMedia = vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof globalThis.matchMedia;

      const callback = vi.fn();
      await startViewTransition(callback);

      expect(mockStartViewTransition).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it("should force fallback when forceFallback option is true", async () => {
      const callback = vi.fn();
      await startViewTransition(callback, { forceFallback: true });

      expect(mockStartViewTransition).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it("should respect reduced motion preference when respectReducedMotion is true", async () => {
      globalThis.matchMedia = vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof globalThis.matchMedia;

      const callback = vi.fn();
      await startViewTransition(callback, { respectReducedMotion: true });

      expect(mockStartViewTransition).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it("should use View Transitions API when respectReducedMotion is false even with reduced motion", async () => {
      globalThis.matchMedia = vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof globalThis.matchMedia;

      const callback = vi.fn();
      await startViewTransition(callback, { respectReducedMotion: false });

      expect(mockStartViewTransition).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
    });

    it("should apply and remove view-transition-name for named transitions", async () => {
      const element = document.createElement("div");
      const callback = vi.fn();

      await startViewTransition(callback, { name: "test-transition", elements: [element] });

      expect(callback).toHaveBeenCalled();
      expect(element.style.viewTransitionName).toBe("");
    });

    it("should apply unique names for multiple elements", async () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      const callback = vi.fn(() => {
        expect(element1.style.viewTransitionName).toBe("test-transition-0");
        expect(element2.style.viewTransitionName).toBe("test-transition-1");
      });

      await startViewTransition(callback, { name: "test-transition", elements: [element1, element2] });

      expect(callback).toHaveBeenCalled();
      expect(element1.style.viewTransitionName).toBe("");
      expect(element2.style.viewTransitionName).toBe("");
    });

    it("should restore original view-transition-name values", async () => {
      const element = document.createElement("div");
      element.style.viewTransitionName = "original-name";

      const callback = vi.fn(() => {
        expect(element.style.viewTransitionName).toBe("test-transition");
      });

      await startViewTransition(callback, { name: "test-transition", elements: [element] });

      expect(callback).toHaveBeenCalled();
      expect(element.style.viewTransitionName).toBe("original-name");
    });

    it("should handle async callbacks", async () => {
      const callback = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await startViewTransition(callback);

      expect(mockStartViewTransition).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("namedViewTransition", () => {
    it("should apply named transition to single element", async () => {
      const element = document.createElement("div");
      const callback = vi.fn(() => {
        expect(element.style.viewTransitionName).toBe("card-flip");
      });

      await namedViewTransition("card-flip", [element], callback);

      expect(callback).toHaveBeenCalled();
      expect(element.style.viewTransitionName).toBe("");
    });

    it("should apply named transition to multiple elements", async () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      const callback = vi.fn(() => {
        expect(element1.style.viewTransitionName).toBe("card-flip-0");
        expect(element2.style.viewTransitionName).toBe("card-flip-1");
      });

      await namedViewTransition("card-flip", [element1, element2], callback);

      expect(callback).toHaveBeenCalled();
      expect(element1.style.viewTransitionName).toBe("");
      expect(element2.style.viewTransitionName).toBe("");
    });
  });

  describe("withViewTransition", () => {
    it("should use View Transitions API when supported", () => {
      const callback = vi.fn();

      withViewTransition(callback);

      expect(mockStartViewTransition).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
    });

    it("should fallback to direct execution when API is not supported", () => {
      // @ts-expect-error mocking browser without view transitions API
      delete (document as Document & { startViewTransition?: unknown }).startViewTransition;

      const callback = vi.fn();
      withViewTransition(callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should skip transition when prefers-reduced-motion is enabled and respectReducedMotion is true", () => {
      globalThis.matchMedia = vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof globalThis.matchMedia;

      const callback = vi.fn();
      withViewTransition(callback, true);

      expect(mockStartViewTransition).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it("should use View Transitions API when respectReducedMotion is false", () => {
      globalThis.matchMedia = vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof globalThis.matchMedia;

      const callback = vi.fn();
      withViewTransition(callback, false);

      expect(mockStartViewTransition).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
    });
  });
});
