# 论坛逻辑测试

运行 `pnpm test:forum`。入口递归发现 `tests/forum/` 中的 `*.test.ts`；辅助文件
放 `fixtures/` 或 `support/`。通用服务测试归 `tests/shared/`，浏览器旅程归 `tests/e2e/`。
完整目录规则见 `tests/README.md`。测试数量不是质量目标。

老版反馈表单不支持草稿。老版仅验证保存、恢复、自动保存及关闭提示保持关闭；
持久化草稿的正向用例只针对新版 compact 表单。提交失败保留当前输入属于事务恢复，
不代表老版支持持久化草稿。

| 分类 | 主要文件/前缀 | 关注的结果 |
| --- | --- | --- |
| 内容 | forumContentCodec、forumContentRendering、commentNormalizer、topicDraft | 持久化格式、解析、渲染与草稿各自的边界 |
| Provider | giteeContracts、giteePagination、forumLabels、topicUpdate | 原始响应校验、头解析、请求与读回协议 |
| 查询与缓存 | forumTopicsStructured、forumTopicsQuery、forumRelatedComments、forumCommentsQuery、forumQuery* | 条件匹配、分页、乱序、错误隔离与缓存失效 |
| 事务与表单 | topicFormTransaction、commentComposerTransaction、publishTopicController、imageAttachmentQueue | 上传/提交失败保留，成功清理、锁、临界值 |
| 认证 | auth*、sso*、token* | token 生命周期、刷新、重试与竞态，按现有文件职责保留 |
| 路由与视图 | forumRoute*、commentNavigation、mobileEditorViewport、forumImage* | 路由/导航契约、键盘可视区域与生命周期 |

原始 provider fixture 与领域对象分开；默认合法值优先通过生产 parser 或 `satisfies`
检查。纯算法可以使用有意缩小的对象，但要说明只消费哪些字段。提取确实重复的 helper，
不要为每个小测试构建通用测试框架。

## 本轮合并/替代映射

| 原检查 | 处理与承接位置 |
| --- | --- |
| commentComposerTransaction 的 legacy plain 与 ordered attachments 两项 | 移除纯 codec 重复；forumContentCodec 已验证 plain/Tiptap/附件顺序，事务失败和成功测试保留 |
| forumLoadState 的模板表达式 regex | 删除；浏览器 comment-navigation 的 pending→收到评论→终态与 empty-state/list-contract 的错误/重试负责真实显示 |
| forumImageFailure 的 v-if regex | 删除；浏览器 image-failure 请求实际失败并断言替代图片仍存在 |
| 冒烟重复回程 | tests/e2e/forum-smoke 合并为一条后退/前进旅程，独立深链保留 |
| user-drawer-shot 的移动截图 | 已有 user-drawer 行为覆盖；默认回归不再维护仅人工截图的重复场景 |
| user-drawer-shot 的桌面 hover | 移入 user-drawer 行为测试，保留该独特入口与作者断言 |

复用同一输入不必然是重复：编解码、归一化、渲染、HTTP 写入与 mutation 缓存更新
验证不同契约，继续保留。VM 执行真实表单/状态的测试也继续保留；只检查源码拼写的
UI 测试优先用浏览器行为承接。路由重写等静态配置契约仍可检查配置本身。

新增回归包括分页头、无 total 的评论计数/续页、结构化搜索并发/失败重试/旧响应隔离、
mutation 后刷新、附件精确字节上限、标题/正文/标签临界值，以及移动 viewport 的
键盘阈值/缩放/监听清理。新增业务修复先用回归证明旧实现失败，再运行相关文件和全量入口。
