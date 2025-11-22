import { echo } from "$utils/echo.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("echo utility", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("err", () => {
    it("should log to stderr", () => {
      echo.err("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String));
    });

    it("should accept additional parameters", () => {
      echo.err("Error:", "details", 123);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), "details", 123);
    });
  });

  describe("danger", () => {
    it("should log to stdout", () => {
      echo.danger("Danger message");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("ok", () => {
    it("should log success message", () => {
      echo.ok("Success message");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("success", () => {
    it("should log bold success message", () => {
      echo.success("Success!");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("info", () => {
    it("should log info message", () => {
      echo.info("Info message");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("label", () => {
    it("should log label message", () => {
      echo.label("Label");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("title", () => {
    it("should log bold title", () => {
      echo.title("Title");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("warn", () => {
    it("should log warning", () => {
      echo.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("text", () => {
    it("should be a reference to console.log", () => {
      expect(typeof echo.text).toBe("function");
    });
  });
});
