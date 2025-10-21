import { DefaultTheme, defineConfig } from "vitepress";
import pkg from "../package.json" assert { type: "json" };
import { u } from "./utils";

const repoURL = "https://github.com/stormlightlabs/volt";

/**
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  title: "VoltX.js",
  description: "A reactive, hypermedia framework.",
  base: "/volt/",
  appearance: "dark",
  themeConfig: {
    search: { provider: "local" },
    nav: [
      { text: "Home", link: "/" },
      { text: "Overview", link: "/overview" },
      { text: "CSS", link: "/css/volt-css" },
      {
        text: "Version",
        items: [{ text: pkg.version, link: `${repoURL}/releases/tag/v${pkg.version}` }, {
          text: "Contributing",
          link: `${repoURL}/blob/main/CONTRIBUTING.md`,
        }, { text: "Changelog", link: "${repoURL}/blob/main/README.md" }],
      },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items:
          ([{ text: "Overview", link: "/overview" }, {
            text: "Installation",
            link: "/installation",
          }] as DefaultTheme.SidebarItem[]).concat(...u.scanDir("usage", "/usage")),
      },
      {
        text: "Core Concepts",
        items: [
          { text: "State Management", link: "/state" },
          { text: "Bindings", link: "/bindings" },
          { text: "Expressions", link: "/expressions" },
          { text: "SSR & Lifecycle", link: "/lifecycle" },
          { text: "Animations & Transitions", link: "/animations" },
        ],
      },
      { text: "Tutorials", collapsed: false, items: u.scanDir("usage", "/usage") },
      {
        text: "CSS",
        collapsed: false,
        items: [{ text: "Volt CSS", link: "/css/volt-css" }, { text: "Reference", link: "/css/semantics" }],
        docFooterText: "Auto-generated CSS Docs",
      },
      { text: "Specs", collapsed: true, items: u.scanDir("spec", "/spec") },
      {
        text: "API Reference",
        collapsed: true,
        items: u.scanDir("api", "/api"),
        docFooterText: "Auto-generated API Docs",
      },
      { text: "Internals", collapsed: false, items: u.scanDir("internals", "/internals") },
    ],
    socialLinks: [{ icon: "github", link: repoURL }, {
      icon: "bluesky",
      link: "https://bsky.app/profile/stormlightlabs.org",
    }],
  },
});
