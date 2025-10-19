import { defineConfig } from "vitepress";
import { u } from "./utils";

/**
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  title: "Volt.js",
  description: "A reactive, hypermedia framework.",
  appearance: "dark",
  themeConfig: {
    nav: [{ text: "Home", link: "/" }, { text: "Overview", link: "/overview" }, { text: "CSS", link: "/css/volt-css" }],
    sidebar: [
      { text: "Getting Started", items: [{ text: "Overview", link: "/overview" }] },
      { text: "Concepts", items: [{ text: "Lifecycle", link: "/lifecycle" }] },
      { text: "Expressions", items: [{ text: "Expressions", link: "/expressions" }] },
      {
        text: "CSS",
        collapsed: false,
        items: [{ text: "Volt CSS", link: "/css/volt-css" }, { text: "Reference", link: "/css/semantics" }],
      },
      { text: "Specs", collapsed: true, items: u.scanDir("spec", "/spec") },
      { text: "API Reference", collapsed: true, items: u.scanDir("api", "/api") },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/stormlightlabs/volt" }],
  },
});
