# Swipe actions

Vue 基础组件，参考 [Arc UI Swipe actions](https://uiarc.dev/components/swipe-actions) 的交互与公开源码，复用项目现有弹簧、主题设置和 DropdownMenu。无新增运行时依赖。

```vue
<script setup lang="ts">
import { Archive, MailOpen } from '@lucide/vue'
import { ref } from 'vue'
import { SwipeActions, SwipeActionsRow } from '@/components/ui/swipe-actions'

const messages = ref([{ id: 'welcome', subject: '欢迎', unread: true }])
function archive(id: string) {
  messages.value = messages.value.filter(message => message.id !== id)
}
</script>

<template>
  <SwipeActions label="收件箱">
    <SwipeActionsRow
      v-for="message in messages"
      :key="message.id"
      :label="message.subject"
      :menu-label="`${message.subject}的更多操作`"
      :leading="[{
        id: 'read', label: '标为已读', icon: MailOpen, tone: 'accent', keepRow: true,
        onSelect: () => { message.unread = false },
      }]"
      :trailing="[{
        id: 'archive', label: '归档', icon: Archive,
        onSelect: () => archive(message.id),
      }]"
    >
      {{ message.subject }}
    </SwipeActionsRow>
  </SwipeActions>
</template>
```

## API

`SwipeActions`：`label` 为列表的无障碍名称，`class` 用于容器样式。行必须作为默认插槽的直接子节点，并提供稳定的 `key`。

`SwipeActionsRow`：

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `label` | 必填 | 行的无障碍名称 |
| `menuLabel` | 必填 | 更多操作按钮的完整无障碍名称，由调用方提供本地化文案 |
| `leading` / `trailing` | `[]` | 分别右滑 / 左滑显示的动作 |
| `fullSwipe` | `true` | 全滑或快甩触发 leading 首项 / trailing 末项；被禁用的外侧动作不会被替换成其他动作 |
| `disabled` | `false` | 禁用整行手势和操作，插槽内容仍可独立交互 |
| `class` | — | 行样式 |

`SwipeAction`：`id`（同侧唯一）、`label`、`onSelect: () => void \| Promise<void>` 必填；`icon` 接收 Vue 组件；`tone` 为 `neutral` / `accent` / `danger`；`disabled` 禁用动作；`keepRow` 适用于标为已读等保留条目的操作。

调用方在 `onSelect` 中更新数据并移除条目。组件不会自行删除业务数据；未移除、保留条目或异步失败时均恢复原位。执行期间锁定该行，防止重复触发。`select(action, side)` 在成功执行后发出，`actionError(error, action)` 在失败时发出，调用方负责错误提示。

## 交互约定

- 同一列表只展开一行；外部按下和 Escape 收起。操作菜单复用现有 DropdownMenu 的键盘与焦点行为。
- 动作宽度为 76px，窄行展开宽度最多为行宽；全滑阈值为展开宽度 + 48px 与行宽 56% 中的较大值。
- 水平锁定前保留纵向滚动和双指缩放；`pointercancel` / 丢失捕获只回位，不能触发动作。拖动后的点击被吞掉，避免误激活内容。
- 链接、按钮、输入框和可编辑区域不会作为滑动起点。图片原生拖拽被禁用，便于拖动带图片的行。
- 滑出的按钮不参与键盘焦点或无障碍树；更多操作菜单提供等价路径。删除有焦点的行后，焦点移到下一行、上一行或列表。
- 遵循站点的减少动态效果设置；普通模式复用现有临界阻尼弹簧，动作图标随展开逐渐显现，移除条目以原生动画折叠高度；减少动态效果时位移直接就位，条目仅做短暂淡入淡出。未引入振动。
- 异步操作期间显示等待图标，并锁定该行直到回位完成；父级更新动作文案或回调不会打断正在执行的动作。
- 适用于较短的列表；组件不提供分页或虚拟化。

## 测试

`pnpm test:theme` 包含手势回归测试。`tests/theme/swipe-actions/browser.test.mjs` 启动独立 Vite 测试页，不依赖论坛或 VitePress 的业务路由。

浏览器回归使用已有 Playwright 安装和本机 Chrome，不增加生产依赖：

```powershell
# 未在项目内安装 Playwright 时，将该变量设为已有 playwright 包的绝对路径。
$env:SWIPE_PLAYWRIGHT_PATH = 'C:/path/to/node_modules/playwright'
pnpm test:theme:ui
```

可选 `SWIPE_BROWSER_CHANNEL` 切换浏览器 channel（默认 `chrome`），`SWIPE_SCREENSHOT` 指定截图输出路径。测试覆盖展开 / 回位、单行互斥、全滑、手势取消、动作按钮、键盘菜单、禁用项、异步异常、删除焦点、移动端触摸滚动、减少动态效果和插槽链接。
