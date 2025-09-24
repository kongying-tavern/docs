# 跨页面状态同步机制

## 问题描述

之前存在的问题：当用户在详情页删除、关闭或隐藏反馈后，回到反馈主页时，该反馈仍然显示在本地缓存和 UI 中，需要手动刷新页面才能看到更新。

## 解决方案

### 🔄 全局事件监听机制

通过 `useGlobalForumEvents` composable 实现跨页面状态同步：

1. **事件捕获**：监听所有论坛事件，并将状态变更保存到 localStorage
2. **跨页面传播**：通过 `storage` 事件监听其他页面的状态变更
3. **本地同步**：将外部变更重新发射到本地事件总线

### 📋 支持的同步事件

- `topic:deleted` - 主题删除
- `topic:updated` - 主题更新  
- `topic:type-changed` - 主题类型变更
- `topic:pinned` - 主题置顶状态
- `topic:tags-updated` - 主题标签更新
- `topic:hidden` - 主题隐藏状态
- `topic:closed` - 主题关闭状态

### 🔧 实现架构

```typescript
// 全局事件监听器设置
useGlobalForumEvents() // 在所有论坛页面中调用

// 事件流程
详情页操作 → 发出事件 → localStorage 存储 → storage 事件 → 其他页面接收 → 本地状态更新
```

### 🎯 关键组件

#### 1. useGlobalForumEvents.ts
- 全局事件监听和同步机制
- localStorage 作为跨页面通信媒介
- 优雅降级：localStorage 错误不影响功能

#### 2. useTopicPageState.ts  
- 详情页特定事件监听
- 主题删除/关闭/隐藏时自动导航回主页
- 与主页缓存数据预填充

#### 3. defineTopicDropdownMenu.ts
- 操作完成后发出相应事件
- 删除/关闭/隐藏操作触发导航事件

### ⚡ 同步流程示例

1. **用户在详情页删除主题**：
   ```
   用户点击删除 → API 调用成功 → forumEvents.topicDeleted(topicId)
   ```

2. **事件传播到主页**：
   ```
   详情页事件 → localStorage 存储 → storage 事件 → 主页监听器 → 本地状态更新
   ```

3. **详情页自动导航**：
   ```
   监听到删除事件 → 检查是否为当前主题 → 自动返回主页
   ```

4. **主页状态同步**：
   ```
   接收到删除事件 → 从列表中移除主题 → UI 实时更新
   ```

### 🛡️ 错误处理

- **localStorage 错误**：静默忽略，不影响正常功能
- **JSON 解析错误**：忽略无效的存储事件
- **跨 tab 兼容**：支持同一域名下的多个 tab 同步

### 🚀 优势

1. **实时同步**：无需刷新页面，状态立即同步
2. **跨 tab 支持**：多个浏览器 tab 之间状态同步  
3. **优雅降级**：即使 localStorage 不可用，页面内功能正常
4. **类型安全**：完整的 TypeScript 支持
5. **性能优化**：仅传递必要的状态信息

### 📝 使用方法

在所有论坛相关页面中调用：

```typescript
import { useGlobalForumEvents } from '~/composables/useGlobalForumEvents'

// 在组件设置中
useGlobalForumEvents()
```

现在用户在详情页的任何操作都会实时反映到主页，提供流畅的用户体验！🎉