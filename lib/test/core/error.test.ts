import {
  clearErrorHandlers,
  clearErrorOverlay,
  enableDevMode,
  getErrorHandlerCount,
  getErrorStack,
  getOverlayContainer,
  isDevMode,
  onError,
  report,
  VoltError,
} from "$core/error";
import type { ErrorContext, ErrorSource } from "$types/volt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("VoltError", () => {
  it("creates error with basic context", () => {
    const cause = new Error("Test error");
    const context: ErrorContext = { source: "binding" };

    const voltError = new VoltError(cause, context);

    expect(voltError).toBeInstanceOf(Error);
    expect(voltError).toBeInstanceOf(VoltError);
    expect(voltError.name).toBe("VoltError");
    expect(voltError.source).toBe("binding");
    expect(voltError.cause).toBe(cause);
    expect(voltError.stopped).toBe(false);
  });

  it("includes directive and expression in context", () => {
    const cause = new Error("Evaluation failed");
    const context: ErrorContext = { source: "evaluator", directive: "data-volt-text", expression: "count * 2" };

    const voltError = new VoltError(cause, context);

    expect(voltError.directive).toBe("data-volt-text");
    expect(voltError.expression).toBe("count * 2");
    expect(voltError.message).toContain("[evaluator]");
    expect(voltError.message).toContain("Directive: data-volt-text");
    expect(voltError.message).toContain("Expression: count * 2");
  });

  it("includes element information in message", () => {
    const div = document.createElement("div");
    div.id = "test";
    div.className = "foo bar";

    const cause = new Error("DOM error");
    const context: ErrorContext = { source: "binding", element: div };

    const voltError = new VoltError(cause, context);

    expect(voltError.element).toBe(div);
    expect(voltError.message).toContain("Element: <div#test.foo.bar>");
  });

  it("includes HTTP context in message", () => {
    const cause = new Error("Request failed");
    const context: ErrorContext = { source: "http", httpMethod: "POST", httpUrl: "/api/users", httpStatus: 500 };

    const voltError = new VoltError(cause, context);

    expect(voltError.message).toContain("HTTP: POST /api/users");
    expect(voltError.message).toContain("Status: 500");
  });

  it("includes plugin name in message", () => {
    const cause = new Error("Plugin failed");
    const context: ErrorContext = { source: "plugin", pluginName: "persist" };

    const voltError = new VoltError(cause, context);

    expect(voltError.message).toContain("Plugin: persist");
  });

  it("includes lifecycle hook name in message", () => {
    const cause = new Error("Hook failed");
    const context: ErrorContext = { source: "lifecycle", hookName: "onMount" };

    const voltError = new VoltError(cause, context);

    expect(voltError.message).toContain("Hook: onMount");
  });

  it("stopPropagation prevents handler chain", () => {
    const cause = new Error("Test");
    const context: ErrorContext = { source: "binding" };

    const voltError = new VoltError(cause, context);

    expect(voltError.stopped).toBe(false);
    voltError.stopPropagation();
    expect(voltError.stopped).toBe(true);
  });

  it("serializes to JSON", () => {
    const cause = new Error("Test error");
    const context: ErrorContext = { source: "effect", directive: "data-volt-on-click", expression: "count++" };

    const voltError = new VoltError(cause, context);
    const json = voltError.toJSON();

    expect(json.name).toBe("VoltError");
    expect(json.source).toBe("effect");
    expect(json.directive).toBe("data-volt-on-click");
    expect(json.expression).toBe("count++");
    expect(json.cause).toEqual({ name: "Error", message: "Test error", stack: cause.stack });
  });

  it("truncates long expressions in message", () => {
    const longExpr = "a".repeat(150);
    const cause = new Error("Test");
    const context: ErrorContext = { source: "evaluator", expression: longExpr };

    const voltError = new VoltError(cause, context);

    expect(voltError.message).toContain("Expression: " + "a".repeat(100) + "...");
    expect(voltError.message).not.toContain("a".repeat(101));
  });
});

