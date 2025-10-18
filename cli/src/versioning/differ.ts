import { createHash } from "node:crypto";

/**
 * Represents a section extracted from markdown
 */
export type Section = { heading: string; content: string; hash: string };

/**
 * Result of diffing two sets of sections
 */
export type SectionDiff = { added: number; removed: number; edited: number };

/**
 * Extract all ## and ### headings from markdown content
 */
export function extractSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentSection: { heading: string; lines: string[] } | undefined = undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      if (currentSection) {
        const content = currentSection.lines.join("\n").trim();
        sections.push({ heading: currentSection.heading, content, hash: hashContent(content) });
      }

      currentSection = { heading: trimmed, lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  if (currentSection) {
    const content = currentSection.lines.join("\n").trim();
    sections.push({ heading: currentSection.heading, content, hash: hashContent(content) });
  }

  return sections;
}

/**
 * Compare two sets of sections (matched by heading text) and calculate the diff
 */
export function diffSections(oldSections: Section[], newSections: Section[]): SectionDiff {
  const oldMap = new Map(oldSections.map((s) => [s.heading, s]));
  const newMap = new Map(newSections.map((s) => [s.heading, s]));

  let added = 0;
  let removed = 0;
  let edited = 0;

  for (const [heading, newSection] of newMap) {
    const oldSection = oldMap.get(heading);

    if (!oldSection) {
      added++;
    } else if (oldSection.hash !== newSection.hash) {
      edited++;
    }
  }

  // Find removed sections
  for (const heading of oldMap.keys()) {
    if (!newMap.has(heading)) {
      removed++;
    }
  }

  return { added, removed, edited };
}

/**
 * Hash content using SHA-256
 */
function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Extract section headings as a simple string array
 */
export function extractHeadings(markdown: string): string[] {
  return extractSections(markdown).map((s) => s.heading);
}

/**
 * Hash entire markdown content (without frontmatter)
 */
export function hashMarkdown(markdown: string): string {
  const withoutFrontmatter = stripFrontmatter(markdown);
  return hashContent(withoutFrontmatter);
}

/**
 * Remove YAML frontmatter from markdown
 */
function stripFrontmatter(markdown: string): string {
  const lines = markdown.split("\n");

  if (lines[0]?.trim() !== "---") {
    return markdown;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      return lines.slice(i + 1).join("\n");
    }
  }

  return markdown;
}
