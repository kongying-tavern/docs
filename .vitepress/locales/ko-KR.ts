import fs from "./types";
import path from 'path';
import { baseHelper } from '../theme/utils';
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress';
import type { CustomConfig } from './types';
export const META_URL = 'https://yuanshen.site/docs/';
export const META_TITLE = "Genshin Interactive Map";
export const META_DESCRIPTION = "A Genshin interactive map by Kongying Tavern for completionists";
export const META_KEYWORDS = "Genshin Interactive Map, Genshin Map, Kongying Tavern, yuanshenmap, Genshin Impact Map, Kongying Map";
export const META_IMAGE = 'https://yuanshen.site/docs/imgs/cover.jpg';
export const LOCAL_CODE = "ko-KR";
export const LOCAL_BASE = '';
export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config & CustomConfig> = {
  description: META_DESCRIPTION,
  titleTemplate: '空荧酒馆',
  head: [['meta', {
    name: 'keywords',
    content: META_KEYWORDS
  }], ['meta', {
    property: 'og:url',
    content: META_URL
  }], ['meta', {
    property: 'og:description',
    content: META_DESCRIPTION
  }], ['meta', {
    property: 'twitter:url',
    content: META_URL
  }], ['meta', {
    property: 'twitter:title',
    content: META_TITLE
  }], ['meta', {
    property: 'og:site_name',
    content: META_TITLE
  }], ['meta', {
    property: 'twitter:description',
    content: META_DESCRIPTION
  }], ['meta', {
    property: 'og:locale',
    content: LOCAL_CODE
  }], ['meta', {
    property: 'og:image',
    content: META_IMAGE
  }], ['meta', {
    property: 'og:image',
    content: META_IMAGE
  }], ['meta', {
    name: 'twitter:image',
    content: META_IMAGE
  }]],
  themeConfig: {
    siteTitle: '原神地图',
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
        svg: fs.readFileSync(path.resolve(__dirname, '../../src/public/svg/qq-fill.svg'), 'utf8')
      },
      link: 'https://pd.qq.com/s/f006fek0f'
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
      pattern: 'https://github.com/kongying-tavern/docs/edit/next/src/:path',
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
        text: "Credits",
        link: "/credits"
      }, {
        text: "Contributors",
        link: "/contribution"
      }, {
        text: "Sponsors",
        link: "/support-us#Sponsor%20Acknowledgements"
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