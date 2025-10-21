import { defineConfig } from "vitepress";
import { u } from "./utils";

/**
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  title: "VoltX.js",
  description: "A reactive, hypermedia framework.",
  base: "/volt/",
  appearance: "dark",
  themeConfig: {
    nav: [{ text: "Home", link: "/" }, { text: "Overview", link: "/overview" }, { text: "CSS", link: "/css/volt-css" }],
    sidebar: [
      {
        text: "Getting Started",
        items: [{ text: "Overview", link: "/overview" }, { text: "Installation", link: "/installation" }],
      },
      {
        text: "Core Concepts",
        items: [{ text: "State Management", link: "/state" }, { text: "Bindings", link: "/bindings" }, {
          text: "Expressions",
          link: "/expressions",
        }, { text: "SSR & Lifecycle", link: "/lifecycle" }],
      },
      { text: "Tutorials", items: [{ text: "Counter", link: "/usage/counter" }] },
      {
        text: "CSS",
        collapsed: false,
        items: [{ text: "Volt CSS", link: "/css/volt-css" }, { text: "Reference", link: "/css/semantics" }],
      },
      { text: "Specs", collapsed: true, items: u.scanDir("spec", "/spec") },
      {
        text: "API Reference",
        collapsed: true,
        items: u.scanDir("api", "/api"),
        docFooterText: "Auto-generated API Docs",
      },
      {
        text: "Internals",
        collapsed: false,
        items: u.scanDir("internals", "/internals"),
        docFooterText: "Auto-generated CSS Docs",
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/stormlightlabs/volt" }],
  },
});
