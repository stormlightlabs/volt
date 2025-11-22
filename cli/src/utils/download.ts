import { mkdir, writeFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";

/**
 * Download a file from a URL and save it to the specified path.
 */
export async function downloadFile(url: string, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        if (response.headers.location) {
          downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      const chunks: Buffer[] = [];

      response.on("data", (chunk) => {
        chunks.push(chunk);
      });

      response.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          await writeFile(outputPath, buffer);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      response.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Get the CDN URLs for VoltX.js assets.
 */
export function getCDNUrls(version: string = "latest"): { js: string; css: string } {
  const baseUrl = version === "latest"
    ? "https://cdn.jsdelivr.net/npm/voltx.js@latest/dist"
    : `https://cdn.jsdelivr.net/npm/voltx.js@${version}/dist`;

  return { js: `${baseUrl}/voltx.min.js`, css: `${baseUrl}/voltx.min.css` };
}
