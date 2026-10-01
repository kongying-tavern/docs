# 诊断与 Clarity 集成

本站将本地 console 日志、错误提示和 Clarity 自定义事件分开处理。诊断服务不可用时，业务操作和错误提示仍需正常工作。

## 调用约定

- 请求失败调用 `reportRequestFailure`；UI 继续传递原始错误，或通过 `cause` / `originalError` 保留包装链。同一支持会话内复用追踪标识。
- 成功操作调用 `trackOp`，事件名从 `OpsEvents` 选择，不拼接用户输入。
- 错误详情仅用于本地提示和复制，不传递到自定义事件。事件只含随机错误 ID；录制中的错误详情和编辑器草稿显式遮罩。
- 上报是尽力而为：队列最多 50 条，满时可丢弃诊断事件。控制命令优先保留；不能把返回的追踪标识解释为服务端已收到事件。
- 调用 SDK 时隔离同步异常和 Promise 拒绝；不使用遥测来上报遥测自身的失败。

## 官方 API 对齐

使用推荐的 [`consentv2`](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)，不使用旧的 `consent`。持久关闭状态在第三方脚本执行前入队，标签页同步关闭时清理本站待发送事件并撤销授权。拒绝 cookie 授权后，Clarity 仍可能进入有限的无 cookie 模式；关闭诊断开关不代表卸载第三方脚本。

[`identify`](https://learn.microsoft.com/en-us/clarity/setup-and-installation/identify-api) 返回 Promise，官方建议每页调用。本站在启动及路由加载钩子中调用，使用随机设备标识和支持会话码，不传递真实账户信息。支持会话码按本站诊断事件和导航的空闲时间轮换，不能保证与 Clarity 内部录制会话一一对应。持久存储不可用时使用本页内存后备。

按照官方[遮罩文档](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)，在需要保护的 DOM 上设置 `data-clarity-mask="true"`。默认输入框遮罩不能替代对富文本编辑器、错误详情等普通 DOM 的显式保护。

## 项目后台与产品设置

代码中的诊断偏好默认开启，不能把这个默认值当作用户已经明确授予 cookie 或广告授权。当前显式启用路径沿用已有的分析和广告授权策略；是否引入独立授权入口，以及授权类别，需结合实际产品用途确定，并与 Clarity 项目的 cookie consent 设置对齐。

后台还需确认实际遮罩模式、授权配置及录制效果；本地测试不能验证这些项目设置。遮罩变更不会追溯修改历史录制。

操作打点使用固定事件名。错误事件目前保留 `error_<错误ID>`，方便已有支持流程按错误 ID 检索。如果需要按场景统计错误趋势，可迁移为固定场景事件加 `error_id` 自定义标签；这会改变现有筛选方式，应同步调整后台视图。官方支持 [`set` 自定义标签](https://learn.microsoft.com/en-us/clarity/filters/custom-tags)，标签键和值各不超过 255 字符，每页最多 128 个标签。

## 验证

`src/forum/test/telemetryRuntime.test.ts` 在隔离环境运行真实封装，覆盖 SDK 异常、队列、偏好同步、错误包装去重、会话轮换和存储降级，不连接真实 Clarity 服务。

## 性能、交互与白屏覆盖

Clarity 官方[性能面板](https://learn.microsoft.com/en-us/clarity/insights/performance-widget)提供 LCP、INP、CLS 的第 75 百分位，分别辅助分析页面加载、交互延迟和布局稳定性。其 [JavaScript / Click Errors](https://clarity.microsoft.com/blog/introducing-click-errors-and-javascript-error-details/) 与录制辅助定位交互后的异常。本站没有另外重复采集这些性能指标，也没有自定义长任务或业务交互耗时上报。

本站全局异常监听在主题 `enhanceApp` 安装，覆盖安装后的窗口异常、未处理 Promise 拒绝及 Vue 组件异常。请求失败和业务提示另有上报入口。诊断事件经过关闭开关、队列上限和全局异常节流，所以不能用事件数量作为完整错误率。

白屏仍有覆盖缺口：没有独立的页面可用性检测，也没有主应用脚本启动前的异常缓存、启动超时检测或独立故障接收端。主题模块自身加载失败时，应用内监听可能尚未安装；主线程持续阻塞时，页面定时器也无法及时执行。Clarity 若加载成功可能留下相邻异常或录制，但不能据此保证白屏被识别、恢复或成功上报。
