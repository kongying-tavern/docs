import type { CustomConfig } from '../types'

const payment: CustomConfig['payment'] = {
  wechatpay: {
    name: '微信支付',
    address: 'wxp://f2f0dd1rszrnqJc_gnlwV_lRX5dlZ1Dtn9rp',
  },
  alipay: {
    name: '支付宝',
    address: 'https://qr.alipay.com/tsx11609thmpw9odmvdlxd6',
  },
  qqpay: {
    name: 'QQ 支付',
    address:
      'https://i.qianbao.qq.com/wallet/sqrcode.htm?m=tenpay&a=1&u=790489566&ac=CAEQ3tP3-AIY0v2k_AU%3D_xxx_sign&n=AAAAAAAA&f=wallet',
  },
  paypal: {
    name: 'PayPal',
    address: 'https://www.paypal.com/paypalme/yuanshenditu',
  },
  bilibili: {
    name: 'bilibili',
    address: 'https://space.bilibili.com/518076785',
  },
}

export default payment
