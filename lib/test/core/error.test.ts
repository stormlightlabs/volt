import {
  BindingError,
  ChargeError,
  clearErrorHandlers,
  EffectError,
  EvaluatorError,
  getErrorHandlerCount,
  HttpError,
  LifecycleError,
  onError,
  PluginError,
  report,
  UserError,
  VoltError,
} from "$core/error";
import type { ErrorContext, ErrorLevel, ErrorSource } from "$types/volt";
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

  it("creates correct error types based on source", () => {
    const handler = vi.fn();
    onError(handler);

    const testCases: Array<{ source: ErrorSource; errorType: typeof VoltError; name: string }> = [
      { source: "evaluator", errorType: EvaluatorError, name: "EvaluatorError" },
      { source: "binding", errorType: BindingError, name: "BindingError" },
      { source: "effect", errorType: EffectError, name: "EffectError" },
      { source: "http", errorType: HttpError, name: "HttpError" },
      { source: "plugin", errorType: PluginError, name: "PluginError" },
      { source: "lifecycle", errorType: LifecycleError, name: "LifecycleError" },
      { source: "charge", errorType: ChargeError, name: "ChargeError" },
      { source: "user", errorType: UserError, name: "UserError" },
    ];

    for (const { source } of testCases) {
      report(new Error(`Test ${source}`), { source });
    }

    expect(handler).toHaveBeenCalledTimes(testCases.length);

    for (const [i, { errorType, name }] of testCases.entries()) {
      const voltError = handler.mock.calls[i][0];
      expect(voltError).toBeInstanceOf(errorType);
      expect(voltError).toBeInstanceOf(VoltError);
      expect(voltError.name).toBe(name);
    }
  });
});

describe("Error Levels", () => {
  beforeEach(() => {
    clearErrorHandlers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    clearErrorHandlers();
    vi.restoreAllMocks();
  });

  it("defaults to error level when not specified", () => {
    const cause = new Error("Test error");
    const context: ErrorContext = { source: "binding" };

    const voltError = new VoltError(cause, context);

    expect(voltError.level).toBe("error");
  });

  it("includes error level in VoltError", () => {
    const levels: Array<ErrorLevel> = ["warn", "error", "fatal"];

    for (const level of levels) {
      const cause = new Error(`Test ${level}`);
      const context: ErrorContext = { source: "binding", level };

      const voltError = new VoltError(cause, context);

      expect(voltError.level).toBe(level);
    }
  });

  it("includes error level in message", () => {
    const levels: Array<ErrorLevel> = ["warn", "error", "fatal"];

    for (const level of levels) {
      const cause = new Error(`Test ${level}`);
      const context: ErrorContext = { source: "binding", level };

      const voltError = new VoltError(cause, context);

      expect(voltError.message).toContain(`[${level.toUpperCase()}]`);
    }
  });

  it("includes error level in JSON serialization", () => {
    const cause = new Error("Test error");
    const context: ErrorContext = { source: "binding", level: "warn" };

    const voltError = new VoltError(cause, context);
    const json = voltError.toJSON();

    expect(json.level).toBe("warn");
  });

  it("uses console.warn for warn level without handlers", () => {
    const error = new Error("Warning message");
    const context: ErrorContext = { source: "binding", level: "warn" };

    report(error, context);

    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("[WARN]"));
    expect(console.warn).toHaveBeenCalledWith("Caused by:", error);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("uses console.error for error level without handlers", () => {
    const error = new Error("Error message");
    const context: ErrorContext = { source: "binding", level: "error" };

    report(error, context);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"));
    expect(console.error).toHaveBeenCalledWith("Caused by:", error);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("uses console.error for fatal level without handlers", () => {
    const error = new Error("Fatal error");
    const context: ErrorContext = { source: "charge", level: "fatal" };

    expect(() => report(error, context)).toThrow(VoltError);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[FATAL]"));
    expect(console.error).toHaveBeenCalledWith("Caused by:", error);
  });

  it("throws error for fatal level after handlers", () => {
    const handler = vi.fn();
    onError(handler);

    const error = new Error("Fatal error");
    const context: ErrorContext = { source: "charge", level: "fatal" };

    expect(() => report(error, context)).toThrow(VoltError);

    expect(handler).toHaveBeenCalledTimes(1);
    const voltError = handler.mock.calls[0][0];
    expect(voltError.level).toBe("fatal");
  });

  it("does not throw for warn level", () => {
    const error = new Error("Warning");
    const context: ErrorContext = { source: "http", level: "warn" };

    expect(() => report(error, context)).not.toThrow();
  });

  it("does not throw for error level", () => {
    const error = new Error("Error");
    const context: ErrorContext = { source: "binding", level: "error" };

    expect(() => report(error, context)).not.toThrow();
  });

  it("passes error level to handlers", () => {
    const handler = vi.fn();
    onError(handler);

    const levels: Array<ErrorLevel> = ["warn", "error", "fatal"];

    for (const level of levels) {
      try {
        report(new Error(`Test ${level}`), { source: "binding", level });
      } catch { /* No-op */ }
    }

    expect(handler).toHaveBeenCalledTimes(3);

    for (const [i, level] of levels.entries()) {
      const voltError: VoltError = handler.mock.calls[i][0];
      expect(voltError.level).toBe(level);
    }
  });
});
