# Forum Translation Usage Guide

本指南说明如何在论坛组件中正确使用翻译功能，替代硬编码文本。

## 概述

所有之前硬编码的错误消息和验证消息现在都支持国际化翻译。修改包含以下方面：

1. **验证函数** - 支持传入翻译消息
2. **业务逻辑** - 错误处理支持翻译
3. **Zod 表单验证** - 动态翻译消息

## 使用方法

### 在 Vue 组件中使用

```vue
<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { createTopicFormSchema, validateContent } from '@/components/forum/utils/validation'
import { ForumBusinessLogic } from '@/services/forum/ForumBusinessLogic'

const { message } = useLocalized()

// 使用翻译的表单验证 - 传递 message ref
const schema = createTopicFormSchema(message)

// 使用翻译的内容验证 - 传递 message ref
const contentValidation = validateContent(userInput, message)

// 使用翻译的话题验证 - 传递 message ref
const topicValidation = ForumBusinessLogic.validateTopic(topic, message)

// 使用翻译的错误处理 - 传递 message ref
try {
  // 一些操作...
} catch (error) {
  const errorInfo = ForumBusinessLogic.handleForumError(error, 'Create Topic', message)
  console.error(errorInfo.message) // 显示本地化的错误消息，会自动响应语言切换
}
</script>
```

### 在 TypeScript/JavaScript 中使用

对于不在 Vue 组件中的代码，函数提供了英文回退消息：

```typescript
import { validateTags, validateContent } from '@/components/forum/utils/validation'
import { ForumBusinessLogic } from '@/services/forum/ForumBusinessLogic'

// 不传入翻译消息时，将使用英文回退消息
const validation = validateTags(['tag1', 'tag2'])
const contentValidation = validateContent('some content')

// 错误处理也会使用英文回退消息
const errorInfo = ForumBusinessLogic.handleForumError(error, 'Some Operation')
```

## 新增的翻译键

### 验证错误 (`forum.validation.errors`)

- `titleRequired` - 标题不能为空
- `contentRequired` - 内容不能为空
- `authorRequired` - 作者不能为空
- `tooManyTags` - 标签过多（最多10个）
- `contentTooShort` - 内容至少需要 {min} 个字符
- `contentTooLong` - 内容不能超过 {max} 个字符
- `tagsRequired` - 至少需要 {min} 个标签
- `tooManyTagsLimit` - 标签不能超过 {max} 个
- `tagTooLong` - 标签 "{tag}" 超过最大长度 {maxLength} 个字符
- `commentEmpty` - 评论内容不能为空
- `invalidImageFormat` - 只允许 JPEG、PNG、GIF 和 WebP 图片格式
- `validationError` - 验证错误
- `invalidFile` - 无效文件
- `fileValidationFailed` - 文件验证失败

### 通用错误 (`forum.errors`)

- `tooManyRequests` - 请求过于频繁，请稍后重试
- `serverError` - 服务器错误，请重试
- `notFound` - 资源未找到
- `operationFailed` - {operation} 失败：{message}
- `unknownError` - 未知错误
- `networkError` - 网络连接失败
- `permissionDenied` - 权限不足

## 参数替换

某些翻译键支持参数替换：

- `{min}`, `{max}` - 数字限制
- `{tag}` - 标签名称
- `{maxLength}` - 最大长度
- `{operation}` - 操作名称
- `{message}` - 错误消息

## API 变更

### 函数签名更新

```typescript
// 之前
validateContent(content: string): ValidationResult
validateTags(tags: string[]): ValidationResult

// 现在 - 使用 Ref<CustomConfig> 支持响应式更新
validateContent(content: string, message?: Ref<CustomConfig>): ValidationResult
validateTags(tags: string[], message?: Ref<CustomConfig>): ValidationResult

// 之前
ForumBusinessLogic.validateTopic(topic: Topic): ValidationResult
ForumBusinessLogic.handleForumError(error: any, operation: string): ErrorInfo

// 现在 - 使用 Ref<CustomConfig> 支持响应式更新
ForumBusinessLogic.validateTopic(topic: Topic, message?: Ref<CustomConfig>): ValidationResult
ForumBusinessLogic.handleForumError(error: any, operation: string, message?: Ref<CustomConfig>): ErrorInfo

// 新的 Zod 模式创建函数 - 使用 Ref<CustomConfig> 支持响应式更新
createTopicFormSchema(message: Ref<CustomConfig>): ZodSchema
createCommentFormSchema(message: Ref<CustomConfig>): ZodSchema
createImageUploadSchema(message: Ref<CustomConfig>): ZodSchema
```

## 向后兼容

所有现有代码仍然可以工作，因为：

1. 所有新参数都是可选的
2. 提供英文回退消息
3. 保持了原有的导出以供向后兼容

## 重要说明

### 响应式更新
使用 `Ref<CustomConfig>` 的好处是：
- **自动语言切换**：当用户切换语言时，错误消息会自动更新
- **实时响应**：无需重新创建验证 schema 或重新调用验证函数
- **性能优化**：Vue 的响应式系统会智能地更新相关的 UI

### 使用建议

1. **在新代码中**：始终传入 `message` ref 以获得完整的响应式国际化支持
2. **在现有代码中**：逐步迁移以使用 `Ref<CustomConfig>` 参数
3. **测试**：确保在不同语言环境下测试错误消息显示和语言切换功能
4. **性能考虑**：传递 ref 而不是 `.value` 可以确保响应式更新正常工作