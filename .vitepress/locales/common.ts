export const SITE_LOGO = '/imgs/common/logo/logo_256.png'
export const SITE_IMAGE = '/imgs/common/cover.jpg'
export { DEFAULT_LOCALE } from '../../src/constants/site.ts'

// Configuration shared by every language; translated captions live in YAML.
export const SHARED_THEME_CONFIG = {
  asideLinks: {
    contactUsLink: 'https://discord.gg/SWz6RTWNkm',
  },
  docReaction: {
    form: {
      issueOptions: [
        {
          value: 'CATA-DISPLAY',
        },
        {
          value: 'CATA-TYPOS',
        },
        {
          value: 'CATA-DOCS',
        },
        {
          value: 'CATA-OTHER',
        },
      ],
    },
  },
  payment: {
    wechatpay: {
      address: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
    },
    alipay: {
      address: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
    },
    qqpay: {
      address: 'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet',
    },
    paypal: {
      address: 'https://www.paypal.com/paypalme/yuanshenditu',
    },
    bilibili: {
      address: 'https://space.bilibili.com/518076785',
    },
  },
  forum: {
    aside: {
      suggest: {
        items: [],
      },
      teamBlog: {
        items: {
          'hotupdatelog-client': {
            link: '/blog/posts/hotupdatelog-client/',
          },
          'changelog-web': {
            link: '/blog/posts/changelog-web/',
          },
          'changelog-autotrack': {
            link: '/blog/posts/changelog-autotrack/',
          },
        },
      },
      meta: {
        links: {
          agreement: {
            link: '/agreement',
          },
          privacy: {
            link: '/privacy',
          },
          license: {
            link: 'https://github.com/kongying-tavern/docs/blob/main/LICENSE',
          },
        },
        poweredBy: {
          link: 'https://gitee.com/KYJGYSDT',
        },
      },
    },
  },
}
