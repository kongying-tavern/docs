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
    search: '搜索',
    submit: '提交',
    cancel: '取消',
    loading: '加载中',
    close: '关闭',
    all: '全部',
  },
  sitemap: {
    blog: '博客文章',
    manual: '使用手册',
    general: '常规页面',
    api: 'API 文档',
    guide: '指南文档',
    community: '社区相关',
    about: '关于我们',
  },
}

export default ui
