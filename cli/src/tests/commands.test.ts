import { downloadCommand } from "$commands/download.js";
import { initCommand } from "$commands/init.js";
import * as downloadUtils from "$utils/download.js";
import * as filesUtils from "$utils/files.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock inquirer prompts
vi.mock("@inquirer/prompts", () => ({ input: vi.fn(), select: vi.fn() }));

describe("CLI commands", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "voltx-cmd-test-"));
    vi.spyOn(downloadUtils, "downloadFile").mockResolvedValue();
    vi.spyOn(filesUtils, "createFile").mockResolvedValue();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("downloadCommand", () => {
    it("should download JS and CSS by default", async () => {
      await downloadCommand({ output: tempDir });

      const downloadFileSpy = vi.mocked(downloadUtils.downloadFile);
      expect(downloadFileSpy).toHaveBeenCalledTimes(2);
      expect(downloadFileSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.js",
        expect.stringContaining("voltx.min.js"),
      );
      expect(downloadFileSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.css",
        expect.stringContaining("voltx.min.css"),
      );
    });

    it("should download only JS when css is disabled", async () => {
      await downloadCommand({ output: tempDir, css: false });

      const downloadFileSpy = vi.mocked(downloadUtils.downloadFile);
      expect(downloadFileSpy).toHaveBeenCalledTimes(1);
      expect(downloadFileSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.js",
        expect.stringContaining("voltx.min.js"),
      );
    });

    it("should download only CSS when js is disabled", async () => {
      await downloadCommand({ output: tempDir, js: false });

      const downloadFileSpy = vi.mocked(downloadUtils.downloadFile);
      expect(downloadFileSpy).toHaveBeenCalledTimes(1);
      expect(downloadFileSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.css",
        expect.stringContaining("voltx.min.css"),
      );
    });

    it("should download specific version when specified", async () => {
      await downloadCommand({ output: tempDir, version: "0.5.0" });

      const downloadFileSpy = vi.mocked(downloadUtils.downloadFile);
      expect(downloadFileSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/voltx.js@0.5.0/dist/voltx.min.js",
        expect.stringContaining("voltx.min.js"),
      );
      expect(downloadFileSpy).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/npm/voltx.js@0.5.0/dist/voltx.min.css",
        expect.stringContaining("voltx.min.css"),
      );
    });

    it("should handle download errors and exit with code 1", async () => {
      const downloadFileSpy = vi.spyOn(downloadUtils, "downloadFile").mockRejectedValue(new Error("Network error"));
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

      await downloadCommand({ output: tempDir });

      expect(downloadFileSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });
  });

  describe("initCommand", () => {
    it("should check for existing non-empty directory", async () => {
      const { input, select } = await import("@inquirer/prompts");
      vi.mocked(input).mockResolvedValue("test-project");
      vi.mocked(select).mockResolvedValue("minimal" as any);

      const isEmptyOrMissingSpy = vi.spyOn(filesUtils, "isEmptyOrMissing").mockResolvedValue(false);
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

      await initCommand();

      expect(isEmptyOrMissingSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });

    it("should create minimal template", async () => {
      const { select } = await import("@inquirer/prompts");
      vi.mocked(select).mockResolvedValue("minimal" as any);

      vi.spyOn(filesUtils, "isEmptyOrMissing").mockResolvedValue(true);

      await initCommand("minimal-app");

      expect(vi.mocked(filesUtils.createFile)).toHaveBeenCalled();
      expect(vi.mocked(downloadUtils.downloadFile)).toHaveBeenCalled();
    });

    it("should create styles template without JS", async () => {
      const { select } = await import("@inquirer/prompts");
      vi.mocked(select).mockResolvedValue("styles" as any);

      vi.spyOn(filesUtils, "isEmptyOrMissing").mockResolvedValue(true);

      await initCommand("styles-app");

      const downloadSpy = vi.mocked(downloadUtils.downloadFile);
      const calls = downloadSpy.mock.calls;
      expect(calls.some((call) => call[0].includes("voltx.min.css"))).toBe(true);
      expect(calls.some((call) => call[0].includes("voltx.min.js"))).toBe(false);
    });

    it("should create with-router template", async () => {
      const { select } = await import("@inquirer/prompts");
      vi.mocked(select).mockResolvedValue("with-router" as any);

      vi.spyOn(filesUtils, "isEmptyOrMissing").mockResolvedValue(true);

      await initCommand("router-app");

      expect(vi.mocked(filesUtils.createFile)).toHaveBeenCalled();
    });

    it("should create with-plugins template", async () => {
      const { select } = await import("@inquirer/prompts");
      vi.mocked(select).mockResolvedValue("with-plugins" as any);

      vi.spyOn(filesUtils, "isEmptyOrMissing").mockResolvedValue(true);

      await initCommand("plugins-app");

      expect(vi.mocked(filesUtils.createFile)).toHaveBeenCalled();
    });
  });
});
