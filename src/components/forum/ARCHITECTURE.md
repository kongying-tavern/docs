# Forum architecture

## 数据流

```text
URL (filter/sort/q/creator/topicId)
  -> useForumRoute
  -> useForumQueries (Pinia Colada)
  -> ForumService / Gitee adapter
  -> page components

user action
  -> useForumMutations
  -> provider
  -> forumMutationPolicies
  -> invalidate list/detail/comment query keys
  -> active views refetch authoritative data
```

URL 是导航状态的唯一来源，Colada query cache 是同一标签页内服务端状态的唯一来源。组件只保留草稿、对话框开关、回复目标等临时 UI 状态；不得再增加 Topic/Comment 镜像 store、事件总线或 localStorage 数据副本。

## 所有权边界

| 责任 | 所有者 |
| --- | --- |
| Forum URL 解析、规范化与 href | `services/forum/forumRoute.ts`、`composables/useForumRoute.ts` |
| 查询键、分页与 mutation policy | `services/forum/forumQueryContracts.ts` |
| 列表、详情、评论查询 | `composables/forum/useForumQueries.ts` |
| 创建、修改、评论与失效 | `composables/forum/useForumMutations.ts` |
| provider HTTP/映射 | `.vitepress/theme/apis/forum/gitee/`、`services/forumService.ts` |
| 页面加载/空/错误/重试反馈 | `components/forum/base/`、`ForumTopicsList.vue`、`ui/ForumLoadState.vue` |

## 一致性契约

- 创建或修改 Topic 后，按 `forumMutationPolicies` 失效所有受影响的 list key；详情能安全 patch 时先更新 detail，否则以 provider refetch 为准。
- 创建或删除 Comment 后，同时失效 comments、Topic detail 和 Topic lists，使评论正文与计数从同一事实源收敛。
- 查询失败时保留已有 rows；初次加载、空结果、错误和后台加载是四个不同 UI 状态。
- 同标签页由 Colada 立即共享 cache。D6 不提供即时 cross-tab 广播；另一个标签页在 focus/reconnect/refetch 后收敛。

## Provider 与部署边界

- Gitee provider 不支持 Topic hard delete。Topic hide/close 是状态操作，不使用不可逆确认。
- Comment delete 由 provider 支持，是当前唯一需要不可逆确认的 Forum 操作。
- Topic list 的 `reactions` 为 `null`，provider 也没有 batch endpoint；reaction 只在 Topic detail 加载。
- Plan001 的 browser credentials 是 deferred risk，当前架构不把凭据纳入 Forum cache 或跨页同步。
- Nginx/Vercel 外部环境未验证。`build:mpa`、Forum route tests 与仓库 rewrite 文件不能替代真实部署验证。
