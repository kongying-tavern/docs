# Forum 快速开始指南

## 🚀 5分钟上手Forum系统

### 1. 创建一个新的论坛页面

```vue
<template>
  <BaseForumPage :store="forumStore" :render-data="topics">
    <template #header>
      <h1>我的论坛页面</h1>
    </template>
  </BaseForumPage>
</template>

<script setup lang="ts">
import { useForumHomeStore } from '~/stores/forum/useForumHomeStore'
import BaseForumPage from '~/components/forum/base/BaseForumPage.vue'

const forumStore = useForumHomeStore()
const topics = computed(() => forumStore.data.value || [])

onMounted(() => {
  forumStore.setupEventListeners()
  forumStore.loadForumData()
})
</script>
```

### 2. 创建话题操作按钮

```vue
<template>
  <button @click="togglePin">
    {{ isTopicPinned ? '取消置顶' : '置顶话题' }}
  </button>
</template>

<script setup lang="ts">
import { useTopicManger } from '~/composables/useTopicManger'

const props = defineProps<{
  topic: ForumAPI.Topic
}>()

const { message } = useLocalized()
const topicManger = useTopicManger(props.topic, message)

const isTopicPinned = computed(() => props.topic.pinned)

async function togglePin() {
  await topicManger.togglePinedTopic()
  // 事件会自动同步到所有页面
}
</script>
```

### 3. 监听事件更新

```typescript
import { simpleEventManager } from '~/services/events/SimpleEventManager'

// 监听话题创建
const unsubscribe = simpleEventManager.subscribe('topic:created', (payload) => {
  console.log('新话题创建:', payload.topic.title)
  // 自动更新UI
})

// 清理监听器
onUnmounted(() => {
  unsubscribe()
})
```

### 4. 发射自定义事件

```typescript
import { forumEvents } from '~/services/events/SimpleEventManager'

// 话题操作
forumEvents.topicCreated(newTopic)
forumEvents.topicDeleted(topicId)
forumEvents.topicPinned(topicId, true)

// 表单操作
forumEvents.formSubmitStart('topic')
forumEvents.formSubmitSuccess('topic', formData)

// UI操作
forumEvents.search('搜索关键词')
forumEvents.filterChange('open')
```

### 5. 使用缓存系统

```typescript
import { useTopicCache } from '~/composables/useTopicCache'

const topicCache = useTopicCache()

// 缓存话题
topicCache.setCachedTopic(topic)

// 获取缓存
const cachedTopic = topicCache.getCachedTopic(topicId)

// 批量缓存
topicCache.setCachedTopics(topicList)
```

## 🛠️ 常用模式

### 权限检查模式

```typescript
import { useRuleChecks } from '~/composables/useRuleChecks'

const { hasPermission } = useRuleChecks()

// 检查权限
if (hasPermission('manage_feedback')) {
  // 显示管理员功能
}
```

### 搜索模式

```typescript
import { useSearchInput } from '~/composables/useSearchInput'

const {
  searchQuery,
  searchResults,
  isSearching,
  performSearch
} = useSearchInput()

// 执行搜索
await performSearch('关键词')
```

### 表单提交模式

```typescript
import { useSubmitTopic } from '~/composables/useSubmitTopic'

const { submitData, loading } = useSubmitTopic()

async function handleSubmit() {
  const result = await submitData({
    title: '话题标题',
    text: '话题内容',
    tags: ['标签1', '标签2'],
    type: 'SUGGESTION'
  })

  if (result) {
    // 提交成功，事件会自动同步
    console.log('话题创建成功')
  }
}
```

## 🔧 调试技巧

### 1. 开发环境调试

```javascript
// 在浏览器控制台中访问调试接口
window.__FORUM_DEBUG__.stores.forumHomeStore.data.value
window.__FORUM_DEBUG__.eventManager.emit('topic:created', { topic: testTopic })
window.__FORUM_DEBUG__.crossPageSync.enable()
```

### 2. 事件调试

```typescript
// 监听所有事件 (开发模式)
if (import.meta.env.DEV) {
  const originalEmit = simpleEventManager.emit
  simpleEventManager.emit = function(eventType, payload) {
    console.log(`[Event] ${eventType}:`, payload)
    return originalEmit.call(this, eventType, payload)
  }
}
```

### 3. 性能监控

```typescript
import { useForumPerformanceMonitor } from '~/composables/useForumPerformanceMonitor'

const monitor = useForumPerformanceMonitor({
  enableMetrics: true,
  trackUserActions: true,
})

// 查看性能指标
console.log(monitor.getMetrics())
```

## 📋 最佳实践检查清单

### ✅ 组件开发
- [ ] 使用TypeScript定义Props和Emits
- [ ] 实现响应式设计 (移动端适配)
- [ ] 添加loading和error状态处理
- [ ] 使用适当的缓存策略
- [ ] 添加无障碍访问属性

### ✅ 状态管理
- [ ] 使用正确的Store (Home/User/Topic)
- [ ] 设置事件监听器
- [ ] 启用跨页面同步
- [ ] 实现错误处理
- [ ] 添加加载状态

### ✅ 事件系统
- [ ] 使用新的事件系统 (SimpleEventManager)
- [ ] 正确的事件命名约定
- [ ] 及时清理事件监听器
- [ ] 避免事件循环
- [ ] 添加事件去重

### ✅ 性能优化
- [ ] 使用虚拟滚动 (大列表)
- [ ] 实现图片懒加载
- [ ] 添加防抖/节流
- [ ] 使用缓存系统
- [ ] 代码分割和按需加载

### ✅ 用户体验
- [ ] 添加加载动画
- [ ] 实现错误重试
- [ ] 提供离线支持
- [ ] 添加快捷键支持
- [ ] 实现无障碍访问

## 🐛 常见问题

### Q: 跨页面同步不工作？
A: 确保调用了 `simpleCrossPageSync.enable()` 并且事件名称格式正确。

### Q: Store数据不更新？
A: 检查是否正确设置了事件监听器 `store.setupEventListeners()`。

### Q: 组件渲染缓慢？
A: 考虑使用虚拟滚动、图片懒加载，或检查是否有不必要的重新渲染。

### Q: TypeScript类型错误？
A: 确保导入了正确的类型定义，参考 `ForumAPI` 命名空间。

### Q: 权限检查失败？
A: 确保用户已登录，并且具有相应的权限角色。

---

*更多详细信息请参考 [完整架构文档](./README.md)*