import { baseHelper } from '../theme/utils';
import { socialList } from '../theme/composables/socialList';
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress';
import type { CustomConfig } from './types';
import { title } from 'process';
export const META_URL = 'https://yuanshen.site/docs/';
export const META_TITLE = "Genshin Interactive Map";
export const META_DESCRIPTION = "A Genshin interactive map by Kongying Tavern for completionists";
export const META_KEYWORDS = "Genshin Interactive Map, Genshin Map, Kongying Tavern, yuanshenmap, Genshin Impact Map, Kongying Map";
export const META_IMAGE = 'https://yuanshen.site/docs/imgs/cover.jpg';
export const LOCAL_CODE = "ko-KR";
export const LOCAL_BASE = '';
export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config & CustomConfig> = {
  titleTemplate: '空荧酒馆',
  description: META_DESCRIPTION,
  head: [['meta', {
    property: 'og:site_name',
    content: META_TITLE
  }], ['meta', {
    property: 'og:locale',
    content: LOCAL_CODE
  }]],
  themeConfig: {
    siteTitle: '原神地图',
    keyword: META_KEYWORDS,
    description: META_DESCRIPTION,
    image: META_IMAGE,
    outlineTitle: '本页目录',
    logo: '/imgs/logo_256.png',
    lastUpdatedText: '更新日期',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '更改语言',
    notFound: {
      title: '这个页面找不到了',
      quote: '可能跟温迪一起出游了吧',
      linkLabel: '回到首页'
    },
    staff: {
      title: 'Staff',
      desc: '空荧酒馆『原神地图』项目参与制作',
      communityStaff: {
        title: '社区运营'
      },
      clientStaff: {
        title: '客户端开发'
      },
      webStaff: {
        title: '网页端开发'
      },
      translateStaff: {
        title: '本地化翻译'
      },
      pinStaff: {
        title: '地图点位标记'
      }
    },
    team: {
      title: '关于团队',
      desc: '地图的背后是一个基本来自中国的团队，以下是部分成员的个人信息。',
      coreMember: {
        title: '核心团队成员',
        desc: '核心团队成员是那些积极长期参与维护一个或多个核心项目的人。 他们对空荧酒馆的生态系统做出了重大贡献。'
      },
      emeritiMember: {
        title: '名誉核心团队',
        desc: '我们在此致敬过去曾做出过突出贡献的不再活跃的团队成员。'
      },
      partnerMember: {
        title: '社区伙伴',
        desc: '我们与这些主要合作伙伴建立了更加亲密的关系，经常与他们就即将到来的功能展开合作。'
      }
    },
    socialLinks: [{
      icon: 'github',
      link: 'https://github.com/kongying-tavern/'
    }, {
      icon: 'discord',
      link: 'https://discord.gg/aFe57AKZUF'
    }, {
      icon: 'twitter',
      link: 'https://twitter.com/KongyingTavern'
    }, {
      icon: {
        svg: socialList.bilibili.icon
      },
      link: 'https://space.bilibili.com/518076785',
      ariaLabel: 'bilibili'
    }],
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    payment: {
      wechatpay: {
        name: '微信支付',
        address: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp'
      },
      alipay: {
        name: '支付宝',
        address: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6'
      },
      qqpay: {
        name: 'QQ 支付',
        address: 'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet'
      },
      paypal: {
        name: 'Paypal',
        address: 'https://www.paypal.com/paypalme/yuanshenditu'
      },
      bilibili: {
        name: 'bilibili',
        address: 'https://space.bilibili.com/518076785'
      }
    },
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/main/src/:path',
      text: '报告错误'
    },
    sidebar: baseHelper(sidebar(), LOCAL_BASE),
    footer: baseHelper(footer(), LOCAL_BASE),
    nav: baseHelper(nav(), LOCAL_BASE)
  }
};

