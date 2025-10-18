import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { echo } from "../console/echo.js";
import { trackVersion } from "../versioning/tracker.js";
import { getLibSrcPath, getDocsPath } from "../utils/paths.js";

type CSSComment = { selector: string; comment: string };

type CSSVariable = { name: string; value: string; category: string };

type ElementCoverage = { element: string; covered: boolean };

/**
 * Extract CSS doc comments from CSS file by parsing block comments and associatint them with selectors
 */
function extractCSSComments(cssContent: string): CSSComment[] {
  const comments: CSSComment[] = [];
  const lines = cssContent.split("\n");

  let currentComment = "";
  let inComment = false;
  let commentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("/**") || trimmed.startsWith("/*")) {
      inComment = true;
      commentLines = [];
      const commentText = trimmed.replace(/^\/\*+\s*/, "").replace(/\*\/\s*$/, "");
      if (commentText && !commentText.startsWith("=")) {
        commentLines.push(commentText);
      }
      continue;
    }

    if (inComment) {
      if (trimmed.includes("*/")) {
        const commentText = trimmed.replace(/\*\/.*$/, "").replace(/^\*\s*/, "");
        if (commentText && !commentText.startsWith("=")) {
          commentLines.push(commentText);
        }
        currentComment = commentLines.join(" ").trim();
        inComment = false;

        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine === "" || nextLine.startsWith("/*")) {
            continue;
          }

          if (nextLine.includes("{") || j + 1 < lines.length && lines[j + 1].includes("{")) {
            const selector = nextLine.replace("{", "").trim();
            if (selector && currentComment) {
              comments.push({ selector, comment: currentComment });
            }
            break;
          }
          break;
        }
        currentComment = "";
        continue;
      }

      const commentText = trimmed.replace(/^\*\s*/, "");
      if (commentText && !commentText.startsWith("=")) {
        commentLines.push(commentText);
      }
    }
  }

  return comments;
}

/**
 * Extract CSS custom properties (variables) from :root, grouping them by category based on naming conventions
 */
function extractCSSVariables(cssContent: string): CSSVariable[] {
  const variables: CSSVariable[] = [];
  const lines = cssContent.split("\n");
  let inRoot = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith(":root")) {
      inRoot = true;
      continue;
    }

    if (inRoot && trimmed === "}") {
      inRoot = false;
      continue;
    }

    if (inRoot && trimmed.startsWith("--")) {
      const match = trimmed.match(/^(--[a-z0-9-]+)\s*:\s*([^;]+);/);
      if (match) {
        const [, name, value] = match;
        const category = categorizeCSSVar(name);
        variables.push({ name, value: value.trim(), category });
      }
    }
  }

  return variables;
}

/**
 * Categorize CSS variable by name prefix
 */
function categorizeCSSVar(name: string): string {
  if (name.startsWith("--font")) return "Typography";
  if (name.startsWith("--line-height")) return "Typography";
  if (name.startsWith("--space")) return "Spacing";
  if (name.startsWith("--color")) return "Colors";
  if (name.startsWith("--shadow")) return "Effects";
  if (name.startsWith("--radius")) return "Effects";
  if (name.startsWith("--transition")) return "Effects";
  if (name.startsWith("--content")) return "Layout";
  if (name.startsWith("--sidenote")) return "Layout";
  return "Other";
}

function validateElementCoverage(cssContent: string): ElementCoverage[] {
  const elementsToCheck = [
    "html",
    "body",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "a",
    "em",
    "strong",
    "mark",
    "small",
    "sub",
    "sup",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "blockquote",
    "cite",
    "code",
    "pre",
    "kbd",
    "samp",
    "var",
    "hr",
    "table",
    "thead",
    "tbody",
    "th",
    "td",
    "tr",
    "form",
    "fieldset",
    "legend",
    "label",
    "input",
    "select",
    "textarea",
    "button",
    "img",
    "figure",
    "figcaption",
    "video",
    "audio",
    "canvas",
    "svg",
    "iframe",
    "article",
    "section",
    "aside",
    "header",
    "footer",
    "nav",
    "details",
    "summary",
  ];

  const coverage: ElementCoverage[] = [];

  for (const element of elementsToCheck) {
    const patterns = [
      // element {
      new RegExp(`^${element}\\s*\\{`, "m"),
      // element,
      new RegExp(`^${element},`, "m"),
      // , element {
      new RegExp(`,\\s*${element}\\s*\\{`, "m"),
      // element:pseudo
      new RegExp(`^${element}:`, "m"),
      // element[attr]
      new RegExp(`${element}\\[`, "m"),
    ];

    const covered = patterns.some((pattern) => pattern.test(cssContent));
    coverage.push({ element, covered });
  }

  return coverage;
}

/**
 * Generate markdown documentation from extracted data
 */
