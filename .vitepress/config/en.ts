import type { DefaultTheme, LocaleSpecificConfig } from "vitepress";

export const META_URL = "https://yuanshen.site/docs/en/";
export const META_TITLE = "Genshin Interactive Map";
export const META_TITLE = "Genshin Interactive Map";
export const META_DESCRIPTION =
  "An all-encompassing map for completionists by Kongying Tavern.";

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: META_DESCRIPTION,
  themeConfig: {
    siteTitle: "Genshin Interactive Map | Kongying Tavern",
    outlineTitle: "ON THIS PAGE",
    logo: "/imgs/logo_256.png",
    lastUpdatedText: "Last Updated",
    search: {
      provider: "local",
    },
    socialLinks: [
      { icon: "Github", link: "https://github.com/kongying-tavern/" },
      { icon: "Discord", link: "https://discord.gg/aFe57AKZUF" },
      { icon: "Twitter", link: "https://twitter.com/KongyingTavern" },
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
        text: "Support",
        items: [
          {
            text: "Client User Manual",
            link: "./manual/Map%20Client%20User%20Manual.md",
          },
          {
            text: "Feedback",
            link: "https://support.qq.com/products/321980",
          },
          {
            text: "Vote on New Features",
            link: "https://support.qq.com/products/321980/topic-detail/2016/",
          },
        ],
      },
      {
        text: "Community",
        link: "./community.md",
      },
      {
        text: "Learn More",
        items: [
          {
            text: "About Us",
            items: [
              {
                text: "Join Us",
                link: "./join.md",
              },
              {
                text: "Our Team",
                link: "./team.md",
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
                link: "./credits.md",
              },
              {
                text: "Contributors",
                link: "./contribution.md",
              },
              {
                text: "Sponsors",
                link: "./support-us.md#Sponsor%20Acknowledgements",
              },
            ],
          },
          {
            text: "Legal (Chinese)",
            items: [
              {
                text: "Disclaimer",
                link: "./disclaimer.md",
              },
              {
                text: "Privacy",
                link: "./privacy.md",
              },
              {
                text: "User Agreement",
                link: "./agreement.md",
              },
            ],
          },
        ],
      },
      {
        text: "Support us",
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