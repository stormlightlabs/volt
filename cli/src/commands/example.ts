import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { minify as terserMinify } from "terser";
import { echo } from "../console/echo.js";

type BuildArtifacts = { jsPath: string; cssPath: string };

/**
 * Find the project root by walking up the directory tree.
 * Looks for a directory containing dist/assets/ or package.json with name "volt"
 */
async function findProjectRoot(startDir: string): Promise<string> {
  let currentDir = startDir;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const distAssetsPath = path.join(currentDir, "dist", "assets");
    const packageJsonPath = path.join(currentDir, "package.json");

    if (existsSync(distAssetsPath)) {
      return currentDir;
    }

    if (existsSync(packageJsonPath)) {
      try {
        const pkgContent = JSON.parse(await readFile(packageJsonPath, "utf8"));
        if (pkgContent.name === "volt") {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error("Could not find Volt project root. Make sure you're in the Volt project directory.");
    }

    currentDir = parentDir;
    depth++;
  }

  throw new Error("Could not find Volt project root. Make sure you're in the Volt project directory.");
}

/**
 * Find the hashed build artifacts in dist/assets/
 */
async function findBuildArtifacts(root: string): Promise<BuildArtifacts> {
  const distAssetsDir = path.join(root, "dist", "assets");

  let entries: string[];
  try {
    const dirents = await readdir(distAssetsDir, { withFileTypes: true });
    entries = dirents.filter((d) => d.isFile()).map((d) => d.name);
  } catch {
    throw new Error("Build artifacts not found. Run 'pnpm build' first to generate dist/assets/");
  }

  const jsFile = entries.find((f) => f.startsWith("index-") && f.endsWith(".js"));
  const cssFile = entries.find((f) => f.startsWith("index-") && f.endsWith(".css"));

  if (!jsFile || !cssFile) {
    throw new Error("Build artifacts incomplete. Expected index-*.js and index-*.css in dist/assets/");
  }

  return { jsPath: path.join(distAssetsDir, jsFile), cssPath: path.join(distAssetsDir, cssFile) };
}

/**
 * Minify JavaScript code using terser
 */
async function minifyJS(code: string): Promise<string> {
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
 * Minify CSS code (simple minification)
 */
function minifyCSS(code: string): string {
  return code.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/\s+/g, " ").replaceAll(/\s*([{}:;,])\s*/g, "$1").trim();
}

/**
 * Create minified build artifacts in examples/dist/
 */
async function createMinifiedArtifacts(artifacts: BuildArtifacts, examplesDir: string): Promise<void> {
  const examplesDistDir = path.join(examplesDir, "dist");
  await mkdir(examplesDistDir, { recursive: true });

  const jsContent = await readFile(artifacts.jsPath, "utf8");
  const cssContent = await readFile(artifacts.cssPath, "utf8");

  echo.info("  Minifying JavaScript...");
  const minifiedJS = await minifyJS(jsContent);

  echo.info("  Minifying CSS...");
  const minifiedCSS = minifyCSS(cssContent);

  const voltJSPath = path.join(examplesDistDir, "volt.min.js");
  const voltCSSPath = path.join(examplesDistDir, "volt.min.css");

  await writeFile(voltJSPath, minifiedJS, "utf8");
  await writeFile(voltCSSPath, minifiedCSS, "utf8");

  echo.ok(`  Created: examples/dist/volt.min.js (${Math.round(minifiedJS.length / 1024)} KB)`);
  echo.ok(`  Created: examples/dist/volt.min.css (${Math.round(minifiedCSS.length / 1024)} KB)`);
}

function generateHTML(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Volt.js Example</title>
  <link rel="stylesheet" href="../dist/volt.min.css">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div id="app">
    <h1>${name}</h1>
    <!-- Add your HTML here with data-x-* attributes -->
  </div>

  <script type="module" src="../dist/volt.min.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
`;
}

function generateREADME(name: string): string {
  return `# ${name}

## Description

Brief description of what this example demonstrates.

## Features

- Feature 1
- Feature 2
- Feature 3

## Running the Example

1. Make sure the project is built: \`pnpm build\` from the root
2. Open \`index.html\` in a browser
3. Or use a local server: \`python3 -m http.server 8000\`

## Code Highlights

Explain key parts of the implementation here.
`;
}

/**
 * Generate app.js template
 */
function generateAppJS(): string {
  return `// Import volt.js functions if needed
// import { mount, signal, computed, effect } from '../dist/volt.min.js';

// Add your custom JavaScript here
// Example:
// const state = {
//   count: signal(0)
// };

// mount(document.querySelector('#app'), state);
`;
}

function generateAppCSS(): string {
  return `/* Add your custom styles here */

/* Example:
body {
  font-family: system-ui, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
*/
`;
}

/**
 * Create example directory with all files
 */
async function createExampleFiles(exampleDir: string, name: string): Promise<void> {
  await mkdir(exampleDir, { recursive: true });

  const files = [
    { path: "index.html", content: generateHTML(name) },
    { path: "README.md", content: generateREADME(name) },
    { path: "app.js", content: generateAppJS() },
    { path: "app.css", content: generateAppCSS() },
  ];

  for (const file of files) {
    const filePath = path.join(exampleDir, file.path);
    await writeFile(filePath, file.content, "utf8");
    echo.ok(`  Created: examples/${name}/${file.path}`);
  }
}

/**
 * Example (generator) command implementation
 *
 * Creates a new example scaffold with minified volt.js build artifacts
 */
export async function exampleCommand(name: string): Promise<void> {
  const root = await findProjectRoot(process.cwd());
  const examplesDir = path.join(root, "examples");
  const exampleDir = path.join(examplesDir, name);

  echo.title(`\nCreating example: ${name}\n`);

  echo.info("Finding build artifacts...");
  const artifacts = await findBuildArtifacts(root);

  echo.info("Creating minified build artifacts...");
  await createMinifiedArtifacts(artifacts, examplesDir);

  echo.info(`\nScaffolding example files...`);
  await createExampleFiles(exampleDir, name);

  echo.success(`\nExample created successfully!\n`);
  echo.info(`Location: examples/${name}/`);
  echo.info(`Next steps:`);
  echo.text(`  1. Edit examples/${name}/index.html to add your UI`);
  echo.text(`  2. Edit examples/${name}/app.js to add your logic`);
  echo.text(`  3. Open examples/${name}/index.html in a browser\n`);
}
