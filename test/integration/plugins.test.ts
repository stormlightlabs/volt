import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "../../src/core/binder";
import { clearPlugins, registerPlugin } from "../../src/core/plugin";
import { signal } from "../../src/core/signal";

describe("plugin integration with binder", () => {
  beforeEach(() => {
    clearPlugins();
  });

  it("calls registered plugin when binding attribute", () => {
    const pluginHandler = vi.fn();
    registerPlugin("custom", pluginHandler);

    const element = document.createElement("div");
    element.dataset.xCustom = "testValue";

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
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = document.createElement("div");
    element.dataset.xUnknown = "value";

    mount(element, {});

    expect(warnSpy).toHaveBeenCalledWith("Unknown binding: data-x-unknown");

    warnSpy.mockRestore();
  });

  it("provides working findSignal utility to plugin", () => {
    let foundSignal: unknown;
    registerPlugin("finder", (context) => {
      foundSignal = context.findSignal("count");
    });

    const element = document.createElement("div");
    element.dataset.xFinder = "test";

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
    element.dataset.xEvaluator = "count";

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
    element.dataset.xCleaner = "test";

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
    element.dataset.xPlugin1 = "value1";
    element.dataset.xPlugin2 = "value2";

    mount(element, {});

    expect(plugin1).toHaveBeenCalledWith(expect.anything(), "value1");
    expect(plugin2).toHaveBeenCalledWith(expect.anything(), "value2");
  });

  it("allows plugins to work alongside core bindings", () => {
    const pluginHandler = vi.fn();
    registerPlugin("custom", pluginHandler);

    const element = document.createElement("div");
    element.dataset.xText = "message";
    element.dataset.xCustom = "customValue";

    const scope = { message: "Hello" };
    mount(element, scope);

    expect(element.textContent).toBe("Hello");
    expect(pluginHandler).toHaveBeenCalledWith(expect.anything(), "customValue");
  });

  it("handles plugin errors gracefully", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const badPlugin = vi.fn(() => {
      throw new Error("Plugin error");
    });

    registerPlugin("bad", badPlugin);

    const element = document.createElement("div");
    element.dataset.xBad = "value";

    mount(element, {});

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Error in plugin \"bad\""), expect.any(Error));

    errorSpy.mockRestore();
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
    element.dataset.xReactive = "count";

    const count = signal(1);
    mount(element, { count });

    expect(element.dataset.testValue).toBe("1");

    count.set(5);
    expect(element.dataset.testValue).toBe("5");

    count.set(10);
    expect(element.dataset.testValue).toBe("10");
  });
});
