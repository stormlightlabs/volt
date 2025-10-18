import { echo } from "$console/echo.js";
import { findMonorepoRoot, getLibPath } from "$utils/paths.js";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify as terserMinify } from "terser";

export type BuildArtifacts = { jsPath: string; cssPath: string };

export type BuildOptions = { outDir: string; minify?: boolean; includeCss?: boolean };

/**
 * Build the library using pnpm workspace commands.
 *
 * Runs `pnpm --filter volt build:lib` in the monorepo root to compile the Volt.js library into lib/dist/.
 */
export async function buildLibrary(): Promise<void> {
  const { execSync } = await import("node:child_process");
  const monorepoRoot = await findMonorepoRoot();

  try {
    execSync("pnpm --filter volt build:lib", { cwd: monorepoRoot, stdio: "inherit" });
  } catch {
    throw new Error("Library build failed. Make sure Vite is configured correctly.");
  }
}

/**
 * Find the library build artifacts in lib/dist/.
 *
 * Locates the compiled JavaScript and base CSS files after a successful build.
 */
export async function findBuildArtifacts(): Promise<BuildArtifacts> {
  const libPath = await getLibPath();
  const distDir = path.join(libPath, "dist");
  const jsPath = path.join(distDir, "volt.js");
  const cssPath = path.join(libPath, "src", "styles", "base.css");

  if (!existsSync(jsPath)) {
    throw new Error(`Library JS not found at ${jsPath}. Build may have failed.`);
  }

  if (!existsSync(cssPath)) {
    throw new Error(`Base CSS not found at ${cssPath}.`);
  }

  return { jsPath, cssPath };
}

/**
 * Minify JavaScript code using Terser.
 *
 * Applies aggressive compression and mangling to reduce bundle size.
 */
export async function minifyJS(code: string): Promise<string> {
  const result = await terserMinify(code, {
    compress: {
      dead_code: true,
      drop_debugger: true,
      conditionals: true,
      evaluate: true,
      booleans: true,
      loops: true,
      unused: true,
      hoist_funs: true,
      keep_fargs: false,
      hoist_vars: false,
      if_return: true,
      join_vars: true,
      side_effects: true,
    },
    mangle: { toplevel: true },
    format: { comments: false },
  });

  if (!result.code) {
    throw new Error("Minification failed - no output generated");
  }

  return result.code;
}

/**
 * Minify CSS code using regex-based compression.
 *
 * Removes comments, normalizes whitespace, and strips spacing around CSS syntax characters.
 */
export function minifyCSS(code: string): string {
  return code.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/\s+/g, " ").replaceAll(/\s*([{}:;,])\s*/g, "$1").trim();
}

/**
 * Copy build artifacts to the specified output directory.
 *
 * Reads the built JavaScript and CSS files, optionally minifies them, and writes them to the target directory.
 * Creates the directory if needed.
 * The output file naming depends on whether minification is enabled.
 */
export async function copyBuildArtifacts(artifacts: BuildArtifacts, options: BuildOptions): Promise<void> {
  const { outDir, minify = true, includeCss = true } = options;

  await mkdir(outDir, { recursive: true });

  const jsContent = await readFile(artifacts.jsPath, "utf8");
  const jsFilename = minify ? "volt.min.js" : "volt.js";
  let outputJS = jsContent;

  if (minify) {
    echo.info("  Minifying JavaScript...");
    outputJS = await minifyJS(jsContent);
  }

  const jsOutputPath = path.join(outDir, jsFilename);
  await writeFile(jsOutputPath, outputJS, "utf8");
  const jsSize = Math.round(outputJS.length / 1024);
  echo.ok(`  Created: ${jsFilename} (${jsSize} KB)`);

  if (includeCss) {
    const cssContent = await readFile(artifacts.cssPath, "utf8");
    const cssFilename = minify ? "volt.min.css" : "volt.css";
    let outputCSS = cssContent;

    if (minify) {
      echo.info("  Minifying CSS...");
      outputCSS = minifyCSS(cssContent);
    }

    const cssOutputPath = path.join(outDir, cssFilename);
    await writeFile(cssOutputPath, outputCSS, "utf8");
    const cssSize = Math.round(outputCSS.length / 1024);
    echo.ok(`  Created: ${cssFilename} (${cssSize} KB)`);
  }
}
