import { echo } from "$console/echo.js";
import { type BuildArtifacts, buildLibrary, copyBuildArtifacts, findBuildArtifacts } from "$utils/build.js";
import { getExamplesPath } from "$utils/paths.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type BuildMode = "markup" | "programmatic";

/**
 * Create minified build artifacts in examples/dist/
 */
async function createMinifiedArtifacts(artifacts: BuildArtifacts, examplesDir: string): Promise<void> {
  const examplesDistDir = path.join(examplesDir, "dist");
  await copyBuildArtifacts(artifacts, { outDir: examplesDistDir, minify: true, includeCss: true });
}

function generateHTML(name: string, mode: BuildMode, standalone: boolean): string {
  const cssPath = standalone ? "volt.min.css" : "../dist/volt.min.css";
  const jsPath = standalone ? "volt.min.js" : "../dist/volt.min.js";

  if (mode === "markup") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Volt.js Example</title>
  <link rel="stylesheet" href="${cssPath}">
</head>
<body>
  <div data-volt data-volt-state='{"message": "Hello Volt!"}'>
    <h1 data-volt-text="message">Loading...</h1>
    <!-- Add your HTML here with data-volt-* attributes -->
  </div>

  <script type="module">
    import { charge, registerPlugin, persistPlugin, scrollPlugin, urlPlugin } from './${jsPath}';

    // Register plugins
    registerPlugin('persist', persistPlugin);
    registerPlugin('scroll', scrollPlugin);
    registerPlugin('url', urlPlugin);

    // Initialize Volt roots
    charge();
  </script>
</body>
</html>
`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Volt.js Example</title>
  <link rel="stylesheet" href="${cssPath}">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div id="app">
    <h1>${name}</h1>
    <!-- Add your HTML here with data-volt-* attributes -->
  </div>

  <script type="module" src="${jsPath}"></script>
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
  return "/* Add your custom styles here */\n";
}

/**
 * Create example directory with all files
 */
async function createExampleFiles(
  exampleDir: string,
  name: string,
  mode: BuildMode,
  standalone: boolean,
): Promise<void> {
  await mkdir(exampleDir, { recursive: true });

  const files = [{ path: "index.html", content: generateHTML(name, mode, standalone) }, {
    path: "README.md",
    content: generateREADME(name),
  }];

  if (mode === "programmatic") {
    files.push({ path: "app.js", content: generateAppJS() }, { path: "app.css", content: generateAppCSS() });
  }

  for (const file of files) {
    const filePath = path.join(exampleDir, file.path);
    await writeFile(filePath, file.content, "utf8");
    echo.ok(`  Created: examples/${name}/${file.path}`);
  }
}

async function copyStandaloneFiles(examplesDir: string, exampleDir: string): Promise<void> {
  const distDir = path.join(examplesDir, "dist");
  const jsSource = path.join(distDir, "volt.min.js");
  const cssSource = path.join(distDir, "volt.min.css");

  const jsDest = path.join(exampleDir, "volt.min.js");
  const cssDest = path.join(exampleDir, "volt.min.css");

  const jsContent = await readFile(jsSource, "utf8");
  const cssContent = await readFile(cssSource, "utf8");

  await writeFile(jsDest, jsContent, "utf8");
  await writeFile(cssDest, cssContent, "utf8");

  echo.ok(`  Copied: volt.min.js (${Math.round(jsContent.length / 1024)} KB)`);
  echo.ok(`  Copied: volt.min.css (${Math.round(cssContent.length / 1024)} KB)`);
}

/**
 * Example (generator) command implementation
 *
 * Creates a new example scaffold with minified volt.js build artifacts
 */
export async function exampleCommand(
  name: string,
  options: { mode?: BuildMode; standalone?: boolean } = {},
): Promise<void> {
  const mode = options.mode || "programmatic";
  const standalone = options.standalone || false;

  const examplesDir = await getExamplesPath();
  const exampleDir = path.join(examplesDir, name);

  echo.title(`\nCreating example: ${name}\n`);
  echo.info(`Mode: ${mode}`);
  echo.info(`Standalone: ${standalone ? "Yes" : "No (shared)"}\n`);

  echo.info("Building Volt.js library...");
  await buildLibrary();

  echo.info("Finding build artifacts...");
  const artifacts = await findBuildArtifacts();

  echo.info("Creating minified build artifacts...");
  await createMinifiedArtifacts(artifacts, examplesDir);

  echo.info(`\nScaffolding example files...`);
  await createExampleFiles(exampleDir, name, mode, standalone);

  if (standalone) {
    echo.info("\nCopying standalone files...");
    await copyStandaloneFiles(examplesDir, exampleDir);
  }

  echo.success(`\nExample created successfully!\n`);
  echo.info(`Location: examples/${name}/`);
  echo.info(`Next steps:`);

  if (mode === "markup") {
    echo.text(`  1. Edit examples/${name}/index.html to add your UI with data-volt-* attributes`);
    echo.text(`  2. Open examples/${name}/index.html in a browser\n`);
  } else {
    echo.text(`  1. Edit examples/${name}/index.html to add your UI`);
    echo.text(`  2. Edit examples/${name}/app.js to add your logic`);
    echo.text(`  3. Open examples/${name}/index.html in a browser\n`);
  }
}
