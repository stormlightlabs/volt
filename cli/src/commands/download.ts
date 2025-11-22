import { downloadFile, getCDNUrls } from "$utils/download.js";
import { echo } from "$utils/echo.js";
import path from "node:path";

/**
 * Downloads VoltX.js assets (JS and/or CSS) from the CDN.
 */
export async function downloadCommand(
  options: { version?: string; js?: boolean; css?: boolean; output?: string } = {},
): Promise<void> {
  const version = options.version || "latest";
  const downloadJS = options.js !== false;
  const downloadCSS = options.css !== false;
  const outputDir = options.output || ".";

  echo.title("\n⚡ Downloading VoltX.js assets...\n");

  try {
    const urls = getCDNUrls(version);

    if (downloadJS) {
      const jsPath = path.join(outputDir, "voltx.min.js");
      echo.info(`Downloading voltx.min.js (${version})...`);
      await downloadFile(urls.js, jsPath);
      echo.ok(`✓ Downloaded: ${jsPath}`);
    }

    if (downloadCSS) {
      const cssPath = path.join(outputDir, "voltx.min.css");
      echo.info(`Downloading voltx.min.css (${version})...`);
      await downloadFile(urls.css, cssPath);
      echo.ok(`✓ Downloaded: ${cssPath}`);
    }

    echo.success("\n✓ Download completed successfully!\n");
  } catch (error) {
    echo.err("Failed to download assets:", error);
    process.exit(1);
  }
}
