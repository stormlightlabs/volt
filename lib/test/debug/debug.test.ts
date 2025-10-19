import { reactive } from "$core/reactive";
import { getAllSignals, getReactiveInfo, getSignalInfo } from "$debug/registry";
import { attachDebugger, debugComputed, debugReactive, debugSignal, vdebugger } from "$vebug";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("debug API", () => {
  let _consoleSpy: { log: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    vdebugger.clear();
    _consoleSpy = { log: vi.spyOn(console, "log").mockImplementation(() => {}) };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("debugSignal", () => {
    it("creates a signal and registers it", () => {
      const sig = debugSignal(42, "answer");
      expect(sig.get()).toBe(42);

      const info = getSignalInfo(sig);
      expect(info).toBeDefined();
      expect(info?.name).toBe("answer");
      expect(info?.type).toBe("signal");
    });

    it("works without a name", () => {
      const sig = debugSignal(0);
      expect(sig.get()).toBe(0);

      const info = getSignalInfo(sig);
      expect(info).toBeDefined();
      expect(info?.name).toBeUndefined();
    });

    it("returns standard Signal interface", () => {
      const sig = debugSignal(0);
      expect(sig.get).toBeTypeOf("function");
      expect(sig.set).toBeTypeOf("function");
      expect(sig.subscribe).toBeTypeOf("function");

      sig.set(5);
      expect(sig.get()).toBe(5);

      const callback = vi.fn();
      const unsubscribe = sig.subscribe(callback);
      sig.set(10);
      expect(callback).toHaveBeenCalledWith(10);

      unsubscribe();
    });
  });

  describe("debugComputed", () => {
    it("creates a computed signal and registers it", () => {
      const count = debugSignal(5);
      const doubled = debugComputed(() => count.get() * 2, "doubled");
      expect(doubled.get()).toBe(10);

      const info = getSignalInfo(doubled);
      expect(info).toBeDefined();
      expect(info?.name).toBe("doubled");
      expect(info?.type).toBe("computed");
    });

    it("works without a name", () => {
      const count = debugSignal(5);
      const doubled = debugComputed(() => count.get() * 2);
      expect(doubled.get()).toBe(10);

      const info = getSignalInfo(doubled);
      expect(info).toBeDefined();
    });

    it("recomputes when dependencies change", () => {
      const count = debugSignal(5);
      const doubled = debugComputed(() => count.get() * 2);
      expect(doubled.get()).toBe(10);

      count.set(10);
      expect(doubled.get()).toBe(20);
    });
  });

  describe("debugReactive", () => {
    it("creates a reactive object and registers it", () => {
      const state = debugReactive({ count: 42 }, "state");
      expect(state.count).toBe(42);

      const info = getReactiveInfo(state);
      expect(info).toBeDefined();
      expect(info?.name).toBe("state");
      expect(info?.type).toBe("reactive");
    });

    it("works without a name", () => {
      const state = debugReactive({ count: 0 });
      expect(state.count).toBe(0);

      const info = getReactiveInfo(state);
      expect(info).toBeDefined();
    });

    it("maintains reactivity", () => {
      const state = debugReactive({ count: 0 });
      const doubled = debugComputed(() => state.count * 2);
      expect(doubled.get()).toBe(0);

      state.count = 5;
      expect(doubled.get()).toBe(10);
    });
  });

  describe("attachDebugger", () => {
    it("registers existing signal", () => {
      const sig = debugSignal(0);
      const info = getSignalInfo(sig);
      expect(info).toBeDefined();
    });

    it("does not re-register already registered signal", () => {
      const sig = debugSignal(0, "original");
      attachDebugger(sig, "signal", "new");

      const info = getSignalInfo(sig);
      expect(info?.name).toBe("original");
    });
  });

  describe("vdebugger namespace", () => {
    it("provides signal creation", () => {
      const sig = vdebugger.signal(42, "answer");
      expect(sig.get()).toBe(42);

      const info = getSignalInfo(sig);
      expect(info?.name).toBe("answer");
    });

    it("provides computed creation", () => {
      const count = vdebugger.signal(5);
      const doubled = vdebugger.computed(() => count.get() * 2, "doubled");
      expect(doubled.get()).toBe(10);
    });

    it("provides reactive creation", () => {
      const state = vdebugger.reactive({ count: 0 }, "state");
      expect(state.count).toBe(0);
    });

    it("provides getAllSignals", () => {
      const sig1 = vdebugger.signal(1);
      const sig2 = vdebugger.signal(2);
      const all = vdebugger.getAllSignals();
      expect(all).toHaveLength(2);
      expect(all).toContain(sig1);
      expect(all).toContain(sig2);
    });

    it("provides getAllReactives", () => {
      const obj1 = vdebugger.reactive({ a: 1 });
      const obj2 = vdebugger.reactive({ b: 2 });
      const all = vdebugger.getAllReactives();
      expect(all).toHaveLength(2);
      expect(all).toContain(obj1);
      expect(all).toContain(obj2);
    });

    it("provides getSignalInfo", () => {
      const sig = vdebugger.signal(42, "answer");
      const info = vdebugger.getSignalInfo(sig);
      expect(info).toBeDefined();
      expect(info?.name).toBe("answer");
      expect(info?.value).toBe(42);
    });

    it("provides getReactiveInfo", () => {
      const obj = vdebugger.reactive({ count: 42 }, "state");
      const info = vdebugger.getReactiveInfo(obj);
      expect(info).toBeDefined();
      expect(info?.name).toBe("state");
    });

    it("provides stats", () => {
      vdebugger.signal(1);
      vdebugger.signal(2);
      vdebugger.computed(() => 3);
      vdebugger.reactive({});

      const stats = vdebugger.getStats();
      expect(stats.totalSignals).toBe(3);
      expect(stats.regularSignals).toBe(2);
      expect(stats.computedSignals).toBe(1);
      expect(stats.reactiveObjects).toBe(1);
    });

    it("provides naming functions", () => {
      const sig = vdebugger.signal(0);
      vdebugger.nameSignal(sig, "renamed");

      const info = vdebugger.getSignalInfo(sig);
      expect(info?.name).toBe("renamed");
    });

    it("provides graph operations", () => {
      const a = vdebugger.signal(1, "a");
      const b = vdebugger.signal(2, "b");

      expect(vdebugger.getDependencies(a)).toEqual([]);
      expect(vdebugger.getDependents(a)).toEqual([]);
      expect(vdebugger.getDepth(a)).toBe(0);

      const graph = vdebugger.buildGraph([a, b]);
      expect(graph.nodes).toHaveLength(2);
    });

    it("provides logging functions", () => {
      const sig = vdebugger.signal(42, "answer");
      expect(() => vdebugger.log(sig)).not.toThrow();
      expect(() => vdebugger.logAll()).not.toThrow();
      expect(() => vdebugger.logTable()).not.toThrow();
    });

    it("provides tracing functions", () => {
      const sig = vdebugger.signal(0, "count");
      expect(() => vdebugger.trace(sig)).not.toThrow();
      expect(() => vdebugger.enableTracing()).not.toThrow();
      expect(() => vdebugger.disableTracing()).not.toThrow();
    });

    it("provides watch function", () => {
      const sig = vdebugger.signal(0, "count");
      const unwatch = vdebugger.watch(sig);
      expect(unwatch).toBeTypeOf("function");
      unwatch();
    });

    it("provides clear function", () => {
      vdebugger.signal(1);
      vdebugger.signal(2);

      expect(getAllSignals()).toHaveLength(2);

      vdebugger.clear();

      expect(getAllSignals()).toHaveLength(0);
    });

    it("provides attach function", () => {
      const sig = debugSignal(0);
      vdebugger.attach(sig, "signal", "attached");

      const info = vdebugger.getSignalInfo(sig);
      expect(info).toBeDefined();
    });
  });

  describe("integration", () => {
    it("works with non-debug core primitives", () => {
      const coreReactive = reactive({ count: 0 });
      const debugCount = debugSignal(5);
      const sum = debugComputed(() => coreReactive.count + debugCount.get(), "sum");
      expect(sum.get()).toBe(5);

      coreReactive.count = 10;
      expect(sum.get()).toBe(15);

      debugCount.set(20);
      expect(sum.get()).toBe(30);
    });

    it("allows mixing debug and non-debug signals", () => {
      const debug = debugSignal(1, "debug");
      const regular = debugSignal(2);
      const all = getAllSignals();
      expect(all).toHaveLength(2);
      expect(all).toContain(debug);
      expect(all).toContain(regular);
    });
  });
});
