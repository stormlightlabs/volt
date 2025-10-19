import { reactive } from "$core/reactive";
import { computed, signal } from "$core/signal";
import { recordDependencies } from "$debug/graph";
import {
  disableGlobalTracing,
  enableGlobalTracing,
  logAllReactives,
  logAllSignals,
  logReactive,
  logSignal,
  logSignalTable,
  trace,
  watch,
} from "$debug/logger";
import { clearRegistry, registerReactive, registerSignal } from "$debug/registry";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("debug/logger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    group: ReturnType<typeof vi.spyOn>;
    groupEnd: ReturnType<typeof vi.spyOn>;
    table: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    clearRegistry();
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      group: vi.spyOn(console, "group").mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, "groupEnd").mockImplementation(() => {}),
      table: vi.spyOn(console, "table").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logSignal", () => {
    it("logs signal information", () => {
      const sig = signal(42);
      registerSignal(sig, "signal", "answer");
      logSignal(sig);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining("answer"));
      expect(consoleSpy.log).toHaveBeenCalledWith("Type:", "signal");
      expect(consoleSpy.log).toHaveBeenCalledWith("Value:", 42);
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it("logs unnamed signal with ID", () => {
      const sig = signal(0);
      registerSignal(sig, "signal");
      logSignal(sig);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringMatching(/signal-\d+/));
    });

    it("logs dependencies and dependents", () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());

      registerSignal(a, "signal", "a");
      registerSignal(b, "signal", "b");
      registerSignal(sum, "computed", "sum");

      recordDependencies(sum, [a, b]);

      logSignal(sum);

      expect(consoleSpy.log).toHaveBeenCalledWith("Dependencies:", 2);
      expect(consoleSpy.log).toHaveBeenCalledWith("Dependents:", 0);
      expect(consoleSpy.group).toHaveBeenCalledWith("Depends on:");
    });

    it("logs message for unregistered signal", () => {
      const sig = signal(0);
      logSignal(sig);
      expect(consoleSpy.log).toHaveBeenCalledWith("[Volt Debug] Unregistered signal");
    });
  });

  describe("logAllSignals", () => {
    it("logs all registered signals", () => {
      const sig1 = signal(1);
      const sig2 = signal(2);

      registerSignal(sig1, "signal", "first");
      registerSignal(sig2, "signal", "second");
      logAllSignals();

      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining("All Signals (2)"));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("first"));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("second"));
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it("handles empty signal list", () => {
      logAllSignals();
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining("All Signals (0)"));
    });
  });

  describe("logReactive", () => {
    it("logs reactive object information", () => {
      const obj = reactive({ count: 42 });
      registerReactive(obj, "state");
      logReactive(obj);
      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining("state"));
      expect(consoleSpy.log).toHaveBeenCalledWith("Type:", "reactive");
      expect(consoleSpy.log).toHaveBeenCalledWith("Value:", obj);
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it("logs message for unregistered reactive", () => {
      const obj = reactive({ count: 0 });
      logReactive(obj);
      expect(consoleSpy.log).toHaveBeenCalledWith("[Volt Debug] Unregistered reactive object");
    });
  });

  describe("logAllReactives", () => {
    it("logs all registered reactive objects", () => {
      const obj1 = reactive({ a: 1 });
      const obj2 = reactive({ b: 2 });

      registerReactive(obj1, "first");
      registerReactive(obj2, "second");

      logAllReactives();

      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining("All Reactive Objects (2)"));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("first"));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("second"));
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });
  });

  describe("logSignalTable", () => {
    it("logs signals as a table", () => {
      const sig1 = signal(1);
      const sig2 = signal(2);

      registerSignal(sig1, "signal", "first");
      registerSignal(sig2, "signal", "second");

      logSignalTable();

      expect(consoleSpy.table).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ Name: "first", Type: "signal" }),
          expect.objectContaining({ Name: "second", Type: "signal" }),
        ]),
      );
    });

    it("handles empty signal list", () => {
      logSignalTable();

      expect(consoleSpy.table).toHaveBeenCalledWith([]);
    });

    it("includes dependency counts in table", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);

      registerSignal(a, "signal", "a");
      registerSignal(double, "computed", "double");
      recordDependencies(double, [a]);

      logSignalTable();

      expect(consoleSpy.table).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ Name: "a", Dependencies: 0, Dependents: 1 }),
          expect.objectContaining({ Name: "double", Dependencies: 1, Dependents: 0 }),
        ]),
      );
    });
  });

  describe("trace", () => {
    it("enables tracing for a signal", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      trace(sig);

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("Tracing enabled for count"));
    });

    it("logs updates with new value", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      trace(sig);
      consoleSpy.log.mockClear();

      sig.set(5);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[Volt Trace]"),
        expect.anything(),
        expect.anything(),
      );
    });

    it("does not duplicate tracing for same signal", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      trace(sig);
      consoleSpy.log.mockClear();

      trace(sig);

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it.skip("disables tracing when enabled is false", () => {
      // TODO: implement tracing unsubscription
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      trace(sig, true);
      trace(sig, false);
      consoleSpy.log.mockClear();

      sig.set(5);

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe("watch", () => {
    it("logs updates with full signal info", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      watch(sig);
      consoleSpy.group.mockClear();
      consoleSpy.log.mockClear();

      sig.set(5);

      expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining("[Volt Watch]"));
      expect(consoleSpy.log).toHaveBeenCalledWith("New value:", 5);
    });

    it("returns unsubscribe function", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      const unsubscribe = watch(sig);
      unsubscribe();

      consoleSpy.group.mockClear();
      consoleSpy.log.mockClear();

      sig.set(5);

      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("logs unwatch message", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      const unsubscribe = watch(sig);
      consoleSpy.log.mockClear();

      unsubscribe();

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("Stopped watching count"));
    });
  });

  describe("global tracing", () => {
    it("enables tracing for all signals", () => {
      const sig1 = signal(0);
      const sig2 = signal(0);

      registerSignal(sig1, "signal", "first");
      registerSignal(sig2, "signal", "second");

      enableGlobalTracing();
      consoleSpy.log.mockClear();

      sig1.set(1);
      sig2.set(2);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("first"),
        expect.anything(),
        expect.anything(),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("second"),
        expect.anything(),
        expect.anything(),
      );
    });

    it.skip("disables tracing for all signals", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      enableGlobalTracing();
      disableGlobalTracing();
      consoleSpy.log.mockClear();

      sig.set(5);

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });
});
