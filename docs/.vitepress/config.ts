import { defineConfig } from "vitepress";
import { u } from "./utils";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Volt.js",
  description: "A reactive, hypermedia framework.",
  appearance: "dark",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Overview", link: "/overview" },
      { text: "CSS", link: "/css/volt-css" },
      { text: "API", link: "/api" },
    ],
    sidebar: [
      { text: "Getting Started", items: [{ text: "Overview", link: "/overview" }] },
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
