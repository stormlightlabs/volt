import { describe, it, expect } from "vitest";
import {
  generateMinimalHTML,
  generateMinimalCSS,
  generateMinimalPackageJSON,
  generateMinimalREADME,
} from "$templates/minimal.js";
import {
  generateStylesHTML,
  generateStylesCSS,
  generateStylesPackageJSON,
  generateStylesREADME,
} from "$templates/styles.js";
import {
  generateRouterHTML,
  generateRouterCSS,
  generateRouterPackageJSON,
  generateRouterREADME,
} from "$templates/with-router.js";
import {
  generatePluginsHTML,
  generatePluginsCSS,
  generatePluginsPackageJSON,
  generatePluginsREADME,
} from "$templates/with-plugins.js";

describe("template generators", () => {
  const projectName = "test-project";

  describe("minimal template", () => {
    it("should generate HTML with project name", () => {
      const html = generateMinimalHTML(projectName);
      expect(html).toContain(projectName);
      expect(html).toContain("data-volt");
      expect(html).toContain("voltx.min.js");
    });

    it("should generate CSS", () => {
      const css = generateMinimalCSS();
      expect(css).toContain(".container");
      expect(css).toContain(".counter");
    });

    it("should generate valid package.json", () => {
      const packageJson = generateMinimalPackageJSON(projectName);
      const parsed = JSON.parse(packageJson);
      expect(parsed.name).toBe(projectName);
      expect(parsed.scripts.dev).toBe("voltx dev");
      expect(parsed.scripts.build).toBe("voltx build");
    });

    it("should generate README with project name", () => {
      const readme = generateMinimalREADME(projectName);
      expect(readme).toContain(projectName);
      expect(readme).toContain("pnpm dev");
    });
  });

  describe("styles template", () => {
    it("should generate HTML without VoltX.js framework", () => {
      const html = generateStylesHTML(projectName);
      expect(html).toContain(projectName);
      expect(html).toContain("voltx.min.css");
      expect(html).not.toContain("voltx.min.js");
      expect(html).not.toContain("data-volt");
    });

    it("should generate CSS", () => {
      const css = generateStylesCSS();
      expect(css).toContain(".container");
      expect(css).toContain(".card");
    });

    it("should generate valid package.json", () => {
      const packageJson = generateStylesPackageJSON(projectName);
      const parsed = JSON.parse(packageJson);
      expect(parsed.name).toBe(projectName);
    });

    it("should generate README explaining styles-only approach", () => {
      const readme = generateStylesREADME(projectName);
      expect(readme).toContain(projectName);
      expect(readme).toContain("styles-only");
    });
  });

  describe("router template", () => {
    it("should generate HTML with routing", () => {
      const html = generateRouterHTML(projectName);
      expect(html).toContain(projectName);
      expect(html).toContain("data-volt-navigate");
      expect(html).toContain("data-volt-url");
      expect(html).toContain("navigatePlugin");
    });

    it("should generate CSS with navigation styles", () => {
      const css = generateRouterCSS();
      expect(css).toContain(".nav");
    });

    it("should generate valid package.json", () => {
      const packageJson = generateRouterPackageJSON(projectName);
      const parsed = JSON.parse(packageJson);
      expect(parsed.name).toBe(projectName);
    });

    it("should generate README explaining routing", () => {
      const readme = generateRouterREADME(projectName);
      expect(readme).toContain(projectName);
      expect(readme).toContain("routing");
    });
  });

  describe("plugins template", () => {
    it("should generate HTML with all plugins", () => {
      const html = generatePluginsHTML(projectName);
      expect(html).toContain(projectName);
      expect(html).toContain("persistPlugin");
      expect(html).toContain("scrollPlugin");
      expect(html).toContain("urlPlugin");
      expect(html).toContain("surgePlugin");
      expect(html).toContain("navigatePlugin");
    });

    it("should generate CSS for plugin demos", () => {
      const css = generatePluginsCSS();
      expect(css).toContain(".card");
      expect(css).toContain(".counter");
      expect(css).toContain(".animated-box");
    });

    it("should generate valid package.json", () => {
      const packageJson = generatePluginsPackageJSON(projectName);
      const parsed = JSON.parse(packageJson);
      expect(parsed.name).toBe(projectName);
    });

    it("should generate README listing all plugins", () => {
      const readme = generatePluginsREADME(projectName);
      expect(readme).toContain(projectName);
      expect(readme).toContain("Persist Plugin");
      expect(readme).toContain("Scroll Plugin");
      expect(readme).toContain("URL Plugin");
    });
  });
});
