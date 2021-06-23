import { defineClientAppEnhance } from "@vuepress/client";
import { usePageData } from "@vuepress/client";
import type { PageData } from "@vuepress/client";
import { log } from "./utils";
import ElementPlus from "element-plus";
import "./utils/date";
import locale from "element-plus/lib/locale/lang/zh-cn";
import "./styles/element-variables.scss";

export default defineClientAppEnhance(async ({ app, router, siteData }) => {
  app.use(ElementPlus, { locale });
  log("原神地图", "Docs", [
    {
      VuePressCore: globalThis.__VERSION__,
      VueVersion: app.version,
      isDEV: globalThis.__DEV__,
      isSSR: globalThis.__SSR__,
    },
  ]);
  console.log(
    "🎉\u0020%c地图团队欢迎各位同学加入: https://yuanshen.site/docs/join.html",
    "font-size:13px;"
  );
  // gtag("get", "<target>", "<field_name>", (val) => console.log(val));
  console.log(app, router, siteData);
});
