import type { CustomConfig } from '../types'

const ui: CustomConfig['ui'] = {
  title: {
    templateMappings: [
      {
        test: /(^|\/?)manual\/client\/?/,
        template: ':title - 客户端使用手册 | 空荧酒馆',
      },
    ],
  },
  banner: {
    wip: '此页面正在施工中，不代表最终效果。',
  },
  button: {
    submit: '提交',
    cancel: '取消',
    loading: '加载中',
  },
}

export default ui
