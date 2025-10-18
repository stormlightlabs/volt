import chalk from "chalk";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type FileStats = { path: string; lines: number; totalLines: number };
type DirectoryStats = { totalLines: number; codeLines: number; files: FileStats[] };
type Lines = { lines: number; totalLines: number };

/**
 * Count lines of code in a file, excluding doc comments
 */
async function countLines(filePath: string): Promise<Lines> {
  const content = await readFile(filePath, "utf8");
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

  return { lines: codeLines, totalLines: lines.length };
}

/**
 * Recursively walk a directory and collect TypeScript files
 */
async function walkDirectory(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      if (entry !== "node_modules" && entry !== "dist" && entry !== ".git") {
        await walkDirectory(fullPath, files);
      }
    } else if (stats.isFile() && entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Collect stats for a directory
 */
async function collectStats(directory: string, baseDir: string): Promise<DirectoryStats> {
  const files = await walkDirectory(directory);
  const fileStats: FileStats[] = [];
  let totalLines = 0;
  let codeLines = 0;

  for (const file of files) {
    const { lines, totalLines: total } = await countLines(file);
    const relativePath = path.relative(baseDir, file);

    fileStats.push({ path: relativePath, lines, totalLines: total });

    codeLines += lines;
    totalLines += total;
  }

  return { totalLines, codeLines, files: fileStats };
}

/**
 * Stats command implementation
 */
export async function statsCommand(includeFull: boolean): Promise<void> {
  const projectRoot = path.join(process.cwd(), "..");
  const srcDir = path.join(projectRoot, "src");
  const testDir = path.join(projectRoot, "test");

  console.log(chalk.blue.bold("\nVolt.js Code Statistics\n"));

  const srcStats = await collectStats(srcDir, projectRoot);

  console.log(chalk.cyan("Source Code (src/):"));
  console.log(`  Files: ${srcStats.files.length}`);
  console.log(`  Total Lines: ${srcStats.totalLines}`);
  console.log(chalk.green(`  Code Lines: ${srcStats.codeLines}`));
  console.log(`  Doc/Comments: ${srcStats.totalLines - srcStats.codeLines}`);

  let totalCode = srcStats.codeLines;
  let totalTotal = srcStats.totalLines;
  let totalFileCount = srcStats.files.length;

  // Include tests if --full flag is set
  if (includeFull) {
    const testStats = await collectStats(testDir, projectRoot);

    console.log(chalk.cyan("\nTest Code (test/):"));
    console.log(`  Files: ${testStats.files.length}`);
    console.log(`  Total Lines: ${testStats.totalLines}`);
    console.log(chalk.green(`  Code Lines: ${testStats.codeLines}`));
    console.log(`  Doc/Comments: ${testStats.totalLines - testStats.codeLines}`);

    totalCode += testStats.codeLines;
    totalTotal += testStats.totalLines;
    totalFileCount += testStats.files.length;
  }

  console.log(chalk.blue.bold("\nTotal:"));
  console.log(`  Files: ${totalFileCount}`);
  console.log(`  Total Lines: ${totalTotal}`);
  console.log(chalk.green.bold(`  Code Lines: ${totalCode}`));
  console.log(`  Doc/Comments: ${totalTotal - totalCode}`);

  if (process.env.VERBOSE) {
    console.log(chalk.yellow("\n\nFile Breakdown:"));
    for (const file of srcStats.files) {
      console.log(`  ${file.path}: ${file.lines} lines`);
    }
  }

  console.log();
}
