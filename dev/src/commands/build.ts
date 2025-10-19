import { echo } from "$console/echo.js";
import { buildLibrary, copyBuildArtifacts, findBuildArtifacts } from "$utils/build.js";
import path from "node:path";

export type BuildCommandOptions = { minify?: boolean; css?: boolean };

/**
 * Build command implementation.
 *
 * Builds the Volt.js library and copies the build artifacts to the specified
 * output directory. Supports optional minification and CSS inclusion.
 */
export async function buildCommand(outDir: string = ".", options: BuildCommandOptions = {}): Promise<void> {
  const minify = options.minify !== false;
  const includeCss = options.css !== false;

  const resolvedOutDir = path.resolve(process.cwd(), outDir);

  echo.title("\nBuilding Volt.js library...\n");
  echo.info("Building library...");
  await buildLibrary();

  echo.info("Finding build artifacts...");
  const artifacts = await findBuildArtifacts();

  echo.info(`Copying to ${resolvedOutDir}...`);
  await copyBuildArtifacts(artifacts, { outDir: resolvedOutDir, minify, includeCss });

  echo.success("\nBuild completed successfully!\n");

  if (minify) {
    echo.info(`Output: ${outDir}${outDir.endsWith("/") ? "" : "/"}volt.min.js`);
    if (includeCss) {
      echo.info(`        ${outDir}${outDir.endsWith("/") ? "" : "/"}volt.min.css\n`);
    }
  } else {
    echo.info(`Output: ${outDir}${outDir.endsWith("/") ? "" : "/"}volt.js`);
    if (includeCss) {
      echo.info(`        ${outDir}${outDir.endsWith("/") ? "" : "/"}volt.css\n`);
    }
  }
}
