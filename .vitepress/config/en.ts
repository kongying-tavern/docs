import fs from "fs";
import path from "path";

import type { DefaultTheme, LocaleSpecificConfig } from "vitepress";
import type { CustomConfig } from "./types";

const base = process.env.BASE || "/docs/";
export const META_URL = "https://yuanshen.site/docs/en/";
export const META_TITLE = "Genshin Interactive Map";
export const META_KEYWORDS =
  "Genshin Interactive Map, Genshin Map, Kongying Tavern, yuanshenmap, Genshin Impact Map, Kongying Map";
export const META_DESCRIPTION =
  "A Genshin interactive map by Kongying Tavern for completionists";

export const enConfig: LocaleSpecificConfig<
  DefaultTheme.Config & CustomConfig
> = {
  description: META_DESCRIPTION,
  themeConfig: {
    siteTitle: "Genshin Interactive Map",
    outlineTitle: "On This Page",
    logo: "/imgs/logo_256.png",
    lastUpdatedText: "Last updated",
    socialLinks: [
      { icon: "github", link: "https://github.com/kongying-tavern" },
      
      { icon: "discord", link: "https://discord.gg/aFe57AKZUF" },
      { icon: "twitter", link: "https://twitter.com/KongyingTavern" },
    ],

    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },
    editLink: {
      pattern: "https://github.com/kongying-tavern/docs/edit/next/src/:path",
      text: "Suggest changes to this page",
    },
    payment: {
      wechatpay: {
        name: "WeChat Pay",
        address: "wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp",
      },
      alipay: {
        name: "Alipay",
        address: "https://qr.alipay.com/tsx11609thmpw9odmvdlxd6",
      },
      qqpay: {
        name: "QQ Pay",
        address:
          "https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet",
      },
      paypal: {
        name: "Paypal",
        address: "https://www.paypal.com/paypalme/yuanshenditu",
      },
      bilibili: {
        name: "bilibili",
        address: "https://space.bilibili.com/518076785",
      },
    },
    nav: [
      {
        text: "Download",
        link: "en/download-client.md",
      },
      {
        text: "Support us",
        link: "en/support-us.md",
      },
      {
        text: "Community",
        link: "en/community.md",
      },
      {
        text: "Support",
        items: [
          {
            text: "Client User Manual",
            link: "en/manual/client-user-manual.md",
          },
          {
            text: "Feedback",
            link: "https://support.qq.com/products/321980",
          },
          {
            text: "New Features",
            link: "https://support.qq.com/products/321980/topic-detail/2016/",
          },
        ],
      },
      {
        text: "About",
        items: [
          {
            text: "About Us",
            items: [
              {
                text: "Join Us",
                link: "en/join.md",
              },
              {
                text: "Our Team",
                link: "en/team.md",
              },
            ],
          },
          {
            text: "Update Log",
            items: [
              {
                text: "Web",
                link: "https://support.qq.com/products/321980/blog/505810",
              },
              {
                text: "Client",
                link: "https://discord.gg/SWz6RTWNkm",
              },
            ],
          },
          {
            text: "Acknowledgement",
            items: [
              {
                text: "Credits",
                link: "en/credits.md",
              },
              {
                text: "Contributors",
                link: "en/contribution.md",
              },
              {
                text: "Sponsors",
                link: "en/support-us.md#Sponsor%20Acknowledgements",
              },
            ],
          },
          {
            text: "Legal (Chinese)",
            items: [
              {
                text: "Disclaimer",
                link: "en/disclaimer.md",
              },
              {
                text: "Privacy",
                link: "en/privacy.md",
              },
              {
                text: "Agreement",
                link: "en/agreement.md",
              },
            ],
          },
        ],
      },
    ],
    sidebar: {
      "en/manual": [
        {
          text: "Table of Contents",
          link: "en/manual/client-user-manual",
        },
        {
          text: "Guides",
          items: [
            {
              text: "Automatic Tracking",
              items: [
                {
                  text: "Introduction",
                  link: "en/manual/guide/auto-tracking/importantnotes",
                },
                {
                  text: "Troubleshooting",
                  link: "en/manual/guide/auto-tracking/troubleshoot",
                },
              ],
            },
            {
              text: "Framerate/Tracking Control",
              link: "en/manual/guide/bg/bgfrate",
            },
            {
              text: "Batch Selection",
              link: "en/manual/guide/batch-selection/instructions",
            },
            {
              text: "Canvas Guide",
              link: "en/manual/guide/canvas/guide",
            },
            {
              text: "Easter Egg",
              link: "en/manual/guide/easter-egg/view",
            },
            {
              text: "Hide/Show Markers",
              link: "en/manual/guide/hide-show-done/hidedoneshowdone",
            },
            {
              text: "Overlay Mode",
              items: [
                {
                  text: "Instructions",
                  link: "en/manual/guide/overlay-mode/instructions",
                },
                {
                  text: "Windowed Fullscreen",
                  link: "en/manual/guide/overlay-mode/fullscreen-windowed/launching",
                },
              ],
            },
            {
              text: "Restore/Recover Progress",
              link: "en/manual/guide/restore-recover/progress",
            },
          ],
        },
        {
          text: "FAQ",
          items: [
            {
              text: "Account safety",
              link: "en/manual/faq/accountsafety/acntban.md",
            },
            {
              text: "Auto Update",
              link: "en/manual/faq/autoupdate/updater.md",
            },
            {
              text: "Installation Error",
              items: [
                {
                  text: "Code 2503",
                  link: "en/manual/faq/instlerror/code2503.md",
                },
                {
                  text: "Missing .dll file",
                  link: "en/manual/faq/instlerror/missingdll.md",
                },
              ],
            },
            {
              text: "Launch Error",
              items: [
                {
                  text: "Stuck/No Progress",
                  link: "en/manual/faq/launcherror/emptydialog.md",
                },
                {
                  text: "Version Check Failed",
                  link: "en/manual/faq/launcherror/versioncheck.md",
                },
              ],
            },
            {
              text: "About Login",
              items: [
                {
                  text: "Login Problems",
                  link: "en/manual/faq/login/accountlogin.md",
                },
                {
                  text: "Repeated Login Requests",
                  link: "en/manual/faq/login/clientrepeatedly.md",
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      qrcodeTitle: "Discord Server",
      qrcodeMessage: "Contact us on discord",
      qrcodeLink: "https://discord.gg/aFe57AKZUF",
      navigation: [
        {
          title: "About",
          items: [
            {
              text: "Join Us",
              link: "en/join",
            },
            {
              text: "Our team",
              link: "en/team",
            },
            {
              text: "Sponsors",
              link: "en/support-us",
            },
          ],
        },
        {
          title: "Legal (Chinese)",
          items: [
            {
              text: "Disclaimer",
              link: "en/disclaimer",
            },
            {
              text: "Privacy",
              link: "en/privacy",
            },
            {
              text: "Agreement",
              link: "en/agreement",
            },
          ],
        },
        {
          title: "Support",
          items: [
            {
              text: "Client User Manual",
              link: "en/manual/client-user-manual",
            },
            {
              text: "Feedback",
              link: "https://support.qq.com/products/321980",
            },
            {
              text: "New Features",
              link: "https://support.qq.com/products/321980/topic-detail/2016/",
            },
          ],
        },
      ],
    },
  },
  head: [
    ["meta", { name: "keywords", content: META_KEYWORDS }],
    ["meta", { property: "og:url", content: META_URL }],
    ["meta", { property: "og:description", content: META_DESCRIPTION }],
    ["meta", { property: "twitter:url", content: META_URL }],
    ["meta", { property: "twitter:title", content: META_TITLE }],
    ["meta", { property: "twitter:description", content: META_DESCRIPTION }],
    ["meta", { property: "og:site_name", content: META_TITLE }],
    ["meta", { property: "og:locale", content: "en-US" }],
    ["meta", { property: "og:image", content: `${base}/imgs/cover.jpg` }],
    [
      "meta",
      {
        name: "twitter:image",
        content: `${base}/imgs/cover.jpg`,
      },
    ],
  ],
};
