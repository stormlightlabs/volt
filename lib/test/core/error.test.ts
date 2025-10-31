import { clearErrorHandlers, getErrorHandlerCount, onError, report, VoltError } from "$core/error";
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

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[http]"));
    expect(console.error).toHaveBeenCalledWith("Caused by:", error);
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

    expect(console.error).toHaveBeenCalledWith("Element:", div);
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
