import path from "node:path";
import { diffSections, extractHeadings, extractSections, hashMarkdown } from "./differ.js";
import type { DocMetadata } from "./storage.js";
import { getDocMetadata, updateDocMetadata } from "./storage.js";

/**
 * Track version for a generated documentation file
 * Compares with previous version, calculates diff, bumps version, adds frontmatter
 *
 * @param filePath Absolute path to the documentation file
 * @param content Generated markdown content (without frontmatter)
 * @returns Content with frontmatter prepended
 */
export async function trackVersion(filePath: string, content: string): Promise<string> {
  const docsDir = path.join(process.cwd(), "..", "docs");
  const relPath = path.relative(docsDir, filePath);

  const prevMeta = await getDocMetadata(relPath);

  const newSections = extractSections(content);
  const newHash = hashMarkdown(content);
  const today = new Date().toISOString().split("T")[0];

  if (!prevMeta) {
    const initialMeta: DocMetadata = {
      version: "1.0",
      updated: today,
      hash: newHash,
      sections: extractHeadings(content),
      history: [{ version: "1.0", date: today, hash: newHash, added: newSections.length, removed: 0, edited: 0 }],
    };

    await updateDocMetadata(relPath, initialMeta);
    return addFrontmatter(content, "1.0", today);
  }

  if (prevMeta.hash === newHash) {
    return addFrontmatter(content, prevMeta.version, prevMeta.updated);
  }

  const oldSections = extractSections(prevMeta.sections.map((h) => `${h}\n\nContent`).join("\n\n"));
  const diff = diffSections(oldSections, newSections);

  const newVersion = calculateVersionBump(diff, prevMeta.version);

  const newMeta: DocMetadata = {
    version: newVersion,
    updated: today,
    hash: newHash,
    sections: extractHeadings(content),
    history: [...prevMeta.history, {
      version: newVersion,
      date: today,
      hash: newHash,
      added: diff.added,
      removed: diff.removed,
      edited: diff.edited,
    }],
  };

  await updateDocMetadata(relPath, newMeta);
  return addFrontmatter(content, newVersion, today);
}

/**
 * Calculate version bump based on diff
 *
 * Rules:
 *  - Any sections removed → Major bump
 *  - Any sections added → Major bump
 *  - ≥4 sections edited → Major bump
 *  - 1-3 sections edited → Minor bump
 *  - No changes → No bump
 */
function calculateVersionBump(diff: { added: number; removed: number; edited: number }, current: string): string {
  const [major, minor] = current.split(".").map(Number);

  if (diff.removed > 0) {
    return `${major + 1}.0`;
  }

  if (diff.added > 0) {
    return `${major + 1}.0`;
  }

  if (diff.edited >= 4) {
    return `${major + 1}.0`;
  }

  if (diff.edited > 0) {
    return `${major}.${minor + 1}`;
  }

  return current;
}

/**
 * Add frontmatter to markdown content
 */
function addFrontmatter(content: string, version: string, date: string): string {
  return `---
version: ${version}
updated: ${date}
---

${content}`;
}
