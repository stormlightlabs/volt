import { defineConfig } from "vitepress";

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
      { text: "API", link: "/api-examples" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [{ text: "Introduction", link: "/" }, { text: "Overview", link: "/overview" }],
      },
      {
        text: "CSS",
        collapsed: false,
        items: [{ text: "Volt CSS", link: "/css/volt-css" }, { text: "CSS Reference", link: "/css/semantics" }],
      },
      { text: "API Reference", collapsed: false, items: [{ text: "Runtime API", link: "/api-examples" }] },
      { text: "Plugin System", collapsed: false, items: [{ text: "Plugin Spec", link: "/plugin-spec" }] },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/stormlightlabs/volt" }],
  },
});
