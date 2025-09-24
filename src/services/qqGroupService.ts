import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

export interface QQGroup {
  id: string
  name: string
  number: string
  link: string
  status: 'suggest' | 'warning' | 'banned' | 'normal'
  tooltip: string
  order?: number
}

class QQGroupService {
  private groups = ref<QQGroup[]>([])
  private isLoaded = false

  constructor() {
    // 监听数据变化，自动保存
    watch(this.groups, () => {
      if (this.isLoaded) {
        this.saveToFile()
      }
    }, { deep: true })
  }

  async loadGroups(): Promise<QQGroup[]> {
    try {
      // 动态导入原始JSON文件
      const module = await import('~/_data/qq-groups.json')
      const originalData = module.default || module
      const originalArray = Array.isArray(originalData) ? originalData : (originalData as any).groups || []

      // 检查是否有本地保存的数据
      const localChanges = localStorage.getItem('qq-groups-local-changes')

      if (localChanges) {
        // 如果有本地数据，合并原始数据和本地数据，本地数据优先
        try {
          const localData = JSON.parse(localChanges)

          // 创建合并后的数据列表
          const mergedGroups: QQGroup[] = []

          // 首先添加本地数据中的所有群组（保持本地的顺序和修改）
          localData.forEach((localGroup: any, index: number) => {
            mergedGroups.push({
              ...localGroup,
              order: index,
            })
          })

          // 然后添加原始数据中存在但本地数据中不存在的新群组
          originalArray.forEach((originalGroup: any) => {
            const existsInLocal = localData.some((localGroup: any) => localGroup.id === originalGroup.id)
            if (!existsInLocal) {
              mergedGroups.push({
                ...originalGroup,
                order: mergedGroups.length,
              })
            }
          })

          this.groups.value = mergedGroups
          this.isLoaded = true

          const newGroupsCount = mergedGroups.length - localData.length
          if (newGroupsCount > 0) {
            console.log(`加载本地数据：${localData.length} 个QQ群（已修改）+ ${newGroupsCount} 个新群组`)
          }
          else {
            console.log(`加载本地数据：${this.groups.value.length} 个QQ群（已修改）`)
          }
          return this.groups.value
        }
        catch (parseError) {
          console.warn('Failed to parse local changes, falling back to original data:', parseError)
          // 如果本地数据解析失败，清除并继续使用原始数据
          localStorage.removeItem('qq-groups-local-changes')
        }
      }

      // 如果没有本地数据或解析失败，使用原始数据
      const validGroups = originalArray.filter((group: any) => {
        if (!group.id || !group.name || !group.number) {
          console.warn('Invalid group data found:', group)
          return false
        }
        return true
      })

      this.groups.value = validGroups.map((group: any, index: number) => ({
        ...group,
        order: group.order ?? index,
      }))

      this.isLoaded = true
      console.log(`成功加载原始数据：${this.groups.value.length} 个QQ群`)
      return this.groups.value
    }
    catch (error) {
      console.error('Failed to load QQ groups:', error)
      toast.error('加载QQ群数据失败，请检查数据文件是否存在')
      return []
    }
  }

  getGroups(): QQGroup[] {
    return [...this.groups.value].sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  addGroup(groupData: Omit<QQGroup, 'id' | 'order'>): QQGroup {
    const newGroup: QQGroup = {
      ...groupData,
      id: `group${Date.now()}`,
      order: this.groups.value.length,
    }

    this.groups.value.push(newGroup)
    return newGroup
  }

  updateGroup(id: string, updates: Partial<Omit<QQGroup, 'id'>>): boolean {
    const index = this.groups.value.findIndex(g => g.id === id)
    if (index === -1) {
      toast.error('群组不存在')
      return false
    }

    this.groups.value[index] = { ...this.groups.value[index], ...updates }
    return true
  }

  deleteGroup(id: string): boolean {
    const index = this.groups.value.findIndex(g => g.id === id)
    if (index === -1) {
      toast.error('群组不存在')
      return false
    }

    this.groups.value.splice(index, 1)
    // 重新排序剩余群组的order字段
    this.groups.value.forEach((group, i) => {
      group.order = i
    })
    return true
  }

  reorderGroups(newOrder: QQGroup[]): void {
    // 更新order字段
    const updatedGroups = newOrder.map((group, index) => ({
      ...group,
      order: index,
    }))

    this.groups.value = updatedGroups
  }

  exportJSON(): string {
    const sortedGroups = this.getGroups()
    // 移除order字段，保持与原始JSON格式一致
    const exportData = sortedGroups.map(({ order, ...group }) => group)
    return JSON.stringify(exportData, null, 2)
  }

  async copyToClipboard(): Promise<boolean> {
    try {
      const jsonData = this.exportJSON()
      await navigator.clipboard.writeText(jsonData)
      toast.success('JSON已复制到剪贴板')
      return true
    }
    catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('复制到剪贴板失败')
      return false
    }
  }

  // 验证群组数据
  validateGroup(group: Partial<QQGroup>): string[] {
    const errors: string[] = []

    if (!group.name?.trim()) {
      errors.push('群名称不能为空')
    }

    if (!group.number?.trim()) {
      errors.push('群号不能为空')
    }
    else if (!/^\d+$/.test(group.number.trim())) {
      errors.push('群号必须是数字')
    }

    if (!group.link?.trim()) {
      errors.push('群链接不能为空')
    }
    else if (!group.link.startsWith('http') && group.link !== '#') {
      errors.push('群链接格式不正确')
    }

    if (!group.status) {
      errors.push('必须选择群状态')
    }

    if (!group.tooltip?.trim()) {
      errors.push('提示信息不能为空')
    }

    return errors
  }

  // 检查群号是否重复
  isDuplicateNumber(number: string, excludeId?: string): boolean {
    return this.groups.value.some(g =>
      g.number === number && g.id !== excludeId,
    )
  }

  // 获取状态统计
  getStatusStats() {
    const stats = {
      suggest: 0,
      warning: 0,
      banned: 0,
      normal: 0,
      total: this.groups.value.length,
    }

    this.groups.value.forEach((group) => {
      stats[group.status]++
    })

    return stats
  }

  private async saveToFile(): Promise<void> {
    try {
      // 保存到 localStorage 作为临时存储
      const dataToSave = this.getGroups()
      localStorage.setItem('qq-groups-local-changes', JSON.stringify(dataToSave))
      console.log('Auto-saving QQ groups data to localStorage...')
    }
    catch (error) {
      console.error('Failed to save QQ groups data:', error)
    }
  }

  // 重置到原始数据
  async resetToOriginalData(): Promise<void> {
    try {
      // 清除本地保存的数据
      localStorage.removeItem('qq-groups-local-changes')

      // 重新加载原始数据
      await this.loadGroups()
    }
    catch (error) {
      console.error('Failed to reset to original data:', error)
      toast.error('重置失败')
    }
  }
}

// 创建单例实例
export const qqGroupService = new QQGroupService()
