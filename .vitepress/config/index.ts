import path from "path";
import fs from "fs";
import Unocss from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Inspect from "vite-plugin-inspect";
import { defineConfig } from "vitepress";
import { enConfig } from "./config/en";
import { sharedConfig } from "./config/shared";
import { zhConfig } from "./config/zh";
import { jaConfig } from "./config/ja";

const base = (process.env.BASE || "/docs/") as "/docs/" | `/${string}/`;
const isProd = process.env.NODE_ENV === "production";
const commitRef = process.env.COMMIT_REF?.slice(0, 8) || "dev";

export default defineConfig({
  base: base,
  lastUpdated: true,
  srcDir: "src",
  srcExclude: [],
  scrollOffset: "header",
  cleanUrls: true,
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      ...sharedConfig,
    },
    en: {
      label: "English",
      lang: "fr",
      link: "/en/",
      ...enConfig,
    },
    ja: {
      label: "日本語",
      lang: "ja",
      link: "/ja/",
      ...jaConfig,
    },
  },
  vue: {
    reactivityTransform: true,
  },
  ignoreDeadLinks: [
    // ignore exact url "/playground"
    "/playground",
    // ignore all localhost links
    /^https?:\/\/localhost/,
    // ignore all links include "/repl/""
    /\/repl\//,
    // custom function, ignore all links include "ignore"
    (url) => {
      return url.toLowerCase().includes("ignore");
    },
  ],
  head: [
    ["meta", { name: "theme-color", content: "#ffffff" }],
    [
      "link",
      {
        rel: "icon",
        href: "./imgs/favicon-32x32.png",
        type: "image/png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        href: "./imgs/favicon.ico",
        type: "image/x-icon",
      },
    ],
    ["meta", { name: "author", content: "@Arrebol" }],
    ["meta", { property: "og:title", content: "原神地图" }],
    [
      "meta",
      { property: "og:image", content: "https://yuanshen.site/imgs/cover.jpg" },
    ],
    [
      "meta",
      {
        property: "og:description",
        content: "空荧酒馆制作的原神全资源攻略地图。",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:creator", content: "@KongyingTavern" }],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://yuanshen.site/imgs/cover.jpg",
      },
    ],
    [
      "meta",
      {
        name: "viewport",
        content:
          "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover",
      },
    ],
  ],
  vite: {
    // define: {
    //   __DATE__: `'${new Date().toISOString()}'`,
    //   __COMMIT_REF__: commitRef,
    //   __ISPROD__: isProd
    // },
    server: {
      host: true,
      fs: {
        allow: ["../.."],
      },
    },
    plugins: [
      // https://github.com/antfu/unocss
      Unocss(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        imports: ["vue", "@vueuse/core"],
        dts: "./auto-imports.d.ts",
        vueTemplate: true,
      }),

      Inspect(),
    ],
    build: {
      minify: "terser",
      chunkSizeWarningLimit: Infinity,
    },
    json: {
      stringify: true,
    },
  },
});
