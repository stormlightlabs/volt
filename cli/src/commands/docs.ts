import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { echo } from "../console/echo.js";

type Member = { name: string; type: string; docs?: string };

type EntryKind = "function" | "interface" | "type" | "class";

type DocumentEntry = {
  name: string;
  kind: EntryKind;
  description: string;
  examples: string[];
  signature?: string;
  members?: Array<Member>;
};

type JSDocumentParsed = { description: string; examples: string[] };

/**
 * Extract and parse JSDoc comment text
 */
function extractJSDoc(node: ts.Node, sourceFile: ts.SourceFile): JSDocumentParsed {
  const fullText = sourceFile.getFullText();
  const ranges = ts.getLeadingCommentRanges(fullText, node.getFullStart());

  if (!ranges || ranges.length === 0) {
    return { description: "", examples: [] };
  }

  const comments = ranges.map((range) => fullText.substring(range.pos, range.end));
  const jsdocComments = comments.filter((c) => c.trim().startsWith("/**"));

  if (jsdocComments.length === 0) {
    return { description: "", examples: [] };
  }

  const comment = jsdocComments.at(-1);
  const lines = comment!.split("\n").map((line) => line.trim()).map((line) => line.replace(/^\/\*\*\s?/, "")).map((
    line,
  ) => line.replace(/^\*\s?/, "")).map((line) => line.replace(/\*\/\s*$/, "")).filter((line) =>
    line !== "/" && line !== "*"
  );

  const description: string[] = [];
  const examples: string[] = [];
  let currentExample: string[] = [];
  let inExample = false;

  for (const line of lines) {
    if (line.startsWith("@example")) {
      inExample = true;
      continue;
    }

    if (line.startsWith("@") && !line.startsWith("@example")) {
      if (inExample && currentExample.length > 0) {
        examples.push(currentExample.join("\n").trim());
        currentExample = [];
      }
      inExample = false;
      continue;
    }

    if (inExample) {
      currentExample.push(line);
    } else {
      description.push(line);
    }
  }

  if (currentExample.length > 0) {
    examples.push(currentExample.join("\n").trim());
  }

  return { description: description.join("\n").trim(), examples };
}

/**
 * Extract function signature
 */
function extractFnSig(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string {
  const start = node.getStart(sourceFile);
  const end = node.body ? node.body.getStart(sourceFile) : node.getEnd();
  return sourceFile.text.substring(start, end).trim().replaceAll(/\s+/g, " ");
}

/**
 * Extract interface members
 */
function extractIMembers(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): Array<Member> {
  const members: Array<Member> = [];

  for (const member of node.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const name = member.name.getText(sourceFile);
      const type = member.type ? member.type.getText(sourceFile) : "unknown";
      const { description } = extractJSDoc(member, sourceFile);

      members.push({ name, type, docs: description || undefined });
    }
  }

  return members;
}

/**
 * Generate markdown for a documentation entry
 */
function generateMD(entries: DocumentEntry[], moduleName: string, moduleDocs: string): string {
  const lines: string[] = [];

  lines.push(`# ${moduleName}`, "");

  if (moduleDocs) {
    lines.push(moduleDocs, "");
  }

  for (const entry of entries) {
    lines.push(`## ${entry.name}`, "");

    if (entry.description) {
      lines.push(entry.description, "");
    }

    if (entry.signature) {
      lines.push("```typescript", entry.signature, "```", "");
    }

    if (entry.examples && entry.examples.length > 0) {
      for (const example of entry.examples) {
        lines.push("**Example:**", "", "```typescript", example, "```", "");
      }
    }

    if (entry.members && entry.members.length > 0) {
      lines.push("### Members", "");

      for (const member of entry.members) {
        lines.push(`- **${member.name}**: \`${member.type}\``);
        if (member.docs) {
          lines.push(`  ${member.docs}`);
        }
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Extract module-level documentation
 */
function extractModDocs(content: string): string {
  const lines = content.split("\n");
  const docLines: string[] = [];
  let inDoc = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "/**") {
      inDoc = true;
      continue;
    }

    if (inDoc) {
      if (trimmed === "*/") {
        break;
      }

      const cleaned = trimmed.replace(/^\*\s?/, "");
      if (!cleaned.startsWith("@packageDocumentation")) {
        docLines.push(cleaned);
      }
    }
  }

  return docLines.join("\n").trim();
}

/**
 * Parse a TypeScript file and extract documentation
 */
function parseFile(filePath: string, content: string): DocumentEntry[] {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const entries: DocumentEntry[] = [];

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const modifiers = node.modifiers;
      const isExported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

      if (isExported) {
        const name = node.name.text;
        const { description, examples } = extractJSDoc(node, sourceFile);
        const signature = extractFnSig(node, sourceFile);

        entries.push({ name, kind: "function", description, examples, signature });
      }
    }

    if (ts.isInterfaceDeclaration(node)) {
      const modifiers = node.modifiers;
      const isExported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

      if (isExported) {
        const name = node.name.text;
        const { description, examples } = extractJSDoc(node, sourceFile);
        const members = extractIMembers(node, sourceFile);

        entries.push({ name, kind: "interface", description, examples, members });
      }
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const modifiers = node.modifiers;
      const isExported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

      if (isExported) {
        const name = node.name.text;
        const { description, examples } = extractJSDoc(node, sourceFile);
        const signature = node.type.getText(sourceFile);

        entries.push({ name, kind: "type", description, examples, signature });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return entries;
}

/**
 * Process a TypeScript file and generate documentation
 */
async function processFile(filePath: string, baseDir: string, outputDir: string): Promise<void> {
  const content = await readFile(filePath, "utf8");
  const entries = parseFile(filePath, content);

  if (entries.length === 0) {
    return;
  }

  const moduleDocs = extractModDocs(content);
  const relativePath = path.relative(baseDir, filePath);
  const moduleName = path.basename(relativePath, ".ts");
  const markdown = generateMD(entries, moduleName, moduleDocs);

  const outputPath = path.join(outputDir, `${moduleName}.md`);
  await writeFile(outputPath, markdown, "utf8");

  echo.ok(`  Generated: ${relativePath} -> api/${moduleName}.md`);
}

/**
 * Recursively find all TypeScript files
 */
async function findTsFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await findTsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Docs command implementation
 */
export async function docsCommand(): Promise<void> {
  const root = path.join(process.cwd(), "..");
  const srcDir = path.join(root, "src");
  const docsDir = path.join(root, "docs", "api");

  echo.title("\nGenerating API Documentation\n");

  await mkdir(docsDir, { recursive: true });

  const files = await findTsFiles(srcDir);

  echo.info(`Found ${files.length} TypeScript files\n`);

  for (const file of files) {
    await processFile(file, srcDir, docsDir);
  }

  echo.success(`\nAPI documentation generated in docs/api/\n`);
}
