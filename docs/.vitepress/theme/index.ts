// https://vitepress.dev/guide/custom-theme
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  // https://vitepress.dev/guide/extending-default-theme#layout-slots
  Layout: () => {
    return h(DefaultTheme.Layout, null, {});
  },
  enhanceApp({ app, router, siteData }) {},
} satisfies Theme;
