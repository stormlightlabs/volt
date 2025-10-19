import { signal } from "$core/signal";
import { deserializeScope, getSerializedState, hydrate, isHydrated, isServerRendered, serializeScope } from "$core/ssr";
import { beforeEach, describe, expect, it } from "vitest";

describe("ssr", () => {
  describe("serializeScope", () => {
    it("serializes signals to their values", () => {
      const scope = { count: signal(42), name: signal("Alice") };
      const json = serializeScope(scope);
      expect(JSON.parse(json)).toEqual({ count: 42, name: "Alice" });
    });

    it("handles primitives without signals", () => {
      const scope = { static: "value", number: 123 };
      const json = serializeScope(scope);
      expect(JSON.parse(json)).toEqual({ static: "value", number: 123 });
    });

    it("handles mixed signals and primitives", () => {
      const scope = { reactive: signal(true), static: false };
      const json = serializeScope(scope);
      expect(JSON.parse(json)).toEqual({ reactive: true, static: false });
    });

    it("handles empty scope", () => {
      const scope = {};
      const json = serializeScope(scope);
      expect(JSON.parse(json)).toEqual({});
    });
  });

  describe("deserializeScope", () => {
    it("creates signals from plain values", () => {
      const data = { count: 42, name: "Bob" };
      const scope = deserializeScope(data);

      expect(scope.count).toBeDefined();
      expect(scope.name).toBeDefined();
      expect(typeof scope.count).toBe("object");
      expect((scope.count as { get: () => number }).get()).toBe(42);
      expect((scope.name as { get: () => string }).get()).toBe("Bob");
    });

    it("handles empty data", () => {
      const scope = deserializeScope({});
      expect(Object.keys(scope)).toHaveLength(0);
    });

    it("handles various data types", () => {
      const data = { string: "hello", number: 123, boolean: true, nullValue: null };

      const scope = deserializeScope(data);
      expect((scope.string as { get: () => string }).get()).toBe("hello");
      expect((scope.number as { get: () => number }).get()).toBe(123);
      expect((scope.boolean as { get: () => boolean }).get()).toBe(true);
      expect((scope.nullValue as { get: () => null }).get()).toBe(null);
    });
  });

  describe("isHydrated", () => {
    it("returns false for non-hydrated elements", () => {
      const el = document.createElement("div");
      expect(isHydrated(el)).toBe(false);
    });

    it("returns true for hydrated elements", () => {
      const el = document.createElement("div");
      el.setAttribute("data-volt-hydrated", "true");
      expect(isHydrated(el)).toBe(true);
    });
  });

  describe("isServerRendered", () => {
    it("returns false when no serialized state exists", () => {
      const el = document.createElement("div");
      el.id = "app";
      expect(isServerRendered(el)).toBe(false);
    });

    it("returns true when serialized state exists", () => {
      const el = document.createElement("div");
      el.id = "app";
      el.innerHTML = `
        <script type="application/json" id="volt-state-app">
          {"count": 0}
        </script>
      `;
      expect(isServerRendered(el)).toBe(true);
    });

    it("returns false when element has no id", () => {
      const el = document.createElement("div");
      expect(isServerRendered(el)).toBe(false);
    });
  });

  describe("getSerializedState", () => {
    it("extracts state from script tag", () => {
      const el = document.createElement("div");
      el.id = "app";
      el.innerHTML = `
        <script type="application/json" id="volt-state-app">
          {"count": 42, "name": "Charlie"}
        </script>
      `;

      const state = getSerializedState(el);
      expect(state).toEqual({ count: 42, name: "Charlie" });
    });

    it("returns null when no script tag exists", () => {
      const el = document.createElement("div");
      el.id = "app";
      const state = getSerializedState(el);
      expect(state).toBeNull();
    });

    it("returns null when element has no id", () => {
      const el = document.createElement("div");
      const state = getSerializedState(el);
      expect(state).toBeNull();
    });

    it("returns null for malformed JSON", () => {
      const el = document.createElement("div");
      el.id = "app";
      el.innerHTML = `
        <script type="application/json" id="volt-state-app">
          {invalid json}
        </script>
      `;

      const state = getSerializedState(el);
      expect(state).toBeNull();
    });

    it("returns null for empty script tag", () => {
      const el = document.createElement("div");
      el.id = "app";
      el.innerHTML = `
        <script type="application/json" id="volt-state-app"></script>
      `;

      const state = getSerializedState(el);
      expect(state).toBeNull();
    });
  });

  describe("hydrate", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    it("hydrates element with serialized state", () => {
      document.body.innerHTML = `
        <div id="app" data-volt>
          <script type="application/json" id="volt-state-app">
            {"count": 5}
          </script>
          <p data-volt-text="count">5</p>
        </div>
      `;

      const result = hydrate();

      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].element.id).toBe("app");
      expect(result.roots[0].scope.count).toBeDefined();
      expect((result.roots[0].scope.count as { get: () => number }).get()).toBe(5);
    });

    it("marks elements as hydrated", () => {
      document.body.innerHTML = `
        <div id="app" data-volt>
          <script type="application/json" id="volt-state-app">
            {"count": 0}
          </script>
        </div>
      `;

      hydrate();

      const el = document.getElementById("app")!;
      expect(isHydrated(el)).toBe(true);
    });

    it("skips already hydrated elements", () => {
      document.body.innerHTML = `
        <div id="app" data-volt data-volt-hydrated="true">
          <script type="application/json" id="volt-state-app">
            {"count": 0}
          </script>
        </div>
      `;

      const result = hydrate();
      expect(result.roots).toHaveLength(0);
    });

    it("hydrates already hydrated elements when skipHydrated is false", () => {
      document.body.innerHTML = `
        <div id="app" data-volt data-volt-hydrated="true">
          <script type="application/json" id="volt-state-app">
            {"count": 0}
          </script>
        </div>
      `;

      const result = hydrate({ skipHydrated: false });
      expect(result.roots).toHaveLength(1);
    });

    it("hydrates multiple roots", () => {
      document.body.innerHTML = `
        <div id="app1" data-volt>
          <script type="application/json" id="volt-state-app1">
            {"count": 1}
          </script>
        </div>
        <div id="app2" data-volt>
          <script type="application/json" id="volt-state-app2">
            {"count": 2}
          </script>
        </div>
      `;

      const result = hydrate();
      expect(result.roots).toHaveLength(2);
      expect((result.roots[0].scope.count as { get: () => number }).get()).toBe(1);
      expect((result.roots[1].scope.count as { get: () => number }).get()).toBe(2);
    });

    it("uses custom root selector", () => {
      document.body.innerHTML = `
        <div id="app1" data-volt></div>
        <div id="app2" class="custom"></div>
      `;

      const result = hydrate({ rootSelector: ".custom" });
      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].element.id).toBe("app2");
    });

    it("falls back to data-volt-state when no serialized state", () => {
      document.body.innerHTML = `
        <div id="app" data-volt data-volt-state='{"count": 10}'>
          <p data-volt-text="count">10</p>
        </div>
      `;

      const result = hydrate();
      expect(result.roots).toHaveLength(1);
      expect((result.roots[0].scope.count as { get: () => number }).get()).toBe(10);
    });

    it("handles data-volt-computed attributes", () => {
      document.body.innerHTML = `
        <div id="app" data-volt data-volt-state='{"count": 5}' data-volt-computed:double="count * 2">
          <p data-volt-text="double">10</p>
        </div>
      `;

      const result = hydrate();
      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].scope.double).toBeDefined();
      expect((result.roots[0].scope.double as { get: () => number }).get()).toBe(10);
    });

    it("cleanup unmounts all roots", () => {
      document.body.innerHTML = `
        <div id="app" data-volt data-volt-state='{"count": 0}'></div>
      `;

      const result = hydrate();
      expect(result.roots).toHaveLength(1);

      result.cleanup();
    });

    it("handles errors gracefully", () => {
      document.body.innerHTML = `
        <div id="app1" data-volt data-volt-state='{"count": 0}'></div>
        <div id="app2" data-volt data-volt-state='invalid json'></div>
        <div id="app3" data-volt data-volt-state='{"count": 1}'></div>
      `;

      const result = hydrate();
      expect(result.roots.length).toBeGreaterThan(0);
    });
  });
});
