import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DefaultTheme } from "vitepress";

type SidebarItem = DefaultTheme.SidebarItem;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const u = {
  scanDir(dir: string, baseUrl = ""): SidebarItem[] {
    const items: SidebarItem[] = [];

    try {
      const resolvedDir = path.resolve(__dirname, "..", dir);
      const files = fs.readdirSync(resolvedDir);

      for (const file of files) {
        const fullPath = path.join(resolvedDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          continue;
        }

        if (!file.endsWith(".md")) {
          continue;
        }

        if (file === "index.md") {
          continue;
        }

        const content = fs.readFileSync(fullPath, "utf-8");
        const title = this.extractTitle(content, file);
        const link = `${baseUrl}/${path.parse(file).name}`;

        items.push({ text: title, link });
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }

    return items.toSorted((a, b) => a.text && b.text ? a.text.localeCompare(b.text) : 0);
  },
  extractTitle(content: string, filename: string): string {
    const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatter) {
      const title = frontmatter[1].match(/title:\s*(.+)/);
      if (title) {
        return title[1].replace(/['"]/g, "").trim();
      }
    }

    const heading = content.match(/^#\s+(.+)/m);
    if (heading) {
      return heading[1].trim();
    }

    return path.parse(filename).name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  },
};
