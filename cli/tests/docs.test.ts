import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLibSrcPath } from "../src/utils/paths.js";

describe("docs generation", () => {
  it("should extract function documentation", async () => {
    const srcPath = await getLibSrcPath();
    const testFile = join(srcPath, "core", "signal.ts");
    const content = await readFile(testFile, "utf-8");

    expect(content).toContain("Creates a new signal");
    expect(content).toContain("@param initialValue");
    expect(content).toContain("@returns A Signal object");
    expect(content).toContain("@example");
  });

  it("should extract interface documentation", async () => {
    const srcPath = await getLibSrcPath();
    const typesFile = join(srcPath, "types", "volt.d.ts");
    const content = await readFile(typesFile, "utf-8");

    expect(content).toContain("interface Signal");
    expect(content).toContain("interface ComputedSignal");
  });

  it("should handle JSDoc with examples", () => {
    const jsdoc = `/**
 * Creates a signal
 * @example
 * const count = signal(0);
 * count.set(1);
 */`;

    const hasExample = jsdoc.includes("@example");
    expect(hasExample).toBe(true);

    const lines = jsdoc.split("\n");
    const exampleLines: string[] = [];
    let inExample = false;

    for (const line of lines) {
      const trimmed = line.trim().replace(/^\*\s?/, "");

      if (trimmed.startsWith("@example")) {
        inExample = true;
        continue;
      }

      if (trimmed.startsWith("@") && !trimmed.startsWith("@example")) {
        inExample = false;
        continue;
      }

      if (inExample && trimmed !== "" && !trimmed.startsWith("*/")) {
        exampleLines.push(trimmed);
      }
    }

    expect(exampleLines.length).toBeGreaterThan(0);
    expect(exampleLines.join("\n")).toContain("signal(0)");
  });

  it("should clean up JSDoc comments", () => {
    const jsdoc = `/**
 * This is a description
 * with multiple lines
 * @param foo - description
 */`;

    const lines = jsdoc.split("\n").map((line) => line.trim()).map((line) => line.replace(/^\/\*\*\s?/, "")).map((
      line,
    ) => line.replace(/^\*\s?/, "")).map((line) => line.replace(/\*\/\s*$/, "")).filter((line) =>
      !line.startsWith("@") && line !== ""
    );

    const description = lines.join("\n").trim();

    expect(description).toContain("This is a description");
    expect(description).toContain("with multiple lines");
    expect(description).not.toContain("@param");
  });

  it("should parse markdown structure", () => {
    const markdown = `# Module

## Function

Description here

\`\`\`typescript
function foo(): void
\`\`\`

**Example:**

\`\`\`typescript
foo();
\`\`\`
`;

    expect(markdown).toContain("# Module");
    expect(markdown).toContain("## Function");
    expect(markdown).toContain("**Example:**");
    expect(markdown).toMatch(/```typescript[\s\S]*?```/);
  });
});
