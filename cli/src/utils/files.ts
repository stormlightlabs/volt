import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Create a file with the given content at the specified path.
 *
 * Creates parent directories if they don't exist.
 */
export async function createFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, "utf8");
}

/**
 * Check if a directory is empty or doesn't exist.
 */
export async function isEmptyOrMissing(dirPath: string): Promise<boolean> {
  const { existsSync } = await import("node:fs");
  const { readdir } = await import("node:fs/promises");

  if (!existsSync(dirPath)) {
    return true;
  }

  const files = await readdir(dirPath);
  return files.length === 0;
}
