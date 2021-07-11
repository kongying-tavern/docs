---
title: Documentation Roadmap
sidebar:
  [
    { text: '文档规范', link: '/developer/documentation/spec/README.md' },
    { text: '更新日志', link: '/developer/documentation/update.md' },
    { text: '开发计划', link: '/developer/documentation/roadmap.md' },
  ]
---

## 原神地图文档 2021 年开发计划草案

这个计划草案记录了文档 2021 年的开发计划，预计最晚将在八月份前结束。

### Plan Items

| Mark | Description                                       |
| :--- | :------------------------------------------------ |
| 🏃   | work in progress                                  |
| ✋   | blocked task                                      |
| 💪   | stretch goal for this iteration                   |
| 🔴   | missing issue reference                           |
| 🔵   | more investigation required to remove uncertainty |
| ⚫   | under discussion within the team                  |
| ⬛   | large work item, larger than one iteration        |

### Internationalization

- [ ] 🏃 日语翻译（50%+）
- [ ] 🏃 英语翻译（90%+)
- [x] 🏃 Day.js
- [x] 🏃 ElementPlus

### Theme

- [ ] 🏃 Accessibility（80%）
- [x] 🏃 Dark Mode
  - [x] Element plus
  - [x] Default Theme
- [ ] 🏃 全局主题颜色和全局字体大小的自定义切换
- [ ] 🏃 哀悼日
- [ ] 🏃 分享
- [ ] 🏃 布局及样式的重构
- [ ] 🏃 主题的完整单元测试
- [ ] 🏃 米游社 Emoji

### Page

- [ ] 🏃 贡献鸣谢
- [ ] 🏃 网站地图
- [ ] 🏃 404 / ErrorPage
- [ ] 🏃 客户端下载页
- [ ] ⬛ 点位数据的导入导出和用户数据的展示
- [ ] 🏃 更新日志
- [ ] 🏃 Developer 文档的完善
- [ ] ⚫ ChatRoom
- [ ] ⚫ OpenAPI Document

### CI/CD

- [x] 🏃 持续部署
- [x] 🏃 Travis
- [ ] 🔵 Github Page
- [x] 🏃 自动化测试&分析

### SEO

- [x] 🏃Automatically Generation SiteMap
- [x] 🏃Automatically Generation Title, Type, EdgeDate, PublishedTime, Locale...
- [x] 🏃Structured data
- [x] 🏃Open Graph Protocal Support
- [x] 🏃Feed
- [x] 🏃SSR

### Other

- [x] 🏃 TeX Support
- [x] 🏃 CodeDemo Support
- [x] 🏃 Presentation Support
- [x] 🏃 Mermaid Support
- [x] 🏃 Task list Support
- [x] 🏃 Custom alignment Support
- [x] 🏃 Superscript and Subscript Support
- [x] 🏃 Markup Support
- [x] 🏃 TypeScript
- [x] 🏃 Axios Encapsulation
- [x] 🏃 TextLint
- [x] 🏃 ESlint
- [x] 🏃 Commitlint
- [x] 🏃 Jest
- [x] 🏃 karma
- [x] 🏃 Prettier
- [x] 🏃 Automatically Generation CHANGELOG
- [x] 🏃 Anchor
- [x] 🏃 ScreenFull
- [x] 🏃 BackToTop
- [ ] 🏃 Automatically Hide Header
- [ ] 🏃 One key copy of the code
- [ ] ✋ Gitee & Github Bisynchronous
- [ ] 🏃 Context menu
- [ ] ✋ Vite

## Calendar

<el-calendar :range="[new Date(), new Date(2021, 8, 1)]">
</el-calendar>
