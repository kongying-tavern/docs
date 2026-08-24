# Feedback Forum

反馈论坛是 VitePress 站点内的 Vue 3 客户端应用，数据源为 Gitee Issues。入口路由由 `services/forum/forumRoute.ts` 解析：首页和用户页使用同一组 URL 筛选参数，话题详情使用独立的 Topic ID。

## 本地开发

```bash
pnpm dev
pnpm test:forum
pnpm typecheck
pnpm build:mpa
```

不要用生产账号或生产数据做写操作验证。发布、评论、标签、关闭和隐藏等写操作应使用明确的测试数据与可撤销路径。

## 代码入口

- `ForumHome.vue`、`user/ForumUserPage.vue`、`topic/ForumTopicPage.vue`：页面组合。
- `composables/forum/useForumQueries.ts`：Pinia Colada 查询与无限分页。
- `composables/forum/useForumMutations.ts`：写操作和查询失效策略。
- `services/forum/forumQueryContracts.ts`：查询键、分页扁平化与 mutation policy。
- `services/forum/forumRoute.ts`：可序列化、可分享的 Forum URL 状态。
- `.vitepress/theme/apis/forum/gitee/`：provider 适配层。

## 当前产品约束

- Topic 不支持硬删除；“隐藏”和“关闭”是可恢复的状态更新。只有 Comment delete 是不可逆操作，并在提交前显示确认对话框。
- Gitee Topic 列表返回的 `reactions` 为空，且 provider 没有 batch reaction endpoint。因此列表不加载 reaction；详情页才按需读取和提交 reaction。
- Pinia Colada 是同一标签页内的唯一服务端状态缓存。写操作通过统一 query key 失效列表、详情和评论，不维护组件级数据副本或事件总线。
- D6 当前不承诺即时跨标签页同步；其他标签页依赖重新聚焦、重连或重新请求后收敛。
- Plan001 中浏览器凭据处理仍是 deferred risk。不得把 token、浏览器会话或 provider 凭据放入持久化 Forum 状态。
- Nginx 与 Vercel 的外部部署配置未在此仓库内验证；仓库测试只覆盖本地路由构建和已提交的 rewrite 契约。

更详细的数据流和所有权见 [ARCHITECTURE.md](./ARCHITECTURE.md)。
