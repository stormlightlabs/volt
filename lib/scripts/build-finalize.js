#!/usr/bin/env node

/**
 * Post-build script to finalize the distribution package:
 * 1. Copy index.d.ts to voltx.d.ts for cleaner imports
 * 2. Compress voltx.min.js to voltx.min.js.gz
 * 3. Clean up unwanted files (chunks, assets)
 */
import { writeFileSync } from "node:fs";
import { copyFile, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";
import { minify as terserMinify } from "terser";

async function doGzip(gzPath, input) {
  return new Promise(resolve => {
    const gzip = createGzip({ level: 9 });
    const output = [];
    gzip.on("data", (chunk) => output.push(chunk));
    gzip.on("end", () => {
      writeFileSync(gzPath, Buffer.concat(output));
      const sizes = {
        original: (input.length / 1024).toFixed(2),
        compressed: (Buffer.concat(output).length / 1024).toFixed(2),
      };
      console.log(`✓ Compressed voltx.min.js: ${sizes.original}KB → ${sizes.compressed}KB (gzip)`);
      resolve(void 0);
    });

    gzip.write(input);
    gzip.end();
  });
}

async function minifyJS(code) {
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

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(__dirname, "../dist");

  console.log("Finalizing build...\n");

  try {
    const indexDts = path.join(distDir, "index.d.ts");
    const voltxDts = path.join(distDir, "voltx.d.ts");
    await copyFile(indexDts, voltxDts);
    console.log("✓ Copied index.d.ts → voltx.d.ts");
  } catch (error) {
    if (error instanceof Error) {
      console.error("✗ Failed to copy type definitions:", error.message);
    }
    process.exit(1);
  }

  try {
    const minJsPath = path.join(distDir, "voltx.min.js");
    const gzPath = path.join(distDir, "voltx.min.js.gz");
    const input = await readFile(minJsPath);
    const minified = await minifyJS(input.toString());

    await writeFile(minJsPath, minified);
    await doGzip(gzPath, minified);
  } catch (error) {
    if (error instanceof Error) {
      console.error("✗ Failed to compress voltx.min.js:", error.message);
    }
    process.exit(1);
  }

  try {
    const files = await readdir(distDir);
    const unwantedPatterns = [/\.svg$/, /\.png$/, /\.jpg$/];
    let cleanedCount = 0;
    for (const file of files) {
      const shouldDelete = unwantedPatterns.some((pattern) => pattern.test(file));
      if (shouldDelete) {
        await unlink(path.join(distDir, file));
        console.log(`✓ Removed unwanted file: ${file}`);
        cleanedCount++;
      }
    }

    if (cleanedCount === 0) {
      console.log("✓ No unwanted files to clean");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("✗ Failed to clean unwanted files:", error.message);
    }
    process.exit(1);
  }

  console.log("\nBuild finalization complete!");
  process.exit(0);
}

main();
