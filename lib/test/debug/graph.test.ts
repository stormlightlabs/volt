import { computed, signal } from "$core/signal";
import {
  buildDependencyGraph,
  detectCircularDependencies,
  getDependencies,
  getDependents,
  getSignalDepth,
  hasDependency,
  recordDependencies,
} from "$debug/graph";
import { registerSignal } from "$debug/registry";
import { describe, expect, it } from "vitest";

describe("debug/graph", () => {
  describe("recordDependencies", () => {
    it("records dependencies for a signal", () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());

      recordDependencies(sum, [a, b]);

      const deps = getDependencies(sum);
      expect(deps).toHaveLength(2);
      expect(deps).toContain(a);
      expect(deps).toContain(b);
    });

    it("records dependents bidirectionally", () => {
      const a = signal(1);
      const sum = computed(() => a.get() * 2);

      recordDependencies(sum, [a]);

      const dependents = getDependents(a);
      expect(dependents).toHaveLength(1);
      expect(dependents).toContain(sum);
    });

    it("allows multiple dependents on one dependency", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);
      const triple = computed(() => a.get() * 3);

      recordDependencies(double, [a]);
      recordDependencies(triple, [a]);

      const dependents = getDependents(a);
      expect(dependents).toHaveLength(2);
      expect(dependents).toContain(double);
      expect(dependents).toContain(triple);
    });

    it("accumulates dependencies on repeated calls", () => {
      const a = signal(1);
      const b = signal(2);
      const c = signal(3);
      const sum = computed(() => a.get() + b.get() + c.get());

      recordDependencies(sum, [a, b]);
      recordDependencies(sum, [c]);

      const deps = getDependencies(sum);
      expect(deps).toHaveLength(3);
      expect(deps).toContain(a);
      expect(deps).toContain(b);
      expect(deps).toContain(c);
    });
  });

  describe("getDependencies", () => {
    it("returns empty array for signal with no dependencies", () => {
      const sig = signal(0);
      const deps = getDependencies(sig);
      expect(deps).toEqual([]);
    });

    it("returns all recorded dependencies", () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());

      recordDependencies(sum, [a, b]);

      const deps = getDependencies(sum);
      expect(deps).toHaveLength(2);
      expect(deps).toContain(a);
      expect(deps).toContain(b);
    });
  });

  describe("getDependents", () => {
    it("returns empty array for signal with no dependents", () => {
      const sig = signal(0);
      const deps = getDependents(sig);
      expect(deps).toEqual([]);
    });

    it("returns all dependents", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);
      const triple = computed(() => a.get() * 3);

      recordDependencies(double, [a]);
      recordDependencies(triple, [a]);

      const dependents = getDependents(a);
      expect(dependents).toHaveLength(2);
      expect(dependents).toContain(double);
      expect(dependents).toContain(triple);
    });
  });

  describe("hasDependency", () => {
    it("returns true when dependency exists", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);

      recordDependencies(double, [a]);

      expect(hasDependency(double, a)).toBe(true);
    });

    it("returns false when dependency does not exist", () => {
      const a = signal(1);
      const b = signal(2);
      const double = computed(() => a.get() * 2);

      recordDependencies(double, [a]);
      expect(hasDependency(double, b)).toBe(false);
    });

    it("returns false for signal with no dependencies", () => {
      const a = signal(1);
      const b = signal(2);
      expect(hasDependency(a, b)).toBe(false);
    });
  });

  describe("buildDependencyGraph", () => {
    it("builds a graph with nodes and edges", () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());

      registerSignal(a, "signal", "a");
      registerSignal(b, "signal", "b");
      registerSignal(sum, "computed", "sum");

      recordDependencies(sum, [a, b]);

      const graph = buildDependencyGraph([a, b, sum]);

      expect(graph.nodes).toHaveLength(3);
      expect(graph.edges).toHaveLength(2);
    });

    it("creates nodes with correct metadata", () => {
      const a = signal(5);
      registerSignal(a, "signal", "count");

      const graph = buildDependencyGraph([a]);

      expect(graph.nodes).toHaveLength(1);
      const node = graph.nodes[0];
      expect(node.signal).toBe(a);
      expect(node.name).toBe("count");
      expect(node.type).toBe("signal");
      expect(node.value).toBe(5);
      expect(node.id).toMatch(/^signal-\d+$/);
      expect(node.dependencies).toEqual([]);
      expect(node.dependents).toEqual([]);
    });

    it("creates edges from dependencies to dependents", () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.get() + b.get());

      registerSignal(a, "signal", "a");
      registerSignal(b, "signal", "b");
      registerSignal(sum, "computed", "sum");

      recordDependencies(sum, [a, b]);

      const graph = buildDependencyGraph([a, b, sum]);
      const aId = graph.nodes.find((n) => n.name === "a")?.id;
      const bId = graph.nodes.find((n) => n.name === "b")?.id;
      const sumId = graph.nodes.find((n) => n.name === "sum")?.id;

      expect(graph.edges).toContainEqual({ from: aId, to: sumId });
      expect(graph.edges).toContainEqual({ from: bId, to: sumId });
    });

    it("handles empty signal list", () => {
      const graph = buildDependencyGraph([]);
      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });

    it("includes dependency and dependent IDs in nodes", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);
      const quad = computed(() => double.get() * 2);

      registerSignal(a, "signal", "a");
      registerSignal(double, "computed", "double");
      registerSignal(quad, "computed", "quad");

      recordDependencies(double, [a]);
      recordDependencies(quad, [double]);

      const graph = buildDependencyGraph([a, double, quad]);

      const aNode = graph.nodes.find((n) => n.name === "a");
      const doubleNode = graph.nodes.find((n) => n.name === "double");
      const quadNode = graph.nodes.find((n) => n.name === "quad");

      expect(aNode?.dependencies).toEqual([]);
      expect(aNode?.dependents).toEqual([doubleNode?.id]);

      expect(doubleNode?.dependencies).toEqual([aNode?.id]);
      expect(doubleNode?.dependents).toEqual([quadNode?.id]);

      expect(quadNode?.dependencies).toEqual([doubleNode?.id]);
      expect(quadNode?.dependents).toEqual([]);
    });
  });

  describe("detectCircularDependencies", () => {
    it("returns null when no cycle exists", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);

      recordDependencies(double, [a]);

      const cycle = detectCircularDependencies(a);
      expect(cycle).toBeNull();
    });

    it("detects direct self-dependency", () => {
      const a = signal(1);
      recordDependencies(a, [a]);

      const cycle = detectCircularDependencies(a);
      expect(cycle).not.toBeNull();
      expect(cycle).toContain(a);
    });

    it("detects two-node cycle", () => {
      const a = signal(1);
      const b = computed(() => a.get() * 2);

      recordDependencies(a, [b]);
      recordDependencies(b, [a]);

      const cycle = detectCircularDependencies(a);
      expect(cycle).not.toBeNull();
      expect(cycle).toContain(a);
      expect(cycle).toContain(b);
    });

    it("detects multi-node cycle", () => {
      const a = signal(1);
      const b = computed(() => a.get() * 2);
      const c = computed(() => b.get() * 2);

      recordDependencies(a, [c]);
      recordDependencies(b, [a]);
      recordDependencies(c, [b]);

      const cycle = detectCircularDependencies(a);
      expect(cycle).not.toBeNull();
      expect(cycle).toContain(a);
      expect(cycle).toContain(b);
      expect(cycle).toContain(c);
    });

    it("handles shared dependencies without false positives", () => {
      const a = signal(1);
      const b = computed(() => a.get() * 2);
      const c = computed(() => a.get() * 3);
      const sum = computed(() => b.get() + c.get());

      recordDependencies(b, [a]);
      recordDependencies(c, [a]);
      recordDependencies(sum, [b, c]);

      const cycle = detectCircularDependencies(a);
      expect(cycle).toBeNull();
    });
  });

  describe("getSignalDepth", () => {
    it("returns 0 for signal with no dependencies", () => {
      const sig = signal(0);
      expect(getSignalDepth(sig)).toBe(0);
    });

    it("returns 1 for signal depending on base signal", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);
      recordDependencies(double, [a]);
      expect(getSignalDepth(double)).toBe(1);
    });

    it("calculates depth for multi-level dependencies", () => {
      const a = signal(1);
      const double = computed(() => a.get() * 2);
      const quad = computed(() => double.get() * 2);
      const oct = computed(() => quad.get() * 2);

      recordDependencies(double, [a]);
      recordDependencies(quad, [double]);
      recordDependencies(oct, [quad]);

      expect(getSignalDepth(a)).toBe(0);
      expect(getSignalDepth(double)).toBe(1);
      expect(getSignalDepth(quad)).toBe(2);
      expect(getSignalDepth(oct)).toBe(3);
    });

    it("handles shared dependencies correctly", () => {
      const a = signal(1);
      const b = signal(2);
      const double = computed(() => a.get() * 2);
      const sum = computed(() => double.get() + b.get());

      recordDependencies(double, [a]);
      recordDependencies(sum, [double, b]);

      expect(getSignalDepth(sum)).toBe(2);
    });

    it("uses maximum depth when multiple paths exist", () => {
      const a = signal(1);
      const b = computed(() => a.get() * 2);
      const c = computed(() => b.get() * 2);
      const d = computed(() => a.get() + c.get());

      recordDependencies(b, [a]);
      recordDependencies(c, [b]);
      recordDependencies(d, [a, c]);

      expect(getSignalDepth(d)).toBe(3);
    });

    it("handles circular dependencies gracefully", () => {
      const a = signal(1);
      const b = computed(() => a.get() * 2);

      recordDependencies(a, [b]);
      recordDependencies(b, [a]);

      expect(() => getSignalDepth(a)).not.toThrow();
    });
  });
});
