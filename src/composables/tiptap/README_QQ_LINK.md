# QQ自动链接扩展

这个 TipTap 扩展可以自动识别用户输入的QQ号码，并将其转换为可点击的链接，链接到腾讯QQ的在线聊天页面。

## 功能特性

- ✅ 自动识别QQ号格式：`QQ 123456789` 或 `QQ123456789`
- ✅ 实时输入转换（Input Rules）
- ✅ 粘贴内容转换（Paste Rules）
- ✅ 自定义正则表达式匹配
- ✅ 可配置的链接生成规则
- ✅ 支持多种预设样式
- ✅ 完整的 TypeScript 支持

## 基本用法

### 默认配置
```typescript
import { QQAutoLink } from '~/composables/tiptap/qqLinkExtension'

const editor = new Editor({
  extensions: [
    StarterKit,
    QQAutoLink, // 使用默认配置
  ],
})
```

### 自定义配置
```typescript
import { QQAutoLinkExtension } from '~/composables/tiptap/qqLinkExtension'

const editor = new Editor({
  extensions: [
    StarterKit,
    QQAutoLinkExtension.configure({
      enabled: true,
      pattern: /QQ( )?[1-9]([0-9]{5,11})/,
      linkGenerator: (qq) => `https://wpa.qq.com/msgrd?v=3&uin=${qq}&site=qq&menu=yes`,
      className: 'custom-qq-link',
      openInNewWindow: true,
      icon: '💬',
      textFormatter: (qq) => `联系QQ：${qq}`,
      titleGenerator: (qq) => `点击联系QQ：${qq}`,
    }),
  ],
})
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用QQ号自动识别 |
| `pattern` | `RegExp` | `/QQ( )?[1-9]([0-9]{5,11})/` | QQ号匹配正则表达式 |
| `linkGenerator` | `(qq: string) => string` | 腾讯QQ在线聊天链接 | 自定义链接生成函数 |
| `className` | `string` | `'qq-link'` | 自定义CSS类名 |
| `openInNewWindow` | `boolean` | `true` | 是否在新窗口打开链接 |
| `icon` | `string` | `'💬'` | 链接前缀图标 |
| `textFormatter` | `(qq: string) => string` | `(qq) => 'QQ' + qq` | 链接文本格式化函数 |
| `titleGenerator` | `(qq: string) => string` | `(qq) => '联系QQ：' + qq` | 悬停提示文本生成函数 |

## 预设配置

### 使用预设
```typescript
import { qqLinkPresets } from '~/composables/tiptap/qqLinkConfig'

// 简约模式 - 无图标
const editor1 = new Editor({
  extensions: [
    StarterKit,
    QQAutoLinkExtension.configure(qqLinkPresets.minimal),
  ],
})

// 紧凑模式 - 只显示QQ号
const editor2 = new Editor({
  extensions: [
    StarterKit,
    QQAutoLinkExtension.configure(qqLinkPresets.compact),
  ],
})

// 企业模式 - 使用企业QQ
const editor3 = new Editor({
  extensions: [
    StarterKit,
    QQAutoLinkExtension.configure(qqLinkPresets.enterprise),
  ],
})
```

## 样式自定义

默认样式已集成到富文本编辑器中，你也可以自定义样式：

```css
.qq-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
  border-radius: 4px;
  padding: 2px 4px;
  background-color: var(--vp-c-brand-soft);
  transition: all 0.2s ease;
}

.qq-link:hover {
  color: var(--vp-c-brand-2);
  background-color: var(--vp-c-brand-softer);
}

.qq-link:before {
  content: "💬 ";
  opacity: 0.8;
}
```

## 编程式API

扩展提供了以下命令：

```typescript
// 设置QQ链接
editor.commands.setQQLink({ qq: '123456789' })

// 切换QQ链接
editor.commands.toggleQQLink({ qq: '123456789' })

// 移除QQ链接
editor.commands.unsetQQLink()
```

## 工具函数

```typescript
import {
  validateQQNumber,
  extractQQNumber,
  generateQQLinkHTML
} from '~/composables/tiptap/qqLinkConfig'

// 验证QQ号格式
console.log(validateQQNumber('123456789')) // true
console.log(validateQQNumber('123')) // false

// 从文本中提取QQ号
console.log(extractQQNumber('请联系QQ123456789')) // '123456789'
console.log(extractQQNumber('QQ 987654321')) // '987654321'

// 生成QQ链接HTML
const html = generateQQLinkHTML('123456789', config)
```

## 支持的QQ号格式

- `QQ123456789` - 无空格
- `QQ 123456789` - 有空格
- QQ号长度：5-12位数字
- 首位不能为0

## 生成的链接格式

默认生成的链接格式为：
```
https://wpa.qq.com/msgrd?v=3&uin=QQ号码&site=qq&menu=yes
```

这将打开腾讯QQ的在线聊天页面，用户可以直接发起聊天。

## 安全性

- 所有生成的链接都会添加 `rel="noopener noreferrer"` 属性
- 默认在新窗口打开，防止页面跳转
- QQ号格式验证，防止恶意输入

## 兼容性

- 支持所有现代浏览器
- 与现有的 TipTap 扩展兼容
- 支持服务端渲染（SSR）

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的QQ号自动识别和链接转换
- 提供丰富的配置选项和预设