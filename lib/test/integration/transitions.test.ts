import { shiftPlugin } from "$plugins/shift";
import { surgePlugin } from "$plugins/surge";
import type { TransitionPreset } from "$types/volt";
import { mount, registerPlugin, registerTransition, signal } from "$volt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("integration: transitions", () => {
  beforeEach(() => {
    registerPlugin("surge", surgePlugin);
    registerPlugin("shift", shiftPlugin);
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Surge with data-volt-if", () => {
    it("should animate element in when condition becomes true", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `<div data-volt-if="show" data-volt-surge="fade">Content</div>`;

      const show = signal(false);
      mount(container, { show });

      const comment = [...container.childNodes].find((node) => node.nodeType === 8);
      expect(comment).toBeDefined();

      show.set(true);

      await vi.advanceTimersByTimeAsync(400);

      const element = container.querySelector("div");
      expect(element).toBeDefined();
      if (element) {
        expect(element.textContent).toContain("Content");
      }

      vi.useRealTimers();
    });

    it("should animate element out when condition becomes false", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="fade">
          Content
        </div>
      `;

      const show = signal(true);
      mount(container, { show });

      let element = container.querySelector("div");
      expect(element).toBeDefined();

      show.set(false);

      await vi.advanceTimersByTimeAsync(400);

      element = container.querySelector("div");
      expect(element).toBeNull();

      vi.useRealTimers();
    });

    it("should support custom enter/leave transitions", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div
          data-volt-if="show"
          data-volt-surge:enter="slide-down"
          data-volt-surge:leave="fade">
          Content
        </div>
      `;

      const show = signal(false);
      mount(container, { show });

      show.set(true);
      await vi.advanceTimersByTimeAsync(400);

      let element = container.querySelector("div");
      expect(element).toBeDefined();

      show.set(false);
      await vi.advanceTimersByTimeAsync(400);

      element = container.querySelector("div");
      expect(element).toBeNull();

      vi.useRealTimers();
    });

    it("should work with if/else pattern", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="fade">
          Shown
        </div>
        <div data-volt-else data-volt-surge="fade">
          Hidden
        </div>
      `;

      const show = signal(true);
      mount(container, { show });

      await vi.advanceTimersByTimeAsync(50);

      let shownEl = [...container.querySelectorAll("div")].find((el) => el.textContent?.includes("Shown"));
      let hiddenEl = [...container.querySelectorAll("div")].find((el) => el.textContent?.includes("Hidden"));

      expect(shownEl).toBeDefined();
      expect(hiddenEl).toBeUndefined();

      show.set(false);
      await vi.advanceTimersByTimeAsync(400);

      shownEl = [...container.querySelectorAll("div")].find((el) => el.textContent?.includes("Shown"));
      hiddenEl = [...container.querySelectorAll("div")].find((el) => el.textContent?.includes("Hidden"));

      expect(shownEl).toBeUndefined();
      expect(hiddenEl).toBeDefined();

      vi.useRealTimers();
    });

    it("should support duration and delay modifiers", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="fade.500.100">
          Content
        </div>
      `;

      const show = signal(false);
      mount(container, { show });

      show.set(true);
      await vi.advanceTimersByTimeAsync(650);

      const element = container.querySelector("div");
      expect(element).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe("Surge with data-volt-show", () => {
    it("should toggle display property with transition", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      const testEl = document.createElement("div");
      testEl.dataset.voltShow = "visible";
      testEl.dataset.voltSurge = "fade";
      testEl.textContent = "Content";
      container.append(testEl);

      const visible = signal(true);

      const element = testEl;

      mount(container, { visible });

      expect(element.style.display).not.toBe("none");

      visible.set(false);
      await vi.advanceTimersByTimeAsync(400);

      expect(element.style.display).toBe("none");

      visible.set(true);
      await vi.advanceTimersByTimeAsync(400);

      expect(element.style.display).not.toBe("none");

      vi.useRealTimers();
    });

    it("should not start overlapping transitions", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-show="visible" data-volt-surge="fade">
          Content
        </div>
      `;

      const visible = signal(true);
      mount(container, { visible });

      const element = container.querySelector("div") as HTMLElement;

      visible.set(false);
      visible.set(true);
      visible.set(false);

      await vi.advanceTimersByTimeAsync(50);

      expect(element).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe("Surge signal-triggered mode", () => {
    it("should watch signal and apply transitions", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      const testEl = document.createElement("div");
      testEl.dataset.voltSurge = "show:fade";
      testEl.textContent = "Content";
      container.append(testEl);

      const show = signal(false);

      const element = testEl;

      mount(container, { show });

      expect(element.style.display).toBe("none");

      show.set(true);
      await vi.advanceTimersByTimeAsync(400);

      expect(element.style.display).not.toBe("none");

      show.set(false);
      await vi.advanceTimersByTimeAsync(400);

      expect(element.style.display).toBe("none");

      vi.useRealTimers();
    });

    it("should cleanup subscription on unmount", async () => {
      const container = document.createElement("div");
      const testEl = document.createElement("div");
      testEl.dataset.voltSurge = "show:fade";
      testEl.textContent = "Content";
      container.append(testEl);

      const show = signal(false);
      const element = testEl;

      const cleanup = mount(container, { show });

      expect(element.style.display).toBe("none");

      cleanup();

      const initialDisplay = element.style.display;
      show.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(element.style.display).toBe(initialDisplay);
    });
  });

  describe("Shift animations", () => {
    beforeEach(() => {
      HTMLElement.prototype.animate = vi.fn((_keyframes: Keyframe[], _options?: KeyframeAnimationOptions) => {
        return { onfinish: null, cancel: vi.fn() } as unknown as Animation;
      });
    });

    it("should apply animation on mount", () => {
      const container = document.createElement("div");
      const testEl = document.createElement("div");
      testEl.dataset.voltShift = "bounce";
      testEl.textContent = "Content";
      container.append(testEl);

      const element = testEl;

      mount(container, {});

      expect(element.animate).toHaveBeenCalled();
    });

    it("should trigger animation based on signal", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <button data-volt-shift="trigger:bounce">
          Click me
        </button>
      `;

      const trigger = signal(false);
      mount(container, { trigger });

      const button = container.querySelector("button") as HTMLElement;
      expect(button.animate).not.toHaveBeenCalled();

      trigger.set(true);
      expect(button.animate).toHaveBeenCalled();
    });

    it("should support duration and iteration modifiers", () => {
      const container = document.createElement("div");
      const testEl = document.createElement("div");
      testEl.dataset.voltShift = "bounce.1000.3";
      testEl.textContent = "Content";
      container.append(testEl);

      const element = testEl;

      mount(container, {});

      expect(element.animate).toHaveBeenCalled();

      const animateMock = element.animate as unknown as ReturnType<typeof vi.fn>;
      const options = animateMock.mock.calls[0]?.[1] as KeyframeAnimationOptions;
      expect(options?.duration).toBe(1000);
      expect(options?.iterations).toBe(3);
    });

    it("should cleanup signal subscription on unmount", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <button data-volt-shift="trigger:bounce">
          Click me
        </button>
      `;

      const trigger = signal(false);
      const cleanup = mount(container, { trigger });

      cleanup();

      const button = container.querySelector("button") as HTMLElement;
      trigger.set(true);

      expect(button.animate).not.toHaveBeenCalled();
    });
  });

  describe("Custom presets", () => {
    it("should use registered custom transition preset", async () => {
      vi.useFakeTimers();

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

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="custom-scale">
          Content
        </div>
      `;

      const show = signal(false);
      mount(container, { show });

      show.set(true);
      await vi.advanceTimersByTimeAsync(300);

      const element = container.querySelector("div");
      expect(element).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe("Accessibility: prefers-reduced-motion", () => {
    it("should skip animations when user prefers reduced motion", async () => {
      globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="fade">
          Content
        </div>
      `;

      const show = signal(false);
      mount(container, { show });

      show.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      const element = container.querySelector("div");
      expect(element).toBeDefined();
    });
  });

  describe("View Transitions API", () => {
    it("should use View Transitions API when available", async () => {
      const mockStartViewTransition = vi.fn((callback: () => void | Promise<void>) => {
        const result = callback();
        return {
          finished: Promise.resolve(result).then(() => {}),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(result).then(() => {}),
          skipTransition: vi.fn(),
        };
      });

      // @ts-expect-error - Adding View Transitions API mock
      document.startViewTransition = mockStartViewTransition;

      const { startViewTransition } = await import("$core/view-transitions");

      await startViewTransition(() => {
        const el = document.createElement("div");
        el.textContent = "test";
      });

      expect(mockStartViewTransition).toHaveBeenCalled();

      // @ts-expect-error - Cleanup mock
      delete document.startViewTransition;
    });

    it("should fallback to CSS when View Transitions API not available", async () => {
      // @ts-expect-error - Ensure View Transitions API is not available
      delete document.startViewTransition;

      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="fade">
          Content
        </div>
      `;

      const show = signal(false);
      mount(container, { show });

      show.set(true);
      await vi.advanceTimersByTimeAsync(400);

      const element = container.querySelector("div");
      expect(element).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe("Memory leak prevention", () => {
    it("should cleanup all transition-related subscriptions", async () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show" data-volt-surge="fade">
          Content 1
        </div>
        <div data-volt-show="visible" data-volt-surge="slide-down">
          Content 2
        </div>
        <div data-volt-surge="trigger:scale">
          Content 3
        </div>
        <button data-volt-shift="animTrigger:bounce">
          Content 4
        </button>
      `;

      const show = signal(false);
      const visible = signal(true);
      const trigger = signal(false);
      const animTrigger = signal(false);

      const cleanup = mount(container, { show, visible, trigger, animTrigger });

      cleanup();

      const initialHTML = container.innerHTML;

      show.set(true);
      visible.set(false);
      trigger.set(true);
      animTrigger.set(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe("Complex integration scenarios", () => {
    it("should handle multiple animated elements simultaneously", async () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      container.innerHTML = `
        <div data-volt-if="show1" data-volt-surge="fade">Item 1</div>
        <div data-volt-if="show2" data-volt-surge="slide-down">Item 2</div>
        <div data-volt-if="show3" data-volt-surge="scale">Item 3</div>
      `;

      const show1 = signal(false);
      const show2 = signal(false);
      const show3 = signal(false);

      mount(container, { show1, show2, show3 });

      show1.set(true);
      show2.set(true);
      show3.set(true);

      await vi.advanceTimersByTimeAsync(400);

      const elements = container.querySelectorAll("div");
      expect(elements.length).toBe(3);

      vi.useRealTimers();
    });

    it("should combine surge and shift on same element", async () => {
      HTMLElement.prototype.animate = vi.fn((_keyframes: Keyframe[], _options?: KeyframeAnimationOptions) => {
        return { onfinish: null, cancel: vi.fn() } as unknown as Animation;
      });

      const container = document.createElement("div");
      const testEl = document.createElement("div");
      testEl.dataset.voltShow = "visible";
      testEl.dataset.voltSurge = "fade";
      testEl.dataset.voltShift = "bounce";
      testEl.textContent = "Combined";
      container.append(testEl);

      const element = testEl;

      const visible = signal(true);
      mount(container, { visible });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(element.animate).toHaveBeenCalled();
    });
  });
});
