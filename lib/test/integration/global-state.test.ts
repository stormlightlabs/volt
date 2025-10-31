import { mount } from "$core/binder";
import { charge } from "$core/charge";
import { signal } from "$core/signal";
import { getStore, registerStore } from "$core/store";
import type { Scope } from "$types/volt";
import { screen, waitFor } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Global State Integration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    const store = getStore();
    for (const key of Object.keys(store)) {
      if (key !== "_signals" && key !== "get" && key !== "set" && key !== "has") {
        delete (store as Record<string, unknown>)[key];
      }
    }
    store._signals.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("$store in expressions", () => {
    it("accesses global store values in data-volt-text", () => {
      registerStore({ theme: "dark" });

      document.body.innerHTML = `
        <div data-volt>
          <p data-volt-text="$store.get('theme')"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("dark")).toBeInTheDocument();
    });

    it("reacts to store changes", async () => {
      registerStore({ count: 0 });

      document.body.innerHTML = `
        <div data-volt>
          <p data-volt-text="$store.get('count')"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("0")).toBeInTheDocument();

      const store = getStore();
      store.set("count", 5);

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });

    it("shares state across multiple roots", async () => {
      registerStore({ message: "Hello" });

      document.body.innerHTML = `
        <div data-volt>
          <p data-volt-text="$store.get('message')"></p>
        </div>
        <div data-volt>
          <p data-volt-text="$store.get('message')"></p>
        </div>
      `;

      charge();

      const paragraphs = screen.getAllByText("Hello");
      expect(paragraphs).toHaveLength(2);

      const store = getStore();
      store.set("message", "World");

      await waitFor(() => {
        const updated = screen.getAllByText("World");
        expect(updated).toHaveLength(2);
      });
    });

    // TODO: Add test for accessing store signals directly ($store.theme vs $store.get('theme'))
  });

  describe("$origin", () => {
    it("references the root element", () => {
      document.body.innerHTML = `
        <div data-volt id="test-root">
          <p data-volt-text="$origin.id"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("test-root")).toBeInTheDocument();
    });

    it("is different for different roots", () => {
      document.body.innerHTML = `
        <div data-volt id="root1">
          <p data-volt-text="$origin.id"></p>
        </div>
        <div data-volt id="root2">
          <p data-volt-text="$origin.id"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("root1")).toBeInTheDocument();
      expect(screen.getByText("root2")).toBeInTheDocument();
    });
  });

  describe("$scope", () => {
    it("provides access to scope object", () => {
      const root = document.createElement("div");
      const paragraph = document.createElement("p");
      paragraph.dataset.voltText = "Object.keys($scope).length";
      root.append(paragraph);
      document.body.append(root);

      const scope: Scope = { count: signal(0) };
      mount(root, scope);

      expect(paragraph.textContent).toBeTruthy();
    });

    // TODO: Add more $scope access tests
  });

  describe("$pins", () => {
    it("accesses pinned elements", () => {
      document.body.innerHTML = `
        <div data-volt>
          <input data-volt-pin="username" value="Alice" />
          <p data-volt-text="$pins.username.value"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("allows calling methods on pinned elements", () => {
      document.body.innerHTML = `
        <div data-volt>
          <input data-volt-pin="field" />
          <button data-volt-on-click="$pins.field.focus()">Focus</button>
        </div>
      `;

      charge();

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button");

      const focusSpy = vi.spyOn(input, "focus");

      button.click();

      expect(focusSpy).toHaveBeenCalled();
    });

    it("isolates pins per root", () => {
      document.body.innerHTML = `
        <div data-volt>
          <input data-volt-pin="field" value="First" />
          <p data-volt-text="$pins.field.value"></p>
        </div>
        <div data-volt>
          <input data-volt-pin="field" value="Second" />
          <p data-volt-text="$pins.field.value"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });

    // TODO: Test dynamic pin registration (pins added after mount)
  });

  describe("$pulse", () => {
    it("defers execution to next microtask", async () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"log": []}'>
          <button data-volt-on-click="log.set([...log.get(), 'sync']); $pulse(() => log.set([...log.get(), 'async']))">Click</button>
          <p data-volt-text="log.join(', ')"></p>
        </div>
      `;

      charge();

      const button = screen.getByRole("button");
      button.click();

      expect(screen.getByText("sync")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("sync, async")).toBeInTheDocument();
      });
    });

    // TODO: Add test for $pulse ensuring DOM updates are applied
  });

  describe("$uid", () => {
    it("generates unique IDs", () => {
      document.body.innerHTML = `
        <div data-volt>
          <input data-volt-bind:id="$uid('field')" />
          <input data-volt-bind:id="$uid('field')" />
        </div>
      `;

      charge();

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0].id).toBe("volt-field-1");
      expect(inputs[1].id).toBe("volt-field-2");
    });

    it("maintains separate counters per root", () => {
      document.body.innerHTML = `
        <div data-volt>
          <input data-volt-bind:id="$uid('field')" />
        </div>
        <div data-volt>
          <input data-volt-bind:id="$uid('field')" />
        </div>
      `;

      charge();

      const inputs = screen.getAllByRole("textbox");
      expect(inputs[0].id).toBe("volt-field-1");
      expect(inputs[1].id).toBe("volt-field-1");
    });

    // TODO: Add test for deterministic ID generation across re-renders
  });

  describe("$arc", () => {
    it("dispatches custom events", () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"saved": false}' data-volt-on-user:save="saved.set(true)">
          <button data-volt-on-click="$arc('user:save', { id: 123 })">Save</button>
          <p data-volt-text="saved"></p>
        </div>
      `;

      charge();

      const button = screen.getByRole("button");
      expect(screen.getByText("false")).toBeInTheDocument();

      button.click();

      expect(screen.getByText("true")).toBeInTheDocument();
    });

    it("includes event detail", () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"userId": 0}' data-volt-on-user:save="userId.set($event.detail.id)">
          <button data-volt-on-click="$arc('user:save', { id: 456 })">Save</button>
          <p data-volt-text="userId"></p>
        </div>
      `;

      charge();

      const button = screen.getByRole("button");
      button.click();

      expect(screen.getByText("456")).toBeInTheDocument();
    });

    // TODO: Test event bubbling across DOM hierarchy
  });

  describe("$probe", () => {
    it("observes reactive expressions and calls callback on changes", async () => {
      const cb = vi.fn();

      document.body.innerHTML = `
        <div data-volt data-volt-state='{"count": 0}'>
          <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
        </div>
      `;

      const result = charge();
      const scope = result.roots[0].scope;
      // @ts-expect-error $probe requires casting
      const cleanup = scope.$probe("count", cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(0);

      const button = screen.getByRole("button");
      button.click();

      await waitFor(() => {
        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb).toHaveBeenLastCalledWith(1);
      });

      cleanup();
    });

    it("can be used with data-volt-init", async () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"count": 0, "log": []}' data-volt-init="$probe('count', v => log.set([...log.get(), v]))">
          <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
          <p data-volt-text="log.join(', ')"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("0")).toBeInTheDocument();

      const button = screen.getByRole("button");
      button.click();

      await waitFor(() => {
        expect(screen.getByText("0, 1")).toBeInTheDocument();
      });

      button.click();

      await waitFor(() => {
        expect(screen.getByText("0, 1, 2")).toBeInTheDocument();
      });
    });

    it("observes computed expressions", async () => {
      const callback = vi.fn();

      document.body.innerHTML = `
        <div data-volt data-volt-state='{"count": 5}'>
          <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
        </div>
      `;

      const result = charge();
      const scope = result.roots[0].scope;
      // @ts-expect-error $probe requires casting
      const cleanup = scope.$probe("count * 2", callback);

      expect(callback).toHaveBeenCalledWith(10);

      const button = screen.getByRole("button");
      button.click();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledWith(12);
      });

      cleanup();
    });

    it("cleanup stops observing", async () => {
      const callback = vi.fn();

      document.body.innerHTML = `
        <div data-volt data-volt-state='{"count": 0}'>
          <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
        </div>
      `;

      const result = charge();
      const scope = result.roots[0].scope;

      // @ts-expect-error $probe requires casting
      const cleanup = scope.$probe("count", callback);

      expect(callback).toHaveBeenCalledTimes(1);

      cleanup();

      const button = screen.getByRole("button");
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("data-volt-init", () => {
    it("executes code once on mount", () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"mounted": false}' data-volt-init="mounted.set(true)">
          <p data-volt-text="mounted"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("true")).toBeInTheDocument();
    });

    it("has access to scope variables", () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"initialized": false}' data-volt-init="initialized.set(true)">
          <p data-volt-text="initialized"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("true")).toBeInTheDocument();
    });

    it("can call methods and use special variables", () => {
      document.body.innerHTML = `
        <div data-volt id="test-root" data-volt-state='{"originId": "", "generatedId": ""}' data-volt-init="originId.set($origin.id); generatedId.set($uid('test'))">
          <p data-volt-text="originId"></p>
          <p data-volt-text="generatedId"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("test-root")).toBeInTheDocument();
      expect(screen.getByText("volt-test-1")).toBeInTheDocument();
    });

    it("works with multiple elements", () => {
      document.body.innerHTML = `
        <div data-volt data-volt-state='{"logs": []}'>
          <div data-volt-init="logs.push('first')">First</div>
          <div data-volt-init="logs.push('second')">Second</div>
          <p data-volt-text="logs.join(', ')"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("first, second")).toBeInTheDocument();
    });

    it("handles errors gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      document.body.innerHTML = `
        <div data-volt data-volt-init="nonExistentVariable.doSomething()">
          <p>Content</p>
        </div>
      `;

      charge();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, expect.stringContaining("[binding]"));
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, "Caused by:", expect.any(Error));
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(3, "Element:", expect.any(HTMLElement));
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Declarative Store", () => {
    it("registers store from script tag", () => {
      document.body.innerHTML = `
        <script type="application/json" data-volt-store>
        {
          "theme": "dark",
          "count": 0
        }
        </script>

        <div data-volt>
          <p data-volt-text="$store.get('theme')"></p>
          <p data-volt-text="$store.get('count')"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("dark")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles multiple store script tags", () => {
      document.body.innerHTML = `
        <script type="application/json" data-volt-store>
        { "theme": "dark" }
        </script>

        <script type="application/json" data-volt-store>
        { "count": 5 }
        </script>

        <div data-volt>
          <p data-volt-text="$store.get('theme')"></p>
          <p data-volt-text="$store.get('count')"></p>
        </div>
      `;

      charge();

      expect(screen.getByText("dark")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    // TODO: Test error handling for invalid JSON in store script
  });

  describe("Combined Features", () => {
    it("uses multiple special variables together", async () => {
      registerStore({ prefix: "user" });

      document.body.innerHTML = `
        <div data-volt data-volt-state='{"name": "Alice"}'>
          <input data-volt-pin="nameInput" data-volt-bind:id="$uid($store.get('prefix'))" data-volt-model="name" />
          <button data-volt-on-click="$arc('name:changed', { value: name }); $pulse(() => $pins.nameInput.focus())">
            Update
          </button>
          <p data-volt-text="'Root: ' + $origin.tagName"></p>
        </div>
      `;

      charge();

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button");
      expect(input.id).toBe("volt-user-1");
      expect(screen.getByText("Root: DIV")).toBeInTheDocument();

      const focusSpy = vi.spyOn(input, "focus");

      button.click();

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalled();
      });
    });
  });
});
