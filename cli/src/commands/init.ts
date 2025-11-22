import {
  generateMinimalCSS,
  generateMinimalHTML,
  generateMinimalPackageJSON,
  generateMinimalREADME,
} from "$templates/minimal.js";
import {
  generateStylesCSS,
  generateStylesHTML,
  generateStylesPackageJSON,
  generateStylesREADME,
} from "$templates/styles.js";
import {
  generatePluginsCSS,
  generatePluginsHTML,
  generatePluginsPackageJSON,
  generatePluginsREADME,
} from "$templates/with-plugins.js";
import {
  generateRouterCSS,
  generateRouterHTML,
  generateRouterPackageJSON,
  generateRouterREADME,
} from "$templates/with-router.js";
import { downloadFile, getCDNUrls } from "$utils/download.js";
import { echo } from "$utils/echo.js";
import { createFile, isEmptyOrMissing } from "$utils/files.js";
import { input, select } from "@inquirer/prompts";
import path from "node:path";

type Template = "minimal" | "with-router" | "with-plugins" | "styles";

/**
 * Download VoltX.js assets to the project directory.
 */
async function downloadAssets(projectDir: string, template: Template): Promise<void> {
  const urls = getCDNUrls();

  echo.info("Downloading VoltX.js assets...");

  const cssPath = path.join(projectDir, "voltx.min.css");
  await downloadFile(urls.css, cssPath);
  echo.ok(`  Downloaded: voltx.min.css`);

  if (template !== "styles") {
    const jsPath = path.join(projectDir, "voltx.min.js");
    await downloadFile(urls.js, jsPath);
    echo.ok(`  Downloaded: voltx.min.js`);
  }
}

/**
 * Generate project files based on the selected template.
 */
async function generateProjectFiles(projectDir: string, projectName: string, template: Template): Promise<void> {
  echo.info("Generating project files...");

  let htmlContent: string;
  let cssContent: string;
  let packageJsonContent: string;
  let readmeContent: string;

  switch (template) {
    case "minimal":
      htmlContent = generateMinimalHTML(projectName);
      cssContent = generateMinimalCSS();
      packageJsonContent = generateMinimalPackageJSON(projectName);
      readmeContent = generateMinimalREADME(projectName);
      break;

    case "styles":
      htmlContent = generateStylesHTML(projectName);
      cssContent = generateStylesCSS();
      packageJsonContent = generateStylesPackageJSON(projectName);
      readmeContent = generateStylesREADME(projectName);
      break;

    case "with-router":
      htmlContent = generateRouterHTML(projectName);
      cssContent = generateRouterCSS();
      packageJsonContent = generateRouterPackageJSON(projectName);
      readmeContent = generateRouterREADME(projectName);
      break;

    case "with-plugins":
      htmlContent = generatePluginsHTML(projectName);
      cssContent = generatePluginsCSS();
      packageJsonContent = generatePluginsPackageJSON(projectName);
      readmeContent = generatePluginsREADME(projectName);
      break;
  }

  await createFile(path.join(projectDir, "index.html"), htmlContent);
  echo.ok(`  Created: index.html`);

  await createFile(path.join(projectDir, "styles.css"), cssContent);
  echo.ok(`  Created: styles.css`);

  await createFile(path.join(projectDir, "package.json"), packageJsonContent);
  echo.ok(`  Created: package.json`);

  await createFile(path.join(projectDir, "README.md"), readmeContent);
  echo.ok(`  Created: README.md`);
}

/**
 * Init command implementation.
 *
 * Creates a new VoltX.js project with the selected template.
 */
export async function initCommand(projectName?: string): Promise<void> {
  echo.title("\n⚡ Create VoltX.js App\n");

  if (!projectName) {
    projectName = await input({ message: "Project name:", default: "my-voltx-app" });

    if (!projectName) {
      echo.err("Project name is required");
      process.exit(1);
    }
  }

  const projectDir = path.resolve(process.cwd(), projectName);

  if (!(await isEmptyOrMissing(projectDir))) {
    echo.err(`Directory ${projectName} already exists and is not empty`);
    process.exit(1);
  }

  const template = await select<Template>({
    message: "Select a template:",
    choices: [
      { name: "Minimal", value: "minimal", description: "Basic VoltX.js app with counter" },
      { name: "With Router", value: "with-router", description: "Multi-page app with routing" },
      { name: "With Plugins", value: "with-plugins", description: "All plugins demo" },
      { name: "Styles Only", value: "styles", description: "Just HTML + CSS, no framework" },
    ],
  });

  try {
    echo.text("");
    await generateProjectFiles(projectDir, projectName, template);

    echo.text("");
    await downloadAssets(projectDir, template);

    echo.success(`\n✓ Project created successfully!\n`);
    echo.info(`Next steps:\n`);
    echo.text(`  cd ${projectName}`);
    echo.text(`  pnpm install`);
    echo.text(`  pnpm dev\n`);
  } catch (error) {
    echo.err("Failed to create project:", error);
    process.exit(1);
  }
}
