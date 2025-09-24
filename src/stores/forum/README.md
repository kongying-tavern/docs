# Forum Store Architecture

本目录包含了论坛系统的所有状态管理 store。

## 架构设计原则

### 🔄 **页面独立性**
每个页面拥有独立的 store，避免状态污染和数据混乱：

- **`useForumHomeStore`** - 反馈主页专用
- **`useForumUserStore`** - 用户个人页专用

### 🎯 **功能模块化** 
通用功能按功能领域拆分：

- **`useForumDataStore`** - 通用数据操作
- **`useForumUIStore`** - UI 状态管理
- **`useForumSearchStore`** - 搜索功能
- **`useTopicsStore`** - 主题管理

## Store 文件说明

### 页面专用 Store

#### `useForumHomeStore.ts`
反馈主页的独立状态管理：
- ✅ 管理主页的主题列表
- ✅ 处理置顶主题
- ✅ 博客文章集成
- ✅ 搜索功能
- ✅ **creator 始终为 null**（显示所有用户数据）

#### `useForumUserStore.ts`
用户个人页的独立状态管理：
- ✅ 管理特定用户的主题列表
- ✅ 用户特定的搜索和过滤
- ✅ **creator 设置为目标用户**（只显示该用户数据）

### 通用 Store

#### `useForumDataStore.ts`
通用数据操作和 API 调用：
- 📊 统一的数据获取逻辑
- 🔄 加载更多功能
- 🛠️ 错误处理

#### `useForumUIStore.ts`
UI 状态管理：
- 🎨 视图模式（卡片/紧凑）
- 🔍 搜索状态
- 📱 响应式 UI 状态

#### `useForumSearchStore.ts`
搜索功能：
- 🔍 搜索查询管理
- 📝 搜索历史
- 🎯 搜索结果过滤

#### `useTopicsStore.ts`
主题管理：
- 📝 主题 CRUD 操作
- 🏷️ 标签管理
- 📌 置顶状态

## 事件系统集成

所有 store 都集成了事件系统，确保实时更新：

```typescript
// 每个页面 store 都有事件监听
function setupEventListeners(): void {
  forumEventBus.on('topic:created', ({ topic }) => {
    addTopic(topic)
  })
  // ... 其他事件
}

function cleanup(): void {
  forumEventBus.off('topic:created')
  // ... 清理所有事件监听
}
```

## 使用示例

### 在反馈主页中使用

```vue
<script setup lang="ts">
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'

const forumHomeStore = useForumHomeStore()
const { loadForumData, setupEventListeners, cleanup } = forumHomeStore

onMounted(() => {
  setupEventListeners()
  loadForumData()
})

onUnmounted(() => {
  cleanup()
})
</script>
```

### 在用户个人页中使用

```vue
<script setup lang="ts">
import { useForumUserStore } from '~/stores/forum/useForumUserStore'

const forumUserStore = useForumUserStore()
const { loadUserData, setupEventListeners, cleanup } = forumUserStore

onMounted(() => {
  setupEventListeners()
  loadUserData(username)
})

onUnmounted(() => {
  cleanup()
})
</script>
```

## 优势

### 🛡️ **状态隔离**
- 每个页面有独立的状态空间
- 避免页面间数据污染
- 更清晰的数据流

### 🚀 **性能优化**
- 按需加载对应的 store
- 减少不必要的状态监听
- 精确的数据更新

### 🧪 **易于测试**
- 每个 store 功能单一
- 独立的测试用例
- 更好的 mock 支持

### 🔧 **易于维护**
- 清晰的职责分离
- 减少代码耦合
- 更好的扩展性

## 迁移说明

### 从旧架构迁移

1. **替换导入**：
   ```typescript
   // 旧的 (已移除)
   import { useForumData } from '~/stores/forum'

   // 新的
   import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'
   // 或者对于组合式函数
   import { useForumData } from '~/composables/useForumData'
   ```

2. **更新生命周期**：
   ```typescript
   onMounted(() => {
     setupEventListeners()  // 新增
     loadForumData()
   })
   
   onUnmounted(() => {
     cleanup()              // 新增
     resetState()
   })
   ```

3. **状态访问**：
   ```typescript
   // API 方法名基本保持一致
   const { loadForumData, loadMoreTopics } = store
   const { topics, loading } = storeToRefs(store)
   ```

## 新优化功能

### 🔧 **统一服务层**
- **`ForumService`** - 统一的 API 调用服务，消除重复代码
- **`useForumData`** - 可复用的数据加载 composable

### 🎯 **事件驱动更新**
- **`useForumEvents`** - 统一的事件监听管理
- **`useForumTopicManager`** - 标准化的主题操作接口
- **`useForumCommentManager`** - 标准化的评论操作接口
- 所有 UI 更新通过事件系统，不再依赖 props 或 store 直接修改

### 🚀 **架构优势**
- ✅ 消除了功能重复（`useForumDataStore` 已移除）
- ✅ 统一了状态更新模式（事件驱动）
- ✅ 简化了事件监听管理
- ✅ 提供了标准化的操作接口

这个新架构确保了更好的状态管理和用户体验！🎉