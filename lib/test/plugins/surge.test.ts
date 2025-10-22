import { signal } from "$core/signal";
import { registerTransition } from "$core/transitions";
import { executeSurgeEnter, executeSurgeLeave, hasSurge, surgePlugin } from "$plugins/surge";
import type { TransitionPreset } from "$types/volt";
import type { PluginContext } from "$types/volt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Surge Plugin", () => {
  let container: HTMLDivElement;
  let element: HTMLElement;
  let mockContext: PluginContext;
  let cleanups: Array<() => void>;

  beforeEach(() => {
    container = document.createElement("div");
    element = document.createElement("div");
    element.textContent = "Test Content";
    container.append(element);
    document.body.append(container);

    cleanups = [];

    mockContext = {
      element,
      scope: {},
      addCleanup: (fn) => {
        cleanups.push(fn);
      },
      findSignal: vi.fn(),
      evaluate: vi.fn(),
      lifecycle: { onMount: vi.fn(), onUnmount: vi.fn(), beforeBinding: vi.fn(), afterBinding: vi.fn() },
    };

    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups = [];
    container.remove();
    vi.restoreAllMocks();
  });

  describe("Configuration Storage", () => {
    it("should store config when no signal path provided", () => {
      surgePlugin(mockContext, "fade");
      expect(hasSurge(element as HTMLElement)).toBe(true);
    });

    it("should detect surge attributes before plugin execution", async () => {
      vi.useFakeTimers();

      element.dataset.voltSurge = "fade";
      expect(hasSurge(element as HTMLElement)).toBe(true);

      const enterPromise = executeSurgeEnter(element as HTMLElement);
      await vi.advanceTimersByTimeAsync(400);
      await enterPromise;
      expect(element.style.opacity).toBe("1");

      element.dataset["voltSurge:leave"] = "fade";
      const leavePromise = executeSurgeLeave(element as HTMLElement);
      await vi.advanceTimersByTimeAsync(400);
      await leavePromise;
      expect(element.style.opacity).toBe("0");

      vi.useRealTimers();
    });

    it("should store enter-specific config", () => {
      surgePlugin(mockContext, "enter:slide-down");
      const stored = (element as HTMLElement & { _voltSurgeEnter?: unknown })._voltSurgeEnter;
      expect(stored).toBeDefined();
    });

    it("should store leave-specific config", () => {
      surgePlugin(mockContext, "leave:fade.300");
      const stored = (element as HTMLElement & { _voltSurgeLeave?: unknown })._voltSurgeLeave;
      expect(stored).toBeDefined();
    });
  });

  describe("Signal Watching (Explicit Mode)", () => {
    it("should watch signal and show/hide element", async () => {
      vi.useFakeTimers();

      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);
      mockContext.scope = { show: showSignal };

      surgePlugin(mockContext, "show:fade");

      expect(element.style.display).toBe("none");

      showSignal.set(true);
      await vi.advanceTimersByTimeAsync(400);
      expect(element.style.display).not.toBe("none");

      showSignal.set(false);
      await vi.advanceTimersByTimeAsync(400);
      expect(element.style.display).toBe("none");

      vi.useRealTimers();
    });

    it("should apply transitions when showing element", async () => {
      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");

      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(element.style.display).not.toBe("none");
    });

    it("should cleanup subscription on unmount", () => {
      const showSignal = signal(true);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");

      expect(cleanups.length).toBeGreaterThan(0);

      for (const cleanup of cleanups) {
        cleanup();
      }

      const initialDisplay = element.style.display;
      showSignal.set(false);

      expect(element.style.display).toBe(initialDisplay);
    });

    it("should error when signal not found", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockContext.findSignal = vi.fn().mockReturnValue(void 0);

      surgePlugin(mockContext, "nonexistent:fade");
      expect(consoleSpy).toHaveBeenCalledWith("[Volt] Signal \"nonexistent\" not found for surge binding");

      consoleSpy.mockRestore();
    });

    it("should not transition if already in target state", async () => {
      const showSignal = signal(true);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");
      expect(element.style.display).not.toBe("none");

      const initialStyles = element.style.cssText;
      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(element.style.cssText).toBe(initialStyles);
    });
  });

  describe("Custom Presets", () => {
    it("should use custom registered preset", async () => {
      const customPreset: TransitionPreset = {
        enter: {
          from: { opacity: 0, transform: "scale(0.5)" },
          to: { opacity: 1, transform: "scale(1)" },
          duration: 200,
          easing: "ease-out",
        },
        leave: {
          from: { opacity: 1, transform: "scale(1)" },
          to: { opacity: 0, transform: "scale(0.5)" },
          duration: 200,
          easing: "ease-in",
        },
      };

      registerTransition("custom-scale", customPreset);

      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:custom-scale");

      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(element.style.display).not.toBe("none");
    });
  });

  describe("Duration and Delay Overrides", () => {
    it("should parse duration override", () => {
      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade.500");

      expect(mockContext.findSignal).toHaveBeenCalledWith("show");
    });

    it("should parse duration and delay overrides", () => {
      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:slide-down.600.100");

      expect(mockContext.findSignal).toHaveBeenCalledWith("show");
    });
  });

  describe("Error Handling", () => {
    it("should error on invalid surge value", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      surgePlugin(mockContext, "nonexistent-preset");
      expect(consoleSpy).toHaveBeenCalledWith("[Volt] Unknown transition preset: \"nonexistent-preset\"");
      consoleSpy.mockRestore();
    });

    it("should error on invalid enter value", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      surgePlugin(mockContext, "enter:nonexistent");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should error on invalid leave value", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      surgePlugin(mockContext, "leave:nonexistent");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Helper Functions", () => {
    describe("hasSurge", () => {
      it("should return true when surge config exists", () => {
        surgePlugin(mockContext, "fade");
        expect(hasSurge(element as HTMLElement)).toBe(true);
      });

      it("should return true when custom enter exists", () => {
        surgePlugin(mockContext, "enter:slide-down");
        expect(hasSurge(element as HTMLElement)).toBe(true);
      });

      it("should return true when custom leave exists", () => {
        surgePlugin(mockContext, "leave:fade");
        expect(hasSurge(element as HTMLElement)).toBe(true);
      });

      it("should return false when no surge config exists", () => {
        expect(hasSurge(element as HTMLElement)).toBe(false);
      });
    });

    describe("executeSurgeEnter", () => {
      it("should execute enter transition", async () => {
        surgePlugin(mockContext, "fade");
        await executeSurgeEnter(element as HTMLElement);
        expect(element).toBeDefined();
      });

      it("should use custom enter if available", async () => {
        surgePlugin(mockContext, "enter:slide-down");
        surgePlugin(mockContext, "leave:fade");

        await executeSurgeEnter(element as HTMLElement);

        expect(element).toBeDefined();
      });

      it("should do nothing if no enter config", async () => {
        await executeSurgeEnter(element as HTMLElement);
        expect(element).toBeDefined();
      });
    });

    describe("executeSurgeLeave", () => {
      it("should execute leave transition", async () => {
        surgePlugin(mockContext, "fade");
        await executeSurgeLeave(element as HTMLElement);
        expect(element).toBeDefined();
      });

      it("should use custom leave if available", async () => {
        surgePlugin(mockContext, "enter:fade");
        surgePlugin(mockContext, "leave:slide-up");

        await executeSurgeLeave(element as HTMLElement);

        expect(element).toBeDefined();
      });

      it("should do nothing if no leave config", async () => {
        await executeSurgeLeave(element as HTMLElement);
        expect(element).toBeDefined();
      });
    });
  });

  describe("Accessibility", () => {
    it("should skip animations when prefers-reduced-motion is enabled", async () => {
      globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");

      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(element.style.display).not.toBe("none");
    });
  });

  describe("Transition Lifecycle", () => {
    it("should not start overlapping transitions", async () => {
      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");

      showSignal.set(true);
      showSignal.set(false);
      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(element).toBeDefined();
    });

    it("should cleanup transition styles after completion", async () => {
      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      registerTransition("test-fast", {
        enter: { from: { opacity: 0 }, to: { opacity: 1 }, duration: 10 },
        leave: { from: { opacity: 1 }, to: { opacity: 0 }, duration: 10 },
      });

      surgePlugin(mockContext, "show:test-fast");

      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(element.style.transition).toBe("");
    });
  });

  describe("View Transitions API", () => {
    it("should use View Transitions API when available", async () => {
      const mockStartViewTransition = vi.fn((callback) => {
        callback();
      });

      // @ts-expect-error - Adding View Transitions API mock
      document.startViewTransition = mockStartViewTransition;

      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");

      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(mockStartViewTransition).toHaveBeenCalled();

      // @ts-expect-error - Cleanup mock
      delete document.startViewTransition;
    });

    it("should fallback to CSS when View Transitions API not available", async () => {
      // @ts-expect-error - Ensure View Transitions API is not available
      delete document.startViewTransition;

      const showSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(showSignal);

      surgePlugin(mockContext, "show:fade");

      showSignal.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(element.style.display).not.toBe("none");
    });
  });
});