describe("Error Handler Registration", () => {
  beforeEach(() => {
    clearErrorHandlers();
  });

  afterEach(() => {
    clearErrorHandlers();
  });

  it("registers error handler", () => {
    expect(getErrorHandlerCount()).toBe(0);

    const handler = vi.fn();
    onError(handler);

    expect(getErrorHandlerCount()).toBe(1);
  });

  it("returns cleanup function", () => {
    const handler = vi.fn();
    const cleanup = onError(handler);

    expect(getErrorHandlerCount()).toBe(1);

    cleanup();

    expect(getErrorHandlerCount()).toBe(0);
  });

  it("registers multiple handlers", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    onError(handler1);
    onError(handler2);

    expect(getErrorHandlerCount()).toBe(2);
  });

  it("clears all handlers", () => {
    onError(vi.fn());
    onError(vi.fn());
    onError(vi.fn());

    expect(getErrorHandlerCount()).toBe(3);

    clearErrorHandlers();

    expect(getErrorHandlerCount()).toBe(0);
  });
});

describe("Error Reporting", () => {
  beforeEach(() => {
    clearErrorHandlers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  afterEach(() => {
    clearErrorHandlers();
    vi.restoreAllMocks();
  });

  it("calls registered handler with VoltError", () => {
    const handler = vi.fn();
    onError(handler);

    const error = new Error("Test");
    const context: ErrorContext = { source: "binding" };

    report(error, context);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(VoltError));

    const voltError = handler.mock.calls[0][0];
    expect(voltError.cause).toBe(error);
    expect(voltError.source).toBe("binding");
  });

  it("calls multiple handlers in order", () => {
    const callOrder: number[] = [];

    const handler1 = vi.fn(() => callOrder.push(1));
    const handler2 = vi.fn(() => callOrder.push(2));
    const handler3 = vi.fn(() => callOrder.push(3));

    onError(handler1);
    onError(handler2);
    onError(handler3);

    report(new Error("Test"), { source: "effect" });

    expect(callOrder).toEqual([1, 2, 3]);
  });

  it("stops propagation when stopPropagation is called", () => {
    const handler1 = vi.fn((error: VoltError) => {
      error.stopPropagation();
    });
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    onError(handler1);
    onError(handler2);
    onError(handler3);

    report(new Error("Test"), { source: "effect" });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
    expect(handler3).not.toHaveBeenCalled();
  });

  it("falls back to console.error when no handlers registered", () => {
    const error = new Error("Test error");
    const context: ErrorContext = { source: "http", httpMethod: "GET", httpUrl: "/api/data" };

    report(error, context);

    expect(console.error).toHaveBeenCalled();
    expect(console.group).toHaveBeenCalledWith("Error Details");
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it("converts non-Error values to Error", () => {
    const handler = vi.fn();
    onError(handler);

    report("string error", { source: "user" });

    expect(handler).toHaveBeenCalledTimes(1);
    const voltError: VoltError = handler.mock.calls[0][0];
    expect(voltError.cause).toBeInstanceOf(Error);
    expect(voltError.cause.message).toBe("string error");
  });

  it("catches errors in error handlers", () => {
    const handler1 = vi.fn(() => {
      throw new Error("Handler error");
    });
    const handler2 = vi.fn();

    onError(handler1);
    onError(handler2);

    report(new Error("Test"), { source: "effect" });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("Error in error handler:", expect.any(Error));
  });

  it("includes element in console fallback", () => {
    const div = document.createElement("div");
    div.id = "test-element";

    report(new Error("Test"), { source: "binding", element: div });

    expect(console.log).toHaveBeenCalledWith("%cElement Path:", "font-weight: bold", "div#test-element");
    expect(console.log).toHaveBeenCalledWith("%cElement:", "font-weight: bold", div);
  });

  it("handles all error sources", () => {
    const handler = vi.fn();
    onError(handler);

    const sources: Array<ErrorSource> = [
      "evaluator",
      "binding",
      "effect",
      "http",
      "plugin",
      "lifecycle",
      "charge",
      "user",
    ];

    for (const source of sources) {
      report(new Error(`Test ${source}`), { source });
    }

    expect(handler).toHaveBeenCalledTimes(sources.length);

    for (const [i, source] of sources.entries()) {
      const voltError: VoltError = handler.mock.calls[i][0];
      expect(voltError.source).toBe(source);
    }
  });
});

describe("Error Levels", () => {
  beforeEach(() => {
    clearErrorHandlers();
  });

  afterEach(() => {
    clearErrorHandlers();
  });

  it("defaults to error level when not specified", () => {
    const handler = vi.fn();
    onError(handler);

    report(new Error("Test"), { source: "binding" });

    const voltError: VoltError = handler.mock.calls[0][0];
    expect(voltError.level).toBe("error");
  });

  it("supports warn level", () => {
    const handler = vi.fn();
    onError(handler);

    const context: ErrorContext = { source: "binding", level: "warn" };
    report(new Error("Warning"), context);

    const voltError: VoltError = handler.mock.calls[0][0];
    expect(voltError.level).toBe("warn");
  });

  it("supports error level", () => {
    const handler = vi.fn();
    onError(handler);

    const context: ErrorContext = { source: "binding", level: "error" };
    report(new Error("Error"), context);

    const voltError: VoltError = handler.mock.calls[0][0];
    expect(voltError.level).toBe("error");
  });

  it("supports fatal level", () => {
    const handler = vi.fn();
    onError(handler);

    const context: ErrorContext = { source: "binding", level: "fatal" };
    report(new Error("Fatal"), context);

    const voltError: VoltError = handler.mock.calls[0][0];
    expect(voltError.level).toBe("fatal");
  });

  it("includes level in JSON serialization", () => {
    const handler = vi.fn();
    onError(handler);

    report(new Error("Test"), { source: "binding", level: "warn" });

    const voltError: VoltError = handler.mock.calls[0][0];
    const json = voltError.toJSON();

    expect(json.level).toBe("warn");
  });
});

describe("Element Path", () => {
  it("returns empty string when no element", () => {
    const cause = new Error("Test");
    const context: ErrorContext = { source: "binding" };
    const voltError = new VoltError(cause, context);

    expect(voltError.getElementPath()).toBe("");
  });

  it("generates path for single element", () => {
    const div = document.createElement("div");
    div.id = "test";

    const cause = new Error("Test");
    const context: ErrorContext = { source: "binding", element: div, directive: "data-volt-text" };
    const voltError = new VoltError(cause, context);

    expect(voltError.getElementPath()).toBe("div#test[data-volt-text]");
  });

  it("generates path for nested elements", () => {
    const parent = document.createElement("div");
    parent.id = "parent";
    document.body.append(parent);

    const child = document.createElement("span");
    child.className = "foo bar";
    parent.append(child);

    const cause = new Error("Test");
    const context: ErrorContext = { source: "binding", element: child, directive: "data-volt-on-click" };
    const voltError = new VoltError(cause, context);

    expect(voltError.getElementPath()).toBe("div#parent > span.foo.bar[data-volt-on-click]");

    parent.remove();
  });

  it("handles elements without id or class", () => {
    const button = document.createElement("button");

    const cause = new Error("Test");
    const context: ErrorContext = { source: "binding", element: button };
    const voltError = new VoltError(cause, context);

    expect(voltError.getElementPath()).toBe("button");
  });
});

describe("Development Mode", () => {
  beforeEach(() => {
    enableDevMode(false);
    clearErrorHandlers();
  });

  afterEach(() => {
    enableDevMode(false);
    clearErrorHandlers();
    clearErrorOverlay();
  });

  it("is disabled by default", () => {
    expect(isDevMode()).toBe(false);
  });

  it("can be enabled", () => {
    enableDevMode(true);
    expect(isDevMode()).toBe(true);
  });

  it("can be disabled", () => {
    enableDevMode(true);
    expect(isDevMode()).toBe(true);

    enableDevMode(false);
    expect(isDevMode()).toBe(false);
  });

  it("defaults to true when called without argument", () => {
    enableDevMode();
    expect(isDevMode()).toBe(true);
  });
});

describe("Visual Error Overlay", () => {
  beforeEach(() => {
    enableDevMode(false);
    clearErrorHandlers();
    clearErrorOverlay();
    for (const el of document.querySelectorAll("[data-volt-error-overlay]")) el.remove();
    if (!document.body) {
      document.body = document.createElement("body");
    }
  });

  afterEach(() => {
    enableDevMode(false);
    clearErrorHandlers();
    clearErrorOverlay();
    for (const el of document.querySelectorAll("[data-volt-error-overlay]")) el.remove();
  });

  it("does not create overlay when dev mode is disabled", () => {
    enableDevMode(false);
    const handler = vi.fn();
    onError(handler);

    report(new Error("Test"), { source: "binding" });

    const overlay = document.querySelector("[data-volt-error-overlay]");
    expect(overlay).toBeNull();
  });

  it("creates overlay when dev mode is enabled", () => {
    enableDevMode(true);
    const handler = vi.fn();
    onError(handler);

    report(new Error("Test"), { source: "binding" });

    const overlay = document.querySelector("[data-volt-error-overlay]");
    expect(overlay).toBeTruthy();
  });

  it("displays error information in overlay", () => {
    enableDevMode(true);
    const handler = vi.fn();
    onError(handler);

    report(new Error("Test error message"), { source: "binding", level: "error" });

    const overlay = getOverlayContainer();
    expect(overlay).toBeTruthy();
    expect(overlay!.textContent).toContain("Test error message");
    expect(overlay!.textContent).toContain("ERROR");
    expect(overlay!.textContent).toContain("binding");
  });

  it("displays multiple errors", () => {
    enableDevMode(true);
    const handler = vi.fn();
    onError(handler);

    report(new Error("First error"), { source: "binding" });
    report(new Error("Second error"), { source: "evaluator" });

    const errorStack = getErrorStack();
    expect(errorStack).toHaveLength(2);
    expect(errorStack[0].cause.message).toBe("First error");
    expect(errorStack[1].cause.message).toBe("Second error");
  });

  it("limits displayed errors to max count", () => {
    enableDevMode(true);
    const handler = vi.fn();
    onError(handler);

    for (let i = 0; i < 10; i++) {
      report(new Error(`Error ${i}`), { source: "binding" });
    }

    const errorStack = getErrorStack();
    expect(errorStack).toHaveLength(5);
  });

  it("can clear all errors", () => {
    enableDevMode(true);
    const handler = vi.fn();
    onError(handler);

    report(new Error("Test"), { source: "binding" });

    let errorStack = getErrorStack();
    expect(errorStack).toHaveLength(1);

    clearErrorOverlay();

    errorStack = getErrorStack();
    expect(errorStack).toHaveLength(0);
  });

  it("shows different error levels in overlay", () => {
    enableDevMode(true);
    const handler = vi.fn();
    onError(handler);

    report(new Error("Warning"), { source: "binding", level: "warn" });
    report(new Error("Error"), { source: "binding", level: "error" });
    report(new Error("Fatal"), { source: "binding", level: "fatal" });

    const errorStack = getErrorStack();
    expect(errorStack).toHaveLength(3);
    expect(errorStack[0].level).toBe("warn");
    expect(errorStack[1].level).toBe("error");
    expect(errorStack[2].level).toBe("fatal");
  });
});

describe("Enhanced Console Logging", () => {
  beforeEach(() => {
    clearErrorHandlers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  afterEach(() => {
    clearErrorHandlers();
    vi.restoreAllMocks();
  });

  it("uses console.warn for warn level", () => {
    report(new Error("Warning"), { source: "binding", level: "warn" });

    expect(console.warn).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("uses console.error for error level", () => {
    report(new Error("Error"), { source: "binding", level: "error" });

    expect(console.error).toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("uses console.error for fatal level", () => {
    report(new Error("Fatal"), { source: "binding", level: "fatal" });

    expect(console.error).toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("uses console groups for details", () => {
    report(new Error("Test"), { source: "binding" });

    expect(console.group).toHaveBeenCalledWith("Error Details");
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it("logs directive when present", () => {
    report(new Error("Test"), { source: "binding", directive: "data-volt-text" });

    expect(console.log).toHaveBeenCalledWith("%cDirective:", "font-weight: bold", "data-volt-text");
  });

  it("logs expression when present", () => {
    report(new Error("Test"), { source: "evaluator", expression: "count * 2" });

    expect(console.log).toHaveBeenCalledWith("%cExpression:", "font-weight: bold", "count * 2");
  });

  it("logs element path when present", () => {
    const div = document.createElement("div");
    div.id = "test";

    report(new Error("Test"), { source: "binding", element: div });

    expect(console.log).toHaveBeenCalledWith("%cElement Path:", "font-weight: bold", "div#test");
  });
});
