import { baseHelper } from '../theme/utils';
import { socialList } from '../theme/composables/socialList';
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress';
import type { CustomConfig } from './types';
export const META_URL = 'https://yuanshen.site/docs/';
export const META_TITLE = "Genshin Interactive Map";
export const META_DESCRIPTION = "A Genshin interactive map by Kongying Tavern for completionists";
export const META_KEYWORDS = "Genshin Interactive Map, Genshin Map, Kongying Tavern, yuanshenmap, Genshin Impact Map, Kongying Map";
export const META_IMAGE = 'https://yuanshen.site/docs/imgs/cover.jpg';
export const LOCAL_CODE = "fr";
export const LOCAL_BASE = '';
export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config & CustomConfig> = {
  titleTemplate: '空荧酒馆',
  description: '123123',
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
        desc: '我们与这些主要合作伙伴建立了更加亲密的关系，经常与他们就即将到来的功能和新闻展开协作。'
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
    text: "Télécharger",
    link: '/download-client.md'
  }, {
    text: "Soutenez-nous",
    link: "/support-us.md"
  }, {
    text: "Communauté",
    link: "/community.md"
  }, {
    text: "Support",
    activeMatch: `^/manual/`,
    items: [{
      text: "Manuel d'utilisation du client",
      link: 'manual/client-user-manual'
    }, {
      text: "Retour d'expérience",
      link: 'https://support.qq.com/products/321980'
    }, {
      text: "Nouvelles fonctionnalités",
      link: "https://support.qq.com/products/321980/topic-detail/2016/"
    }, {
      text: '功能投票',
      link: 'https://support.qq.com/products/321980/topic-detail/2016/'
    }]
  }, {
    text: "À propos",
    items: [{
      text: "À propos de nous",
      items: [{
        text: "Rejoignez-nous",
        link: '/join.md'
      }, {
        text: "Notre équipe",
        link: '/team.md'
      }]
    }, {
      text: "Journal des mises à jour",
      items: [{
        text: "Web",
        link: 'https://support.qq.com/products/321980/blog/505810'
      }, {
        text: "Client",
        link: "https://discord.gg/SWz6RTWNkm"
      }]
    }, {
      text: "Remerciements",
      items: [{
        text: "Crédits",
        link: '/credits.md'
      }, {
        text: "Contributeurs",
        link: '/contribution.md'
      }, {
        text: "Sponsors",
        link: "/support-us.md#Sponsor%20Acknowledgements"
      }]
    }, {
      text: "Mentions légales (chinois)",
      items: [{
        text: "Clause de non-responsabilité",
        link: '/disclaimer.md'
      }, {
        text: "Confidentialité",
        link: '/privacy.md'
      }, {
        text: "Accord",
        link: '/agreement.md'
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
    qrcodeTitle: "Serveur Discord",
    qrcodeMessage: "Contactez-nous sur Discord",
    qrcodeLink: "https://discord.gg/aFe57AKZUF",
    navigation: [{
      title: "À propos",
      items: [{
        text: "Rejoignez-nous",
        link: '/join'
      }, {
        text: "Notre équipe",
        link: "/team"
      }, {
        text: "Sponsors",
        link: "/support-us"
      }]
    }, {
      title: "Mentions légales (chinois)",
      items: [{
        text: "Clause de non-responsabilité",
        link: '/disclaimer'
      }, {
        text: "Confidentialité",
        link: '/privacy'
      }, {
        text: "Accord",
        link: '/agreement'
      }]
    }, {
      title: "Support",
      items: [{
        text: "Manuel d'utilisation du client",
        link: 'manual/client-user-manual'
      }, {
        text: "Retour d'expérience",
        link: "https://support.qq.com/products/321980"
      }, {
        text: "Nouvelles fonctionnalités",
        link: "https://support.qq.com/products/321980/topic-detail/2016/"
      }]
    }]
  };
}

function sidebar(): DefaultTheme.SidebarItem[] {
  return {
    // @ts-ignore
    '/manual': [{
      text: "Table des matières",
      link: "/manual/client-user-manual"
    }, {
      text: "Guides",
      collapsed: false,
      items: [{
        text: "Suivi automatique",
        items: [{
          text: "Introduction",
          link: "/manual/guide/auto-tracking/importantnotes"
        }, {
          text: "Résolution des problèmes",
          link: "/manual/guide/auto-tracking/troubleshoot"
        }]
      }, {
        text: "Contrôle de la fréquence d'images/du suivi",
        link: "/manual/guide/bg/bgfrate"
      }, {
        text: "Marquage multiple",
        link: "/manual/guide/batch-selection/instructions"
      }, {
        text: "Guide du canvas",
        link: "/manual/guide/canvas/guide"
      }, {
        text: "Easter Egg",
        link: "/manual/guide/easter-egg/view"
      }, {
        text: "Cacher/Afficher les éléments trouvés",
        link: "/manual/guide/hide-show-done/hidedoneshowdone"
      }, {
        text: "Mode superposition",
        items: [{
          text: "Instructions",
          link: "/manual/guide/overlay-mode/instructions"
        }, {
          text: "Fenêtré plein écran",
          link: "/manual/guide/overlay-mode/fullscreen-windowed/launching"
        }]
      }, {
        text: "Restauration/récupération de la progression",
        link: "/manual/guide/restore-recover/progress"
      }]
    }, {
      text: "FAQ",
      collapsed: false,
      items: [{
        text: "Sécurité du compte",
        link: "/manual/faq/accountsafety/acntban.md"
      }, {
        text: "Mise à jour automatique",
        link: "/manual/faq/autoupdate/updater.md"
      }, {
        text: "Erreur d'installation",
        items: [{
          text: "Code 2503",
          link: "/manual/faq/instlerror/code2503.md"
        }, {
          text: "Fichier .dll manquant",
          link: "/manual/faq/instlerror/missingdll.md"
        }]
      }, {
        text: "Erreur de lancement",
        items: [{
          text: "Blocage/pas de progression",
          link: "/manual/faq/launcherror/emptydialog.md"
        }, {
          text: "Échec de la vérification de la version",
          link: "/manual/faq/launcherror/versioncheck.md"
        }]
      }, {
        text: "À propos de la connexion",
        items: [{
          text: "Problèmes de connexion",
          link: "/manual/faq/login/accountlogin.md"
        }, {
          text: "Demandes de connexion répétées",
          link: "/manual/faq/login/clientrepeatedly.md"
        }]
      }]
    }]
  };
}