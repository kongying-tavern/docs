import type { DefaultTheme, LocaleSpecificConfig } from "vitepress";

export const META_URL = "https://yuanshen.site/docs/ja/";
export const META_TITLE = "Genshin Map";
export const META_DESCRIPTION = "空荧酒馆制作的原神全资源攻略地图。";

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: META_DESCRIPTION,
  head: [
    ["meta", { property: "og:url", content: META_URL }],
    ["meta", { property: "og:description", content: META_DESCRIPTION }],
    ["meta", { property: "twitter:url", content: META_URL }],
    ["meta", { property: "twitter:title", content: META_TITLE }],
    ["meta", { property: "twitter:description", content: META_DESCRIPTION }],
  ],

  themeConfig: {
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
        items: [
          {
            text: "一次性赞助",
            link: "./support-us.md",
          },
          {
            text: "周期性赞助",
            link: "./support-us.md#%E5%91%A8%E6%9C%9F%E6%80%A7%E8%B5%9E%E5%8A%A9",
          },
        ],
      },
    ],
  },
};
