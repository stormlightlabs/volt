import { mount } from "$core/binder";
import { clearPlugins, registerPlugin } from "$core/plugin";
import { signal } from "$core/signal";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("plugin integration with binder", () => {
  beforeEach(() => {
    clearPlugins();
  });

  it("calls registered plugin when binding attribute", () => {
    const pluginHandler = vi.fn();
    registerPlugin("custom", pluginHandler);

    const element = document.createElement("div");
    element.dataset.voltCustom = "testValue";

    const scope = { test: "value" };
    mount(element, scope);

    expect(pluginHandler).toHaveBeenCalledOnce();
    expect(pluginHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        element,
        scope,
        addCleanup: expect.any(Function),
        findSignal: expect.any(Function),
        evaluate: expect.any(Function),
      }),
      "testValue",
    );
  });

  it("warns when unknown binding is used without plugin", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = document.createElement("div");
    element.dataset.voltUnknown = "value";

    mount(element, {});
    expect(consoleWarnSpy).toHaveBeenCalledWith("Unknown binding: data-volt-unknown");
    consoleWarnSpy.mockRestore();
  });

  it("provides working findSignal utility to plugin", () => {
    let foundSignal: unknown;
    registerPlugin("finder", (context) => {
      foundSignal = context.findSignal("count");
    });

    const element = document.createElement("div");
    element.dataset.voltFinder = "test";

    const count = signal(42);
    mount(element, { count });

    expect(foundSignal).toBe(count);
  });

  it("provides working evaluate utility to plugin", () => {
    let evaluatedValue: unknown;
    registerPlugin("evaluator", (context, value) => {
      evaluatedValue = context.evaluate(value);
    });

    const element = document.createElement("div");
    element.dataset.voltEvaluator = "count";

    const count = signal(100);
    mount(element, { count });

    expect(evaluatedValue).toBe(100);
  });

  it("registers and calls cleanup functions", () => {
    const cleanup = vi.fn();
    registerPlugin("cleaner", (context) => {
      context.addCleanup(cleanup);
    });

    const element = document.createElement("div");
    element.dataset.voltCleaner = "test";

    const unmount = mount(element, {});

    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("handles multiple plugins on same element", () => {
    const plugin1 = vi.fn();
    const plugin2 = vi.fn();

    registerPlugin("plugin1", plugin1);
    registerPlugin("plugin2", plugin2);

    const element = document.createElement("div");
    element.dataset.voltPlugin1 = "value1";
    element.dataset.voltPlugin2 = "value2";

    mount(element, {});

    expect(plugin1).toHaveBeenCalledWith(expect.anything(), "value1");
    expect(plugin2).toHaveBeenCalledWith(expect.anything(), "value2");
  });

  it("allows plugins to work alongside core bindings", () => {
    const pluginHandler = vi.fn();
    registerPlugin("custom", pluginHandler);

    const element = document.createElement("div");
    element.dataset.voltText = "message";
    element.dataset.voltCustom = "customValue";

    const scope = { message: "Hello" };
    mount(element, scope);

    expect(element.textContent).toBe("Hello");
    expect(pluginHandler).toHaveBeenCalledWith(expect.anything(), "customValue");
  });

  it("handles plugin errors gracefully", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const badPlugin = vi.fn(() => {
      throw new Error("Plugin error");
    });

    registerPlugin("bad", badPlugin);

    const element = document.createElement("div");
    element.dataset.voltBad = "value";

    mount(element, {});
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("supports reactive updates from plugins", () => {
    registerPlugin("reactive", (context, value) => {
      const sig = context.findSignal(value);
      if (sig) {
        const update = () => {
          (context.element as HTMLElement).dataset.testValue = String(sig.get());
        };
        update();
        const unsubscribe = sig.subscribe(update);
        context.addCleanup(unsubscribe);
      }
    });

    const element = document.createElement("div");
    element.dataset.voltReactive = "count";

    const count = signal(1);
    mount(element, { count });

    expect(element.dataset.testValue).toBe("1");

    count.set(5);
    expect(element.dataset.testValue).toBe("5");

    count.set(10);
    expect(element.dataset.testValue).toBe("10");
  });
});
