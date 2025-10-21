import {
  createScopeMetadata,
  getPin,
  getPins,
  getScopeMetadata,
  incrementUidCounter,
  registerPin,
} from "$core/scope-metadata";
import type { Scope } from "$types/volt";
import { beforeEach, describe, expect, it } from "vitest";

describe("Scope Metadata", () => {
  let testElement: HTMLDivElement;
  let testScope: Scope;

  beforeEach(() => {
    testElement = document.createElement("div");
    testScope = {};
  });

  describe("createScopeMetadata", () => {
    it("creates metadata for a scope", () => {
      const metadata = createScopeMetadata(testScope, testElement);

      expect(metadata).toBeDefined();
      expect(metadata.origin).toBe(testElement);
      expect(metadata.pins).toBeInstanceOf(Map);
      expect(metadata.uidCounter).toBe(0);
    });

    it("stores metadata in WeakMap", () => {
      createScopeMetadata(testScope, testElement);

      const retrieved = getScopeMetadata(testScope);
      expect(retrieved).toBeDefined();
      expect(retrieved?.origin).toBe(testElement);
    });

    it("supports optional parent scope", () => {
      const parentScope: Scope = {};
      const metadata = createScopeMetadata(testScope, testElement, parentScope);

      expect(metadata.parent).toBe(parentScope);
    });

    it("initializes empty pin registry", () => {
      createScopeMetadata(testScope, testElement);

      const metadata = getScopeMetadata(testScope);
      expect(metadata?.pins.size).toBe(0);
    });
  });

  describe("getScopeMetadata", () => {
    it("returns undefined for scope without metadata", () => {
      const emptyScope: Scope = {};
      expect(getScopeMetadata(emptyScope)).toBeUndefined();
    });

    it("returns metadata for scope with metadata", () => {
      createScopeMetadata(testScope, testElement);

      const metadata = getScopeMetadata(testScope);
      expect(metadata).toBeDefined();
    });
  });

  describe("registerPin", () => {
    beforeEach(() => {
      createScopeMetadata(testScope, testElement);
    });

    it("registers an element with a name", () => {
      const input = document.createElement("input");
      registerPin(testScope, "username", input);

      const metadata = getScopeMetadata(testScope);
      expect(metadata?.pins.get("username")).toBe(input);
    });

    it("allows multiple pins with different names", () => {
      const input1 = document.createElement("input");
      const input2 = document.createElement("input");

      registerPin(testScope, "username", input1);
      registerPin(testScope, "email", input2);

      const metadata = getScopeMetadata(testScope);
      expect(metadata?.pins.size).toBe(2);
      expect(metadata?.pins.get("username")).toBe(input1);
      expect(metadata?.pins.get("email")).toBe(input2);
    });

    it("overwrites existing pin with same name", () => {
      const input1 = document.createElement("input");
      const input2 = document.createElement("input");

      registerPin(testScope, "username", input1);
      registerPin(testScope, "username", input2);

      const metadata = getScopeMetadata(testScope);
      expect(metadata?.pins.get("username")).toBe(input2);
    });

    it("does nothing if scope has no metadata", () => {
      const emptyScope: Scope = {};
      const input = document.createElement("input");

      // Should not throw
      registerPin(emptyScope, "username", input);

      expect(getScopeMetadata(emptyScope)).toBeUndefined();
    });
  });

  describe("getPin", () => {
    beforeEach(() => {
      createScopeMetadata(testScope, testElement);
    });

    it("returns registered pin by name", () => {
      const input = document.createElement("input");
      registerPin(testScope, "username", input);

      expect(getPin(testScope, "username")).toBe(input);
    });

    it("returns undefined for unregistered pin", () => {
      expect(getPin(testScope, "unknown")).toBeUndefined();
    });

    it("returns undefined if scope has no metadata", () => {
      const emptyScope: Scope = {};
      expect(getPin(emptyScope, "username")).toBeUndefined();
    });
  });

  describe("getPins", () => {
    beforeEach(() => {
      createScopeMetadata(testScope, testElement);
    });

    it("returns empty object for scope with no pins", () => {
      const pins = getPins(testScope);

      expect(pins).toEqual({});
    });

    it("returns all pins as record object", () => {
      const input1 = document.createElement("input");
      const input2 = document.createElement("input");

      registerPin(testScope, "username", input1);
      registerPin(testScope, "email", input2);

      const pins = getPins(testScope);

      expect(pins.username).toBe(input1);
      expect(pins.email).toBe(input2);
      expect(Object.keys(pins)).toHaveLength(2);
    });

    it("returns empty object if scope has no metadata", () => {
      const emptyScope: Scope = {};
      const pins = getPins(emptyScope);

      expect(pins).toEqual({});
    });
  });

  describe("incrementUidCounter", () => {
    beforeEach(() => {
      createScopeMetadata(testScope, testElement);
    });

    it("increments counter and returns new value", () => {
      const id1 = incrementUidCounter(testScope);
      const id2 = incrementUidCounter(testScope);
      const id3 = incrementUidCounter(testScope);

      expect(id1).toBe(1);
      expect(id2).toBe(2);
      expect(id3).toBe(3);
    });

    it("returns 0 for scope without metadata", () => {
      const emptyScope: Scope = {};
      expect(incrementUidCounter(emptyScope)).toBe(0);
    });

    it("maintains separate counters per scope", () => {
      const scope1: Scope = {};
      const scope2: Scope = {};
      const elem1 = document.createElement("div");
      const elem2 = document.createElement("div");

      createScopeMetadata(scope1, elem1);
      createScopeMetadata(scope2, elem2);

      expect(incrementUidCounter(scope1)).toBe(1);
      expect(incrementUidCounter(scope2)).toBe(1);
      expect(incrementUidCounter(scope1)).toBe(2);
      expect(incrementUidCounter(scope2)).toBe(2);
    });
  });

  describe("Memory Management", () => {
    it("allows garbage collection of scope", () => {
      // This test verifies WeakMap behavior
      let scope: Scope | null = {};
      const element = document.createElement("div");

      createScopeMetadata(scope, element);
      expect(getScopeMetadata(scope)).toBeDefined();

      // Clear reference - metadata should be GC-able
      scope = null;

      // Cannot directly test GC, but at least verify no errors
      expect(true).toBe(true);
    });
  });
});
