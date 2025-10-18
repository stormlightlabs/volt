import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Find the monorepo root by walking up the directory tree.
 *
 * Looks for pnpm-workspace.yaml with valid workspace packages or a package.json with workspaces defined.
 */
export async function findMonorepoRoot(startDir: string = process.cwd()): Promise<string> {
  let currentDir = startDir;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const workspaceYaml = path.join(currentDir, "pnpm-workspace.yaml");
    const packageJson = path.join(currentDir, "package.json");

    if (existsSync(workspaceYaml)) {
      const hasLibPackage = existsSync(path.join(currentDir, "lib", "package.json"));
      const hasCliPackage = existsSync(path.join(currentDir, "cli", "package.json"));

      if (hasLibPackage || hasCliPackage) {
        return currentDir;
      }
    }

    if (existsSync(packageJson)) {
      try {
        const pkgContent = JSON.parse(await readFile(packageJson, "utf8"));
        if (pkgContent.workspaces || pkgContent.private) {
          const hasLibPackage = existsSync(path.join(currentDir, "lib", "package.json"));
          const hasCliPackage = existsSync(path.join(currentDir, "cli", "package.json"));

          if (hasLibPackage || hasCliPackage) {
            return currentDir;
          }
        }
      } catch {
        // No-Op: Continue searching
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error("Could not find monorepo root. Make sure you're in the Volt project directory.");
    }

    currentDir = parentDir;
    depth++;
  }

  throw new Error("Could not find monorepo root. Make sure you're in the Volt project directory.");
}

/**
 * Get the path to the lib package directory
 */
export async function getLibPath(startDir?: string): Promise<string> {
  const root = await findMonorepoRoot(startDir);
  return path.join(root, "lib");
}

/**
 * Get the path to the docs package directory
 */
export async function getDocsPath(startDir?: string): Promise<string> {
  const root = await findMonorepoRoot(startDir);
  return path.join(root, "docs");
}

/**
 * Get the path to the examples directory
 */
export async function getExamplesPath(startDir?: string): Promise<string> {
  const root = await findMonorepoRoot(startDir);
  return path.join(root, "examples");
}

/**
 * Get the path to the lib source directory
 */
export async function getLibSrcPath(startDir?: string): Promise<string> {
  const libPath = await getLibPath(startDir);
  return path.join(libPath, "src");
}

/**
 * Get the path to the lib test directory
 */
export async function getLibTestPath(startDir?: string): Promise<string> {
  const libPath = await getLibPath(startDir);
  return path.join(libPath, "test");
}