function nav(): DefaultTheme.NavItem[] {
  return [{
    text: "Download",
    link: "/download-client"
  }, {
    text: "Support us",
    link: "/support-us"
  }, {
    text: "Community",
    link: "/community"
  }, {
    text: "Support",
    activeMatch: `^/manual/`,
    items: [{
      text: "Client User Manual",
      link: "/manual/client-user-manual"
    }, {
      text: "Feedback",
      link: 'https://support.qq.com/products/321980'
    }, {
      text: "New Features",
      link: "https://support.qq.com/products/321980/topic-detail/2016/"
    }, {
      text: '功能投票',
      link: 'https://support.qq.com/products/321980/topic-detail/2016/'
    }]
  }, {
    text: "About",
    items: [{
      text: "About Us",
      items: [{
        text: "Join Us",
        link: "/join"
      }, {
        text: "Our Team",
        link: "/team"
      }]
    }, {
      text: "Update Log",
      items: [{
        text: "Web",
        link: 'https://support.qq.com/products/321980/blog/505810'
      }, {
        text: "Client",
        link: "https://discord.gg/SWz6RTWNkm"
      }]
    }, {
      text: "Acknowledgement",
      items: [{
        text: '制作人员',
        link: '/staff.md'
      }, {
        text: '赞助鸣谢',
        link: '/support-us.md#赞助鸣谢'
      }, {
        text: '技术鸣谢',
        link: '/credits.md'
      }]
    }, {
      text: "Legal (Chinese)",
      items: [{
        text: "Disclaimer",
        link: "/disclaimer"
      }, {
        text: "Privacy",
        link: "/privacy"
      }, {
        text: "Agreement",
        link: "/agreement"
      }]
    }, {
      text: '其他',
      items: [{
        text: '友情链接',
        link: '/friends-links.md'
      }]
    }]
  }];
}

function footer(): CustomConfig['footer'] {
  return {
    qrcodeTitle: "Discord Server",
    qrcodeMessage: "Contact us on discord",
    qrcodeLink: "https://discord.gg/aFe57AKZUF",
    navigation: [{
      title: "About",
      items: [{
        text: "Join Us",
        link: '/join'
      }, {
        text: "Our team",
        link: "/team"
      }, {
        text: "Sponsors",
        link: "/support-us"
      }]
    }, {
      title: "Legal (Chinese)",
      items: [{
        text: "Disclaimer",
        link: '/disclaimer'
      }, {
        text: "Privacy",
        link: '/privacy'
      }, {
        text: "Agreement",
        link: '/agreement'
      }]
    }, {
      title: "Support",
      items: [{
        text: "Client User Manual",
        link: "/manual/client-user-manual"
      }, {
        text: "Feedback",
        link: "https://support.qq.com/products/321980"
      }, {
        text: "New Features",
        link: "https://support.qq.com/products/321980/topic-detail/2016/"
      }]
    }]
  };
}

function sidebar(): DefaultTheme.SidebarItem[] {
  return {
    // @ts-ignore
    '/manual': [{
      text: "Table of Contents",
      link: "/manual/client-user-manual"
    }, {
      text: "Guides",
      collapsed: false,
      items: [{
        text: "Automatic Tracking",
        items: [{
          text: "Introduction",
          link: "/manual/guide/auto-tracking/importantnotes"
        }, {
          text: "Troubleshooting",
          link: "/manual/guide/auto-tracking/troubleshoot"
        }]
      }, {
        text: "Framerate/Tracking Control",
        link: "/manual/guide/bg/bgfrate"
      }, {
        text: "Multi Mark",
        link: "/manual/guide/batch-selection/instructions"
      }, {
        text: "Canvas Guide",
        link: "/manual/guide/canvas/guide"
      }, {
        text: "Easter Egg",
        link: "/manual/guide/easter-egg/view"
      }, {
        text: "Hide/Show Found",
        link: "/manual/guide/hide-show-done/hidedoneshowdone"
      }, {
        text: "Overlay Mode",
        items: [{
          text: "Instructions",
          link: "/manual/guide/overlay-mode/instructions"
        }, {
          text: "Windowed Fullscreen",
          link: "/manual/guide/overlay-mode/fullscreen-windowed/launching"
        }]
      }, {
        text: "Restore/Recover Progress",
        link: "/manual/guide/restore-recover/progress"
      }]
    }, {
      text: "FAQ",
      collapsed: false,
      items: [{
        text: "Account safety",
        link: "/manual/faq/accountsafety/acntban"
      }, {
        text: "Auto Update",
        link: "/manual/faq/autoupdate/updater"
      }, {
        text: "Installation Error",
        items: [{
          text: "Code 2503",
          link: "/manual/faq/instlerror/code2503"
        }, {
          text: "Missing .dll file",
          link: "/manual/faq/instlerror/missingdll"
        }]
      }, {
        text: "Launch Error",
        items: [{
          text: "Stuck/No Progress",
          link: "/manual/faq/launcherror/emptydialog"
        }, {
          text: "Version Check Failed",
          link: "/manual/faq/launcherror/versioncheck"
        }]
      }, {
        text: "About Login",
        items: [{
          text: "Login Problems",
          link: "/manual/faq/login/accountlogin"
        }, {
          text: "Repeated Login Requests",
          link: "/manual/faq/login/clientrepeatedly"
        }]
      }]
    }]
  };
}