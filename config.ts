/* eslint-disable @typescript-eslint/naming-convention */
export default {
  host: process.env.DOCS_HOST || "https://yuanshen.site",
  root_path: process.env.DOCS_PATH || "/docs/",
  path_ja: process.env.DOCS_PATH_JA || "/docs/ja/",
  path_en: process.env.DOCS_PATH_EN || "/docs/en/",
  logo: process.env.DOCS_LOGO || "logo.jpg",
  repo: process.env.DOCS_REPO || "https://gitee.com/KYJGYSDT/",
  repo_docs:
    process.env.DOCS_REPO_DOCS || "https://github.com/jiazengp/genshinmap-docs",
  cover:
    process.env.DOCS_COVER || "https://yuanshen.site/tiles_test/4/ppp10_9.jpg",
  cover_en:
    process.env.DOCS_COVER_EN ||
    "https://yuanshen.site/tiles_test/4/ppp10_9.jpg",
  cover_ja:
    process.env.DOCS_COVER_JA ||
    "https://yuanshen.site/tiles_test/4/ppp10_9.jpg",
  mask_icon: process.env.MASK_ICON || "20210609/safari-pinned-tab.svg",
  apple_touch_icon:
    process.env.APP_TOUCH_ICON || "https://yuanshen.site/v3/paimon_off@192.png",
  themeColor: process.env.DOCS_THEME_COLOR || "#ffffff",
  site_name: process.env.DOCS_SITE_NAME || "原神地图",
  site_name_en: process.env.DOCS_SITE_NAME_EN || "Genshin Map",
  site_name_ja: process.env.DOCS_SITE_NAME_JA || "原神地図",
  description:
    process.env.DOCS_DEFAULT_DESCRIPTION ||
    "米游社空荧酒馆制作的原神全资源攻略地图。",
  description_en:
    process.env.DOCS_DEFAULT_DESCRIPTION_EN ||
    "The interactive map of Genshin full resources strategy made by Kongying Tavern.",
  description_ja:
    process.env.DOCS_DEFAULT_DESCRIPTION_JA ||
    "「米游社空荧酒馆」が作成した原神全資源攻略マップ",
  favicon: process.env.DOCS_FAVICON || "https://yuanshen.site/favicon.ico",
  defaultRenderer: process.env.DEFAULT_RENDERER || "webkit",
  type: process.env.TYPE || "application",
  analytics_id: process.env.ANALYTICS_ID || "G-Q2K9DXZCEY",
  author: process.env.AUTHOR || "(^_^)",
  restrictions: process.env.RESTRICTIONS || "9+",
  twitterID: process.env.TWITTER_ID || "",
  pubid: process.env.PUBID || "ra-60c0af58a5d11388",
};
