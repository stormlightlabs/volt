import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findMonorepoRoot,
  getDocsPath,
  getExamplesPath,
  getLibPath,
  getLibSrcPath,
  getLibTestPath,
} from "../src/utils/paths.js";

describe("path utilities", () => {
  it("should find monorepo root from cli directory", async () => {
    const root = await findMonorepoRoot(process.cwd());

    expect(root).toBeTruthy();
    expect(existsSync(join(root, "pnpm-workspace.yaml"))).toBe(true);
  });

  it("should find lib package path", async () => {
    const libPath = await getLibPath();

    expect(libPath).toBeTruthy();
    expect(libPath).toContain("lib");
    expect(existsSync(join(libPath, "package.json"))).toBe(true);
  });

  it("should find lib src path", async () => {
    const srcPath = await getLibSrcPath();

    expect(srcPath).toBeTruthy();
    expect(srcPath).toContain("lib");
    expect(srcPath).toContain("src");
    expect(existsSync(srcPath)).toBe(true);
  });

  it("should find lib test path", async () => {
    const testPath = await getLibTestPath();

    expect(testPath).toBeTruthy();
    expect(testPath).toContain("lib");
    expect(testPath).toContain("test");
    expect(existsSync(testPath)).toBe(true);
  });

  it("should find docs package path", async () => {
    const docsPath = await getDocsPath();

    expect(docsPath).toBeTruthy();
    expect(docsPath).toContain("docs");
    expect(existsSync(join(docsPath, "package.json"))).toBe(true);
  });

  it("should find examples directory path", async () => {
    const examplesPath = await getExamplesPath();

    expect(examplesPath).toBeTruthy();
    expect(examplesPath).toContain("examples");
    expect(existsSync(examplesPath)).toBe(true);
  });

  it("should return consistent paths when called multiple times", async () => {
    const root1 = await findMonorepoRoot();
    const root2 = await findMonorepoRoot();

    expect(root1).toBe(root2);

    const libPath1 = await getLibPath();
    const libPath2 = await getLibPath();

    expect(libPath1).toBe(libPath2);
  });

  it("should handle being called from monorepo root", async () => {
    const root = await findMonorepoRoot();
    const rootFromRoot = await findMonorepoRoot(root);

    expect(root).toBe(rootFromRoot);
  });
});
