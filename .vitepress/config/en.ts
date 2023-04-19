import type { DefaultTheme, LocaleSpecificConfig } from "vitepress";

export const META_URL = "https://yuanshen.site/docs/en/";
export const META_TITLE = "Genshin Map";
export const META_DESCRIPTION =
  "空荧酒馆制作的原神全资源攻略地图。";

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: META_DESCRIPTION,
  themeConfig: {
    siteTitle: "Genshin Interactive Map | Kongying Tavern",
    outlineTitle: "ON THIS PAGE",
    logo: "/imgs/logo_256.png",
    lastUpdatedText: "更新日期",
    search: {
      provider: "local",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/kongying-tavern/" },
      { icon: "discord", link: "https://discord.gg/aFe57AKZUF" },
      { icon: "twitter", link: "https://twitter.com/KongyingTavern" },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, "../../src/public/svg/qq-fill.svg"),
            "utf8"
          ),
        },
        link: "https://qm.qq.com/cgi-bin/qm/qr?k=qDLY3l2-A_zf2AW73X5S5PHuHcjicVbf&jump_from=webapi",
      },
    ],

    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },
    editLink: {
      pattern: "https://github.com/kongying-tavern/docs/edit/src/:path",
      text: "Suggest changes to this page",
    },

    nav: [
      {
        text: "帮助和反馈",
        items: [
          {
            text: "客户端使用手册",
            link: "https://support.qq.com/products/321980/faqs-more/?id=94938",
          },
          {
            text: "问题反馈",
            link: "https://support.qq.com/products/321980",
          },
          {
            text: "功能介绍",
            link: "https://support.qq.com/products/321980/faqs-more/?id=126362",
          },
          {
            text: "功能投票",
            link: "https://support.qq.com/products/321980/topic-detail/2016/",
          },
        ],
      },
      {
        text: "加入社区",
        link: "./community.md",
      },
      {
        text: "了解更多",
        items: [
          {
            text: "了解我们",
            items: [
              {
                text: "加入我们",
                link: "./join.md",
              },
              {
                text: "了解团队",
                link: "./team.md",
              },
            ],
          },
          {
            text: "更新日志",
            items: [
              {
                text: "网页端",
                link: "https://support.qq.com/products/321980/blog/505810",
              },
              {
                text: "客户端",
                link: "https://support.qq.com/products/321980/blog/772498",
              },
            ],
          },
          {
            text: "鸣谢",
            items: [
              {
                text: "技术鸣谢",
                link: "./credits.md",
              },
              {
                text: "贡献鸣谢",
                link: "./contribution.md",
              },
              {
                text: "赞助鸣谢",
                link: "./support-us.md#赞助鸣谢",
              },
            ],
          },
          {
            text: "法律相关",
            items: [
              {
                text: "免责声明",
                link: "./disclaimer.md",
              },
              {
                text: "隐私政策",
                link: "./privacy.md",
              },
              {
                text: "用户协议",
                link: "./agreement.md",
              },
            ],
          },
        ],
      },
      {
        text: "支持我们",
        link: "./support-us.md",
      },
    ],
  },
  head: [
    ["meta", { property: "og:url", content: META_URL }],
    ["meta", { property: "og:description", content: META_DESCRIPTION }],
    ["meta", { property: "twitter:url", content: META_URL }],
    ["meta", { property: "twitter:title", content: META_TITLE }],
    ["meta", { property: "twitter:description", content: META_DESCRIPTION }],
  ],
};