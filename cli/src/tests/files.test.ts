import { createFile, isEmptyOrMissing } from "$utils/files.js";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("files utilities", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "voltx-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("createFile", () => {
    it("should create a file with content", async () => {
      const filePath = path.join(tempDir, "test.txt");
      const content = "Hello VoltX!";

      await createFile(filePath, content);

      const fileContent = await readFile(filePath, "utf8");
      expect(fileContent).toBe(content);
    });

    it("should create parent directories if they don't exist", async () => {
      const filePath = path.join(tempDir, "nested", "deep", "test.txt");
      const content = "Nested file";

      await createFile(filePath, content);

      const fileContent = await readFile(filePath, "utf8");
      expect(fileContent).toBe(content);
    });
  });

  describe("isEmptyOrMissing", () => {
    it("should return true for non-existent directory", async () => {
      const nonExistentDir = path.join(tempDir, "does-not-exist");
      const result = await isEmptyOrMissing(nonExistentDir);
      expect(result).toBe(true);
    });

    it("should return true for empty directory", async () => {
      const emptyDir = path.join(tempDir, "empty");
      await mkdir(emptyDir);

      const result = await isEmptyOrMissing(emptyDir);
      expect(result).toBe(true);
    });

    it("should return false for directory with files", async () => {
      const dirWithFiles = path.join(tempDir, "with-files");
      await mkdir(dirWithFiles);
      await createFile(path.join(dirWithFiles, "test.txt"), "content");

      const result = await isEmptyOrMissing(dirWithFiles);
      expect(result).toBe(false);
    });
  });
});