function generateSemanticsDocs(comments: CSSComment[], variables: CSSVariable[], coverage: ElementCoverage[]): string {
  const lines: string[] = [
    "# Volt CSS Semantics",
    "",
    "Auto-generated documentation from base.css",
    "",
    "## CSS Custom Properties",
    "",
    "All design tokens defined in the stylesheet.",
    "",
  ];

  const categoryMap = new Map<string, CSSVariable[]>();
  for (const variable of variables) {
    if (!categoryMap.has(variable.category)) {
      categoryMap.set(variable.category, []);
    }
    categoryMap.get(variable.category)!.push(variable);
  }

  for (const [category, vars] of categoryMap) {
    lines.push(`### ${category}`, "");
    for (const v of vars) {
      lines.push(`- \`${v.name}\`: \`${v.value}\``);
    }
    lines.push("");
  }

  lines.push("## Element Coverage", "", "HTML elements with defined styling in the stylesheet.", "");

  const covered = coverage.filter((c) => c.covered);
  const notCovered = coverage.filter((c) => !c.covered);

  lines.push(`**Coverage**: ${covered.length}/${coverage.length} elements`, "", "### Styled Elements", "");

  const coveredByCategory = groupElementsByCategory(covered.map((c) => c.element));
  for (const [category, elements] of Object.entries(coveredByCategory)) {
    lines.push(`**${category}**: ${elements.join(", ")}`);
  }
  lines.push("");

  if (notCovered.length > 0) {
    lines.push("### Unstyled Elements", "", notCovered.map((c) => c.element).join(", "), "");
  }

  lines.push("## Documentation Comments", "", "Inline documentation extracted from CSS comments.", "");

  for (const comment of comments) {
    if (comment.comment.length > 200) {
      continue;
    }

    lines.push(`### \`${comment.selector}\``, "");
    lines.push(comment.comment, "");
  }

  return lines.join("\n");
}

function groupElementsByCategory(elements: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    "Document Structure": [],
    "Typography": [],
    "Lists": [],
    "Semantic": [],
    "Forms": [],
    "Tables": [],
    "Media": [],
    "Code": [],
  };

  const categoryMap: Record<string, string> = {
    html: "Document Structure",
    body: "Document Structure",
    h1: "Typography",
    h2: "Typography",
    h3: "Typography",
    h4: "Typography",
    h5: "Typography",
    h6: "Typography",
    p: "Typography",
    a: "Typography",
    em: "Typography",
    strong: "Typography",
    mark: "Typography",
    small: "Typography",
    sub: "Typography",
    sup: "Typography",
    hr: "Typography",
    ul: "Lists",
    ol: "Lists",
    li: "Lists",
    dl: "Lists",
    dt: "Lists",
    dd: "Lists",
    blockquote: "Semantic",
    cite: "Semantic",
    article: "Semantic",
    section: "Semantic",
    aside: "Semantic",
    header: "Semantic",
    footer: "Semantic",
    nav: "Semantic",
    details: "Semantic",
    summary: "Semantic",
    form: "Forms",
    fieldset: "Forms",
    legend: "Forms",
    label: "Forms",
    input: "Forms",
    select: "Forms",
    textarea: "Forms",
    button: "Forms",
    table: "Tables",
    thead: "Tables",
    tbody: "Tables",
    th: "Tables",
    td: "Tables",
    tr: "Tables",
    img: "Media",
    figure: "Media",
    figcaption: "Media",
    video: "Media",
    audio: "Media",
    canvas: "Media",
    svg: "Media",
    iframe: "Media",
    code: "Code",
    pre: "Code",
    kbd: "Code",
    samp: "Code",
    var: "Code",
  };

  for (const element of elements) {
    const category = categoryMap[element] || "Other";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(element);
  }

  return Object.fromEntries(Object.entries(categories).filter(([, els]) => els.length > 0));
}

/**
 * CSS documentation command implementation
 *
 * Generates semantics.md from base.css
 */
export async function cssDocsCommand(): Promise<void> {
  const libSrcPath = await getLibSrcPath();
  const docsPath = await getDocsPath();
  const cssPath = path.join(libSrcPath, "styles", "base.css");
  const outputDir = path.join(docsPath, "css");
  const outputPath = path.join(outputDir, "semantics.md");

  echo.title("\nGenerating CSS Documentation\n");

  let cssContent: string;
  try {
    cssContent = await readFile(cssPath, "utf8");
    echo.ok(`Read ${cssPath}`);
  } catch (error) {
    echo.err(`Failed to read CSS file: ${cssPath}`);
    throw error;
  }

  echo.info("\nExtracting CSS documentation...");

  const comments = extractCSSComments(cssContent);
  echo.ok(`  Found ${comments.length} documented selectors`);

  const variables = extractCSSVariables(cssContent);
  echo.ok(`  Found ${variables.length} CSS custom properties`);

  const coverage = validateElementCoverage(cssContent);
  const coveredCount = coverage.filter((c) => c.covered).length;
  echo.ok(`  Element coverage: ${coveredCount}/${coverage.length}`);

  const markdown = generateSemanticsDocs(comments, variables, coverage);

  await mkdir(outputDir, { recursive: true });

  echo.info("\nTracking version...");
  const versionedContent = await trackVersion(outputPath, markdown);
  await writeFile(outputPath, versionedContent, "utf8");

  echo.success(`\nCSS documentation generated: docs/css/semantics.md\n`);
  echo.label("Summary:");
  echo.text(`  CSS Comments: ${comments.length}`);
  echo.text(`  CSS Variables: ${variables.length}`);
  echo.text(`  Element Coverage: ${coveredCount}/${coverage.length}\n`);
}
