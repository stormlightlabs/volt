#!/usr/bin/env node

/**
 * Post-build script to finalize the distribution package:
 * 1. Copy index.d.ts to voltx.d.ts for cleaner imports
 * 2. Compress voltx.min.js to voltx.min.js.gz
 * 3. Clean up unwanted files (chunks, assets)
 */
import { copyFileSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

// TODO: move to dev cli
function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(__dirname, "../dist");

  console.log("Finalizing build...\n");

  try {
    const indexDts = path.join(distDir, "index.d.ts");
    const voltxDts = path.join(distDir, "voltx.d.ts");
    copyFileSync(indexDts, voltxDts);
    console.log("✓ Copied index.d.ts → voltx.d.ts");
  } catch (error) {
    console.error("✗ Failed to copy type definitions:", error.message);
    process.exit(1);
  }

  try {
    const minJsPath = path.join(distDir, "voltx.min.js");
    const gzPath = path.join(distDir, "voltx.min.js.gz");

    const input = readFileSync(minJsPath);
    const gzip = createGzip({ level: 9 });
    const output = [];

    gzip.on("data", (chunk) => output.push(chunk));
    gzip.on("end", () => {
      writeFileSync(gzPath, Buffer.concat(output));
      const originalSize = (input.length / 1024).toFixed(2);
      const compressedSize = (Buffer.concat(output).length / 1024).toFixed(2);
      console.log(`✓ Compressed voltx.min.js: ${originalSize}KB → ${compressedSize}KB (gzip)`);
    });

    gzip.write(input);
    gzip.end();
  } catch (error) {
    console.error("✗ Failed to compress voltx.min.js:", error.message);
    process.exit(1);
  }

  try {
    const files = readdirSync(distDir);
    // Any files not named voltx* or debug* or images
    const unwantedPatterns = [/^(?!voltx|debug).*\.js$/, /\.svg$/, /\.png$/, /\.jpg$/];

    let cleanedCount = 0;
    for (const file of files) {
      const shouldDelete = unwantedPatterns.some((pattern) => pattern.test(file));
      if (shouldDelete) {
        unlinkSync(path.join(distDir, file));
        console.log(`✓ Removed unwanted file: ${file}`);
        cleanedCount++;
      }
    }

    if (cleanedCount === 0) {
      console.log("✓ No unwanted files to clean");
    }
  } catch (error) {
    console.error("✗ Failed to clean unwanted files:", error.message);
    process.exit(1);
  }

  console.log("\n✨ Build finalization complete!");
  process.exit(0);
}

main();
