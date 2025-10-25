import { mount } from "$core/binder";
import {
  clearAllGlobalHooks,
  clearGlobalHooks,
  getElementBindings,
  isElementMounted,
  notifyElementMounted,
  notifyElementUnmounted,
  registerElementHook,
  registerGlobalHook,
  unregisterGlobalHook,
} from "$core/lifecycle";
import { registerPlugin } from "$core/plugin";
import { signal } from "$core/signal";
import type { PluginContext } from "$types/volt";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("lifecycle hooks", () => {
  afterEach(() => {
    clearAllGlobalHooks();
  });

  describe("global lifecycle hooks", () => {
    describe("beforeMount", () => {
      it("executes before mount", () => {
        const executionOrder: string[] = [];
        const root = document.createElement("div");
        root.innerHTML = "<div data-volt-text=\"message\"></div>";

        registerGlobalHook("beforeMount", () => {
          executionOrder.push("beforeMount");
        });

        const message = signal("test");
        executionOrder.push("before mount call");
        mount(root, { message });
        executionOrder.push("after mount call");

        expect(executionOrder).toEqual(["before mount call", "beforeMount", "after mount call"]);
      });

      it("receives root and scope", () => {
        let receivedRoot: Element | undefined;
        let receivedScope: Record<string, unknown> | undefined;

        const root = document.createElement("div");
        const message = signal("test");

        registerGlobalHook("beforeMount", (element: Element, scope: Record<string, unknown>) => {
          receivedRoot = element;
          receivedScope = scope;
        });

        mount(root, { message });

        expect(receivedRoot).toBeDefined();
        expect(receivedRoot).toBe(root);
        expect(receivedScope!.message).toBe(message);
        expect(receivedScope!.$store).toBeDefined();
        expect(receivedScope!.$arc).toBeDefined();
      });

      it("can register multiple hooks", () => {
        const hooks: number[] = [];
        const root = document.createElement("div");

        registerGlobalHook("beforeMount", () => {
          hooks.push(1);
        });
        registerGlobalHook("beforeMount", () => {
          hooks.push(2);
        });

        mount(root, {});

        expect(hooks).toEqual([1, 2]);
      });
    });

    describe("afterMount", () => {
      it("executes after mount completes", () => {
        const executionOrder: string[] = [];
        const root = document.createElement("div");
        root.innerHTML = "<div data-volt-text=\"message\"></div>";

        registerGlobalHook("afterMount", () => {
          executionOrder.push("afterMount");
        });

        const message = signal("test");
        executionOrder.push("before mount");
        mount(root, { message });
        executionOrder.push("after mount");

        expect(executionOrder).toEqual(["before mount", "afterMount", "after mount"]);
      });

      it("executes after mount completes", () => {
        const root = document.createElement("div");
        root.innerHTML = "<div data-volt-text=\"message\"></div>";

        let mountCompleted = false;

        registerGlobalHook("afterMount", () => {
          mountCompleted = true;
        });

        const message = signal("hello");
        mount(root, { message });

        expect(mountCompleted).toBe(true);
      });
    });

    describe("beforeUnmount", () => {
      it("executes before unmount", () => {
        const executionOrder: string[] = [];
        const root = document.createElement("div");

        registerGlobalHook("beforeUnmount", () => {
          executionOrder.push("beforeUnmount");
        });

        const cleanup = mount(root, {});

        executionOrder.push("before cleanup");
        cleanup();
        executionOrder.push("after cleanup");

        expect(executionOrder).toEqual(["before cleanup", "beforeUnmount", "after cleanup"]);
      });

      it("executes before bindings are destroyed", () => {
        const root = document.createElement("div");
        root.innerHTML = "<div data-volt-text=\"message\"></div>";

        let wasMounted = false;

        registerGlobalHook("beforeUnmount", () => {
          wasMounted = true;
        });

        const message = signal("hello");
        const cleanup = mount(root, { message });

        cleanup();

        expect(wasMounted).toBe(true);
      });
    });

    describe("afterUnmount", () => {
      it("executes after unmount completes", () => {
        const executionOrder: string[] = [];
        const root = document.createElement("div");

        registerGlobalHook("afterUnmount", () => {
          executionOrder.push("afterUnmount");
        });

        const cleanup = mount(root, {});

        executionOrder.push("before cleanup");
        cleanup();
        executionOrder.push("after cleanup");

        expect(executionOrder).toEqual(["before cleanup", "afterUnmount", "after cleanup"]);
      });
    });

    describe("hook registration management", () => {
      it("can unregister hooks", () => {
        const hook = vi.fn();
        const root = document.createElement("div");

        const unregister = registerGlobalHook("beforeMount", hook);

        mount(root, {});
        expect(hook).toHaveBeenCalledTimes(1);

        unregister();

        mount(root, {});
        expect(hook).toHaveBeenCalledTimes(1);
      });

      it("unregisterGlobalHook removes hooks", () => {
        const hook = vi.fn();
        const root = document.createElement("div");

        registerGlobalHook("beforeMount", hook);

        mount(root, {});
        expect(hook).toHaveBeenCalledTimes(1);

        unregisterGlobalHook("beforeMount", hook);

        mount(root, {});
        expect(hook).toHaveBeenCalledTimes(1);
      });

      it("clearGlobalHooks removes all hooks for a lifecycle event", () => {
        const hook1 = vi.fn();
        const hook2 = vi.fn();
        const root = document.createElement("div");

        registerGlobalHook("beforeMount", hook1);
        registerGlobalHook("beforeMount", hook2);

        clearGlobalHooks("beforeMount");

        mount(root, {});

        expect(hook1).not.toHaveBeenCalled();
        expect(hook2).not.toHaveBeenCalled();
      });

      it("clearAllGlobalHooks removes all hooks", () => {
        const beforeMountHook = vi.fn();
        const afterMountHook = vi.fn();
        const root = document.createElement("div");

        registerGlobalHook("beforeMount", beforeMountHook);
        registerGlobalHook("afterMount", afterMountHook);

        clearAllGlobalHooks();

        mount(root, {});

        expect(beforeMountHook).not.toHaveBeenCalled();
        expect(afterMountHook).not.toHaveBeenCalled();
      });
    });

    describe("error handling", () => {
      it("catches and logs errors in beforeMount hooks", () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const root = document.createElement("div");

        registerGlobalHook("beforeMount", () => {
          throw new Error("beforeMount error");
        });

        expect(() => {
          mount(root, {});
        }).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith("Caused by:", expect.any(Error));

        consoleErrorSpy.mockRestore();
      });

      it("continues executing other hooks after error", () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const hook2 = vi.fn();
        const root = document.createElement("div");

        registerGlobalHook("beforeMount", () => {
          throw new Error("Error");
        });
        registerGlobalHook("beforeMount", hook2);

        mount(root, {});

        expect(hook2).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe("element lifecycle", () => {
    it("tracks element mounted state", () => {
      const element = document.createElement("div");

      expect(isElementMounted(element)).toBe(false);
      notifyElementMounted(element);
      expect(isElementMounted(element)).toBe(true);
      notifyElementUnmounted(element);
      expect(isElementMounted(element)).toBe(false);
    });

    it("executes onMount callbacks", () => {
      const callback = vi.fn();
      const element = document.createElement("div");

      registerElementHook(element, "mount", callback);
      notifyElementMounted(element);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("executes onUnmount callbacks", () => {
      const callback = vi.fn();
      const element = document.createElement("div");

      registerElementHook(element, "unmount", callback);
      notifyElementMounted(element);
      notifyElementUnmounted(element);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("only executes onMount once", () => {
      const callback = vi.fn();
      const element = document.createElement("div");

      registerElementHook(element, "mount", callback);
      notifyElementMounted(element);
      notifyElementMounted(element);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("only executes onUnmount if element was mounted", () => {
      const callback = vi.fn();
      const element = document.createElement("div");

      registerElementHook(element, "unmount", callback);
      notifyElementUnmounted(element);

      expect(callback).not.toHaveBeenCalled();
    });

    it("catches and logs errors in element hooks", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const element = document.createElement("div");

      registerElementHook(element, "mount", () => {
        throw new Error("Mount error");
      });

      notifyElementMounted(element);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Caused by:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe("binding lifecycle", () => {
    it("tracks mounted state for elements with bindings", () => {
      const root = document.createElement("div");
      root.dataset.voltText = "message";
      const message = signal("test");
      mount(root, { message });
      expect(isElementMounted(root)).toBe(true);
    });

    it("returns empty array for elements with no tracked bindings", () => {
      const element = document.createElement("div");
      expect(getElementBindings(element)).toEqual([]);
    });
  });

  describe("plugin lifecycle hooks", () => {
    it("plugin can register mount hooks", () => {
      const onMountSpy = vi.fn();
      const root = document.createElement("div");
      root.dataset.voltCustom = "value";

      registerPlugin("custom", (context: PluginContext) => {
        context.lifecycle.onMount(() => {
          onMountSpy();
        });
      });

      mount(root, {});

      expect(onMountSpy).toHaveBeenCalled();
    });

    it("plugin can register unmount hooks", () => {
      const onUnmountSpy = vi.fn();
      const root = document.createElement("div");
      root.dataset.voltCustom = "value";

      registerPlugin("custom", (context: PluginContext) => {
        context.lifecycle.onUnmount(() => {
          onUnmountSpy();
        });
      });

      const cleanup = mount(root, {});
      cleanup();

      expect(onUnmountSpy).toHaveBeenCalled();
    });

    it("plugin beforeBinding hooks execute before plugin handler", () => {
      const executionOrder: string[] = [];
      const root = document.createElement("div");
      root.dataset.voltCustom = "value";

      registerPlugin("custom", (context: PluginContext) => {
        context.lifecycle.beforeBinding(() => {
          executionOrder.push("beforeBinding");
        });
        executionOrder.push("handler");
      });

      mount(root, {});

      expect(executionOrder).toEqual(["beforeBinding", "handler"]);
    });

    it("plugin afterBinding hooks execute after plugin handler", async () => {
      const executionOrder: string[] = [];
      const root = document.createElement("div");
      root.dataset.voltCustom = "value";

      registerPlugin("custom", (context: PluginContext) => {
        executionOrder.push("handler");
        context.lifecycle.afterBinding(() => {
          executionOrder.push("afterBinding");
        });
      });

      mount(root, {});

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(executionOrder).toEqual(["handler", "afterBinding"]);
    });
  });

  describe("hook execution order", () => {
    it("executes hooks in correct order during mount", () => {
      const executionOrder: string[] = [];
      const root = document.createElement("div");
      root.innerHTML = "<div data-volt-text=\"message\"></div>";

      registerGlobalHook("beforeMount", () => {
        executionOrder.push("global:beforeMount");
      });

      registerGlobalHook("afterMount", () => {
        executionOrder.push("global:afterMount");
      });

      const message = signal("test");
      mount(root, { message });

      expect(executionOrder).toEqual(["global:beforeMount", "global:afterMount"]);
    });

    it("executes hooks in correct order during unmount", () => {
      const executionOrder: string[] = [];
      const root = document.createElement("div");

      registerGlobalHook("beforeUnmount", () => {
        executionOrder.push("global:beforeUnmount");
      });

      registerGlobalHook("afterUnmount", () => {
        executionOrder.push("global:afterUnmount");
      });

      const cleanup = mount(root, {});
      cleanup();

      expect(executionOrder).toEqual(["global:beforeUnmount", "global:afterUnmount"]);
    });

    it("executes mount and unmount in order", () => {
      const executionOrder: string[] = [];
      const root = document.createElement("div");

      registerGlobalHook("beforeMount", () => {
        executionOrder.push("beforeMount");
      });

      registerGlobalHook("afterMount", () => {
        executionOrder.push("afterMount");
      });

      registerGlobalHook("beforeUnmount", () => {
        executionOrder.push("beforeUnmount");
      });

      registerGlobalHook("afterUnmount", () => {
        executionOrder.push("afterUnmount");
      });

      const cleanup = mount(root, {});
      cleanup();

      expect(executionOrder).toEqual(["beforeMount", "afterMount", "beforeUnmount", "afterUnmount"]);
    });
  });
});
