# Forum Store Architecture Migration Guide

## 概述

本指南介绍了从旧的factory pattern到新的composition-based架构的迁移。

## 新架构优势

### 🎯 **职责单一 (Single Responsibility)**
- **搜索状态**: `useForumSearchState` - 专注搜索查询和结果
- **搜索历史**: `useForumSearchHistory` - 专注历史记录和建议
- **视图状态**: `useForumViewState` - 专注UI布局和显示选项
- **路由状态**: `useForumRouteState` - 专注路由导航和URL同步

### 🔧 **组合优于继承 (Composition over Inheritance)**
- 替换复杂的factory pattern
- 消除`toRef`包装的复杂性
- 更好的类型推断和安全性
- 清晰的依赖关系

### 📊 **更好的可测试性**
- 独立的store单元
- 清晰的接口边界
- 易于mock和测试

## 迁移步骤

### 1. 旧的Factory Pattern

```typescript
// 旧方式 - 复杂的factory
export const useForumHomeStore = createBaseForumStore('forum-home', {
  pageType: 'home',
  autoLoadPinned: true,
})

// 旧方式 - 复杂的wrapper
export const useForumUserStore = defineStore('forum-user-wrapper', () => {
  const creator = ref<string | null>(null)
  const baseStore = createBaseForumStore('forum-user', {
    pageType: 'user',
    creatorProvider: () => creator.value,
  })()

  return {
    // 大量的toRef包装
    userSubmittedTopic: toRef(baseStore, 'userSubmittedTopic'),
    sort: toRef(baseStore, 'sort'),
    // ... 更多toRef调用
  }
})
```

### 2. 新的Composition Pattern

```typescript
// 新方式 - 清晰的composition
import { useForumHomeComposite } from '~/stores/forum/composites'

// 直接使用，无需复杂配置
const homeStore = useForumHomeComposite()

// 新方式 - 增强的user store
import { useForumUserComposite } from '~/stores/forum/composites'

const userStore = useForumUserComposite()

// 简单易用的API
await userStore.loadUserData(username)
const stats = userStore.getUserStats()
```

### 3. 核心Store访问

```typescript
// 访问专门的核心功能
const homeStore = useForumHomeComposite()

// 搜索功能
homeStore.core.search.setSearchQuery('关键词')
homeStore.core.search.clearSearch()

// 视图功能
homeStore.core.view.setViewMode('List')
homeStore.core.view.toggleCompactMode()

// 路由功能
homeStore.core.route.navigateToFilter('help')
homeStore.core.route.navigateToUser('username')
```

## API对比

### 搜索功能

```typescript
// 旧方式
const searchStore = useForumSearchStore()
searchStore.setSearchQuery('查询')
searchStore.performSearch()

// 新方式 - 集成在核心store中
const homeStore = useForumHomeComposite()
await homeStore.core.performSearch('查询')
```

### 视图管理

```typescript
// 旧方式
const uiStore = useForumUIStore()
uiStore.setViewMode('Card')
uiStore.toggleSidebar()

// 新方式 - 类型安全的专门API
const homeStore = useForumHomeComposite()
homeStore.core.view.setViewMode('Card')
homeStore.core.view.toggleSidebar()
```

### Creator管理

```typescript
// 旧方式 - 复杂的ref管理
const userStore = useForumUserStore()
userStore.creator.value = 'username'

// 新方式 - 清晰的方法调用
const userStore = useForumUserComposite()
await userStore.loadUserData('username')
userStore.creatorManager.setCreator('username')
```

## 性能改进

### 1. 减少包装开销
- 消除大量`toRef`调用
- 直接访问响应式状态
- 更少的代理层级

### 2. 更好的缓存策略
- 专门的`useTopicCache`
- 智能的数据重用
- 事件去重机制

### 3. 按需加载
- 核心store按需初始化
- 模块化的依赖加载
- 更小的运行时包

## 向后兼容性

新架构保持API兼容性：

```typescript
// 仍然支持的基本操作
const store = useForumHomeComposite()
store.loadForumData({ filter: 'help' })
store.searchTopics('查询词')
store.resetState()
```

## 测试示例

```typescript
// 新架构更容易测试
describe('ForumHomeComposite', () => {
  it('should load data correctly', async () => {
    const store = useForumHomeComposite()
    await store.loadForumData()

    expect(store.data.value).toBeDefined()
    expect(store.loading.value).toBe(false)
  })

  it('should handle search correctly', async () => {
    const store = useForumHomeComposite()
    await store.core.performSearch('test query')

    expect(store.core.search.searchQuery.value).toBe('test query')
    expect(store.core.history.recentSearches.value).toContain('test query')
  })
})
```

## 迁移清单

- [ ] 更新组件中的store导入
- [ ] 替换旧的API调用为新的composition API
- [ ] 更新测试文件以使用新的store结构
- [ ] 验证搜索和视图功能正常工作
- [ ] 检查creator管理在用户页面的正确性
- [ ] 确认路由同步功能
- [ ] 更新相关文档

## 常见问题

**Q: 旧的stores还能使用吗？**
A: 暂时可以，但建议逐步迁移到新架构以获得更好的维护性和性能。

**Q: 如何访问底层的专门stores？**
A: 通过`store.core`访问核心功能，每个专门store都有清晰的API。

**Q: 性能会有什么变化？**
A: 新架构减少了代理层级，提供更好的性能和更小的内存占用。