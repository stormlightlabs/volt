import {
  applyOverrides,
  easings,
  getEasing,
  getRegisteredTransitions,
  getTransition,
  hasTransition,
  parseTransitionValue,
  prefersReducedMotion,
  registerTransition,
  unregisterTransition,
} from "$core/transitions";
import type { TransitionPreset } from "$types/volt";
import { describe, expect, it, vi } from "vitest";

describe("Transition Preset System", () => {
  describe("Built-in Presets", () => {
    it("should have fade preset registered", () => {
      expect(hasTransition("fade")).toBe(true);
      const fade = getTransition("fade");
      expect(fade).toBeDefined();
      expect(fade?.enter.from).toEqual({ opacity: 0 });
      expect(fade?.enter.to).toEqual({ opacity: 1 });
      expect(fade?.leave.from).toEqual({ opacity: 1 });
      expect(fade?.leave.to).toEqual({ opacity: 0 });
    });

    it.each([{
      name: "slide-up",
      enterFrom: { opacity: 0, transform: "translateY(20px)" },
      enterTo: { opacity: 1, transform: "translateY(0)" },
    }, {
      name: "slide-down",
      enterFrom: { opacity: 0, transform: "translateY(-20px)" },
      enterTo: { opacity: 1, transform: "translateY(0)" },
    }, {
      name: "slide-left",
      enterFrom: { opacity: 0, transform: "translateX(20px)" },
      enterTo: { opacity: 1, transform: "translateX(0)" },
    }, {
      name: "slide-right",
      enterFrom: { opacity: 0, transform: "translateX(-20px)" },
      enterTo: { opacity: 1, transform: "translateX(0)" },
    }, {
      name: "scale",
      enterFrom: { opacity: 0, transform: "scale(0.95)" },
      enterTo: { opacity: 1, transform: "scale(1)" },
    }, { name: "blur", enterFrom: { opacity: 0, filter: "blur(10px)" }, enterTo: { opacity: 1, filter: "blur(0)" } }])(
      "should have $name preset registered",
      ({ name, enterFrom, enterTo }) => {
        expect(hasTransition(name)).toBe(true);
        const preset = getTransition(name);
        expect(preset).toBeDefined();
        expect(preset?.enter.from).toEqual(enterFrom);
        expect(preset?.enter.to).toEqual(enterTo);
      },
    );

    it("should return all built-in preset names", () => {
      const presets = getRegisteredTransitions();

      for (const preset of ["fade", "slide-up", "slide-down", "slide-left", "slide-right", "scale", "blur"]) {
        expect(presets).toContain(preset);
      }
    });
  });

  describe("Custom Preset Registration", () => {
    it("should register a custom transition preset", () => {
      const customPreset: TransitionPreset = {
        enter: {
          from: { opacity: 0, transform: "translateX(-100px)" },
          to: { opacity: 1, transform: "translateX(0)" },
          duration: 400,
          easing: "ease-out",
        },
        leave: {
          from: { opacity: 1, transform: "translateX(0)" },
          to: { opacity: 0, transform: "translateX(100px)" },
          duration: 300,
          easing: "ease-in",
        },
      };

      registerTransition("custom-slide", customPreset);
      expect(hasTransition("custom-slide")).toBe(true);

      const retrieved = getTransition("custom-slide");
      expect(retrieved).toEqual(customPreset);
    });

    it("should unregister a custom preset", () => {
      const customPreset: TransitionPreset = { enter: { from: {}, to: {} }, leave: { from: {}, to: {} } };

      registerTransition("temp-preset", customPreset);
      expect(hasTransition("temp-preset")).toBe(true);

      const result = unregisterTransition("temp-preset");
      expect(result).toBe(true);
      expect(hasTransition("temp-preset")).toBe(false);
    });

    it("should not unregister built-in presets", () => {
      const result = unregisterTransition("fade");
      expect(result).toBe(false);
      expect(hasTransition("fade")).toBe(true);
    });

    it("should warn when overriding built-in preset", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const customPreset: TransitionPreset = { enter: { from: {}, to: {} }, leave: { from: {}, to: {} } };

      registerTransition("fade", customPreset);
      expect(consoleSpy).toHaveBeenCalledWith("[Volt] Overriding built-in transition preset: \"fade\"");

      consoleSpy.mockRestore();
    });

    it("should return undefined for unknown preset", () => {
      const preset = getTransition("nonexistent");
      expect(preset).toBeUndefined();
    });
  });

  describe("Parse Transition Value", () => {
    it("should parse preset name only", () => {
      const parsed = parseTransitionValue("fade");
      expect(parsed).toBeDefined();
      expect(parsed?.preset).toEqual(getTransition("fade"));
      expect(parsed?.duration).toBeUndefined();
      expect(parsed?.delay).toBeUndefined();
    });

    it("should parse preset name with duration", () => {
      const parsed = parseTransitionValue("fade.500");
      expect(parsed).toBeDefined();
      expect(parsed?.preset).toEqual(getTransition("fade"));
      expect(parsed?.duration).toBe(500);
      expect(parsed?.delay).toBeUndefined();
    });

    it("should parse preset name with duration and delay", () => {
      const parsed = parseTransitionValue("slide-down.600.100");
      expect(parsed).toBeDefined();
      expect(parsed?.preset).toEqual(getTransition("slide-down"));
      expect(parsed?.duration).toBe(600);
      expect(parsed?.delay).toBe(100);
    });

    it("should handle whitespace", () => {
      const parsed = parseTransitionValue("  fade.500.100  ");
      expect(parsed).toBeDefined();
      expect(parsed?.preset).toEqual(getTransition("fade"));
      expect(parsed?.duration).toBe(500);
      expect(parsed?.delay).toBe(100);
    });

    it("should return undefined for empty string", () => {
      const parsed = parseTransitionValue("");
      expect(parsed).toBeUndefined();
    });

    it("should return undefined for unknown preset", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const parsed = parseTransitionValue("nonexistent");
      expect(parsed).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should ignore invalid duration values", () => {
      const parsed = parseTransitionValue("fade.abc");
      expect(parsed).toBeDefined();
      expect(parsed?.duration).toBeUndefined();
    });

    it("should ignore invalid delay values", () => {
      const parsed = parseTransitionValue("fade.500.xyz");
      expect(parsed).toBeDefined();
      expect(parsed?.duration).toBe(500);
      expect(parsed?.delay).toBeUndefined();
    });
  });

  describe("Easing Functions", () => {
    it("should return CSS easing for named easings", () => {
      for (const e of ["linear", "ease", "ease-in", "ease-out", "ease-in-out"]) {
        const res = getEasing(e);
        expect(res).toEqual(e);
      }
    });

    it("should return cubic-bezier for named easing curves", () => {
      expect(getEasing("ease-in-sine")).toBe("cubic-bezier(0.12, 0, 0.39, 0)");
      expect(getEasing("ease-out-sine")).toBe("cubic-bezier(0.61, 1, 0.88, 1)");
      expect(getEasing("ease-in-quad")).toBe("cubic-bezier(0.11, 0, 0.5, 0)");
    });

    it("should return custom cubic-bezier as-is", () => {
      const custom = "cubic-bezier(0.25, 0.1, 0.25, 1)";
      expect(getEasing(custom)).toBe(custom);
    });

    it("should have all easing constants defined", () => {
      for (
        const prop of [
          "linear",
          "ease",
          "ease-in",
          "ease-out",
          "ease-in-out",
          "ease-in-back",
          "ease-out-back",
          "ease-in-out-back",
        ]
      ) {
        expect(easings).toHaveProperty(prop);
      }
    });
  });

  describe("Apply Overrides", () => {
    it("should apply duration override", () => {
      const phase = { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300, delay: 0, easing: "ease" };
      const overridden = applyOverrides(phase, 500);
      expect(overridden.duration).toBe(500);
      expect(overridden.delay).toBe(0);
      expect(overridden.from).toEqual({ opacity: 0 });
      expect(overridden.to).toEqual({ opacity: 1 });
      expect(overridden.easing).toBe("ease");
    });

    it("should apply delay override", () => {
      const phase = { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300, delay: 0, easing: "ease" };
      const overridden = applyOverrides(phase, undefined, 100);
      expect(overridden.duration).toBe(300);
      expect(overridden.delay).toBe(100);
    });

    it("should apply both duration and delay overrides", () => {
      const phase = { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300, delay: 0, easing: "ease" };
      const overridden = applyOverrides(phase, 600, 200);
      expect(overridden.duration).toBe(600);
      expect(overridden.delay).toBe(200);
    });

    it("should not mutate original phase", () => {
      const phase = { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300, delay: 0, easing: "ease" };
      const overridden = applyOverrides(phase, 500, 100);
      expect(phase.duration).toBe(300);
      expect(phase.delay).toBe(0);
      expect(overridden).not.toBe(phase);
    });

    it("should preserve all properties when no overrides", () => {
      const phase = {
        from: { opacity: 0, transform: "translateY(20px)" },
        to: { opacity: 1, transform: "translateY(0)" },
        duration: 300,
        delay: 50,
        easing: "ease-out",
        classes: ["entering"],
      };

      const overridden = applyOverrides(phase);
      expect(overridden).toEqual(phase);
      expect(overridden).not.toBe(phase);
    });
  });

  describe("Prefers Reduced Motion", () => {
    it("should return false when matchMedia is not available", () => {
      const originalMatchMedia = globalThis.matchMedia;
      // @ts-expect-error - Testing undefined case
      delete globalThis.matchMedia;

      expect(prefersReducedMotion()).toBe(false);

      globalThis.matchMedia = originalMatchMedia;
    });

    it("should check prefers-reduced-motion media query", () => {
      const mockMatchMedia = vi.fn().mockReturnValue({ matches: true });
      globalThis.matchMedia = mockMatchMedia;

      const result = prefersReducedMotion();

      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
      expect(result).toBe(true);
    });

    it("should return false when user does not prefer reduced motion", () => {
      const mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
      globalThis.matchMedia = mockMatchMedia;
      const result = prefersReducedMotion();
      expect(result).toBe(false);
    });
  });
});
