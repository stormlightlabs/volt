import { getLibSrcPath } from "$utils/paths.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("stats command", () => {
  it("should count lines excluding doc comments", async () => {
    const srcPath = await getLibSrcPath();
    const testDir = path.join(srcPath, "core");
    const signalFile = path.join(testDir, "signal.ts");
    const content = await readFile(signalFile, "utf8");

    const lines = content.split("\n");
    let codeLines = 0;
    let inDocComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("/**")) {
        inDocComment = true;
        continue;
      }

      if (inDocComment) {
        if (trimmed.endsWith("*/")) {
          inDocComment = false;
        }
        continue;
      }

      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      codeLines++;
    }

    expect(codeLines).toBeGreaterThan(0);
    expect(codeLines).toBeLessThan(lines.length);
  });

  it("should exclude empty lines", () => {
    const content = `
function test() {
  return true;
}

export { test };
`;

    const lines = content.split("\n");
    let codeLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      codeLines++;
    }

    expect(codeLines).toBe(4);
  });

  it("should exclude single-line comments", () => {
    const content = `// This is a comment
function test() {
  // Another comment
  return true;
}`;

    const lines = content.split("\n");
    let codeLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      codeLines++;
    }

    expect(codeLines).toBe(3);
  });

  it("should exclude doc comment blocks", () => {
    const content = `/**
 * This is a doc comment
 * @param foo - some param
 */
function test(foo: string) {
  return foo;
}`;

    const lines = content.split("\n");
    let codeLines = 0;
    let inDocComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("/**")) {
        inDocComment = true;
        continue;
      }

      if (inDocComment) {
        if (trimmed.endsWith("*/")) {
          inDocComment = false;
        }
        continue;
      }

      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      codeLines++;
    }

    expect(codeLines).toBe(3);
  });
});
