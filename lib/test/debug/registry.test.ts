import { reactive } from "$core/reactive";
import { computed, signal } from "$core/signal";
import {
  clearRegistry,
  getAllReactives,
  getAllSignals,
  getReactiveInfo,
  getReactiveMetadata,
  getRegistryStats,
  getSignalInfo,
  getSignalMetadata,
  nameReactive,
  nameSignal,
  registerReactive,
  registerSignal,
} from "$debug/registry";
import { beforeEach, describe, expect, it } from "vitest";

describe("debug/registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe("signal registration", () => {
    it("registers a signal with metadata", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "count");

      const metadata = getSignalMetadata(sig);
      expect(metadata).toBeDefined();
      expect(metadata?.type).toBe("signal");
      expect(metadata?.name).toBe("count");
      expect(metadata?.id).toMatch(/^signal-\d+$/);
      expect(metadata?.createdAt).toBeTypeOf("number");
    });

    it("registers a signal without a name", () => {
      const sig = signal(0);
      registerSignal(sig, "signal");

      const metadata = getSignalMetadata(sig);
      expect(metadata).toBeDefined();
      expect(metadata?.type).toBe("signal");
      expect(metadata?.name).toBeUndefined();
    });

    it("does not re-register an already registered signal", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "first");
      const firstMetadata = getSignalMetadata(sig);

      registerSignal(sig, "signal", "second");
      const secondMetadata = getSignalMetadata(sig);

      expect(firstMetadata).toBe(secondMetadata);
      expect(secondMetadata?.name).toBe("first");
    });

    it("registers computed signals with correct type", () => {
      const comp = computed(() => 5);
      registerSignal(comp, "computed", "doubled");

      const metadata = getSignalMetadata(comp);
      expect(metadata?.type).toBe("computed");
      expect(metadata?.name).toBe("doubled");
    });

    it("assigns incremental IDs", () => {
      const sig1 = signal(0);
      const sig2 = signal(0);
      const comp = computed(() => 0);

      registerSignal(sig1, "signal");
      registerSignal(sig2, "signal");
      registerSignal(comp, "computed");

      const meta1 = getSignalMetadata(sig1);
      const meta2 = getSignalMetadata(sig2);
      const meta3 = getSignalMetadata(comp);

      expect(meta1?.id).toBe("signal-1");
      expect(meta2?.id).toBe("signal-2");
      expect(meta3?.id).toBe("computed-3");
    });
  });

  describe("signal info", () => {
    it("returns signal info with current value", () => {
      const sig = signal(42);
      registerSignal(sig, "signal", "answer");

      const info = getSignalInfo(sig);
      expect(info).toBeDefined();
      expect(info?.id).toMatch(/^signal-\d+$/);
      expect(info?.type).toBe("signal");
      expect(info?.name).toBe("answer");
      expect(info?.value).toBe(42);
      expect(info?.createdAt).toBeTypeOf("number");
      expect(info?.age).toBeTypeOf("number");
      expect(info!.age).toBeGreaterThanOrEqual(0);
    });

    it("returns undefined for unregistered signal", () => {
      const sig = signal(0);
      const info = getSignalInfo(sig);
      expect(info).toBeUndefined();
    });

    it("reflects updated values", () => {
      const sig = signal(0);
      registerSignal(sig, "signal");

      const info1 = getSignalInfo(sig);
      expect(info1?.value).toBe(0);

      sig.set(10);

      const info2 = getSignalInfo(sig);
      expect(info2?.value).toBe(10);
    });
  });

  describe("signal naming", () => {
    it("sets name on a registered signal", () => {
      const sig = signal(0);
      registerSignal(sig, "signal");

      nameSignal(sig, "mySignal");

      const metadata = getSignalMetadata(sig);
      expect(metadata?.name).toBe("mySignal");
    });

    it("updates existing name", () => {
      const sig = signal(0);
      registerSignal(sig, "signal", "oldName");

      nameSignal(sig, "newName");

      const metadata = getSignalMetadata(sig);
      expect(metadata?.name).toBe("newName");
    });

    it("does nothing for unregistered signal", () => {
      const sig = signal(0);
      nameSignal(sig, "test");

      const metadata = getSignalMetadata(sig);
      expect(metadata).toBeUndefined();
    });
  });

  describe("getAllSignals", () => {
    it("returns all registered signals", () => {
      const sig1 = signal(1);
      const sig2 = signal(2);
      const comp = computed(() => 3);

      registerSignal(sig1, "signal");
      registerSignal(sig2, "signal");
      registerSignal(comp, "computed");

      const all = getAllSignals();
      expect(all).toHaveLength(3);
      expect(all).toContain(sig1);
      expect(all).toContain(sig2);
      expect(all).toContain(comp);
    });

    it("returns empty array when no signals registered", () => {
      const all = getAllSignals();
      expect(all).toEqual([]);
    });

    it.skip("cleans up garbage collected signals", () => {
      // NOTE: GC is non-deterministic in test environments
      // We document expected behavior but can't reliably test it
      let sig: ReturnType<typeof signal> | null = signal(0);
      registerSignal(sig, "signal");
      expect(getAllSignals()).toHaveLength(1);

      sig = null;

      const all = getAllSignals();
      expect(all).toHaveLength(0);
    });
  });

  describe("reactive registration", () => {
    it("registers a reactive object with metadata", () => {
      const obj = reactive({ count: 0 });
      registerReactive(obj, "state");

      const metadata = getReactiveMetadata(obj);
      expect(metadata).toBeDefined();
      expect(metadata?.type).toBe("reactive");
      expect(metadata?.name).toBe("state");
      expect(metadata?.id).toMatch(/^reactive-\d+$/);
      expect(metadata?.createdAt).toBeTypeOf("number");
    });

    it("does not re-register an already registered reactive", () => {
      const obj = reactive({ count: 0 });
      registerReactive(obj, "first");
      const firstMetadata = getReactiveMetadata(obj);

      registerReactive(obj, "second");
      const secondMetadata = getReactiveMetadata(obj);

      expect(firstMetadata).toBe(secondMetadata);
      expect(secondMetadata?.name).toBe("first");
    });
  });

  describe("reactive info", () => {
    it("returns reactive info with current value", () => {
      const obj = reactive({ count: 42 });
      registerReactive(obj, "state");

      const info = getReactiveInfo(obj);
      expect(info).toBeDefined();
      expect(info?.id).toMatch(/^reactive-\d+$/);
      expect(info?.type).toBe("reactive");
      expect(info?.name).toBe("state");
      expect(info?.value).toBe(obj);
      expect(info?.createdAt).toBeTypeOf("number");
      expect(info?.age).toBeTypeOf("number");
    });

    it("returns undefined for unregistered reactive", () => {
      const obj = reactive({ count: 0 });
      const info = getReactiveInfo(obj);
      expect(info).toBeUndefined();
    });
  });

  describe("reactive naming", () => {
    it("sets name on a registered reactive", () => {
      const obj = reactive({ count: 0 });
      registerReactive(obj);

      nameReactive(obj, "myState");

      const metadata = getReactiveMetadata(obj);
      expect(metadata?.name).toBe("myState");
    });

    it("does nothing for unregistered reactive", () => {
      const obj = reactive({ count: 0 });
      nameReactive(obj, "test");

      const metadata = getReactiveMetadata(obj);
      expect(metadata).toBeUndefined();
    });
  });

  describe("getAllReactives", () => {
    it("returns all registered reactive objects", () => {
      const obj1 = reactive({ a: 1 });
      const obj2 = reactive({ b: 2 });

      registerReactive(obj1);
      registerReactive(obj2);

      const all = getAllReactives();
      expect(all).toHaveLength(2);
      expect(all).toContain(obj1);
      expect(all).toContain(obj2);
    });

    it("returns empty array when no reactives registered", () => {
      const all = getAllReactives();
      expect(all).toEqual([]);
    });

    it.skip("cleans up garbage collected reactives", () => {
      let obj: ReturnType<typeof reactive> | null = reactive({ count: 0 });
      registerReactive(obj);
      expect(getAllReactives()).toHaveLength(1);

      obj = null;

      const all = getAllReactives();
      expect(all).toHaveLength(0);
    });
  });

  describe("registry stats", () => {
    it("returns correct counts", () => {
      const sig1 = signal(1);
      const sig2 = signal(2);
      const comp = computed(() => 3);
      const obj = reactive({ count: 0 });

      registerSignal(sig1, "signal");
      registerSignal(sig2, "signal");
      registerSignal(comp, "computed");
      registerReactive(obj);

      const stats = getRegistryStats();
      expect(stats.totalSignals).toBe(3);
      expect(stats.regularSignals).toBe(2);
      expect(stats.computedSignals).toBe(1);
      expect(stats.reactiveObjects).toBe(1);
    });

    it("returns zeros when registry is empty", () => {
      const stats = getRegistryStats();
      expect(stats.totalSignals).toBe(0);
      expect(stats.regularSignals).toBe(0);
      expect(stats.computedSignals).toBe(0);
      expect(stats.reactiveObjects).toBe(0);
    });
  });

  describe("clearRegistry", () => {
    it("clears all registered signals and reactives", () => {
      const sig = signal(0);
      const obj = reactive({ count: 0 });

      registerSignal(sig, "signal");
      registerReactive(obj);

      expect(getAllSignals()).toHaveLength(1);
      expect(getAllReactives()).toHaveLength(1);

      clearRegistry();

      expect(getAllSignals()).toHaveLength(0);
      expect(getAllReactives()).toHaveLength(0);
    });

    it("resets ID counter", () => {
      const sig1 = signal(0);
      registerSignal(sig1, "signal");
      const meta1 = getSignalMetadata(sig1);

      clearRegistry();

      const sig2 = signal(0);
      registerSignal(sig2, "signal");
      const meta2 = getSignalMetadata(sig2);

      expect(meta1?.id).toBe("signal-1");
      expect(meta2?.id).toBe("signal-1");
    });
  });
});
