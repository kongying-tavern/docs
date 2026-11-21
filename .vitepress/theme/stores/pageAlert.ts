import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type PageAlertVariant = 'default' | 'destructive'

export interface PageAlertItem {
  id: string
  variant: PageAlertVariant
  title: string
  description?: string
}

const MAX_ALERTS = 3

export const usePageAlertStore = defineStore('page-alert', () => {
  const alerts = ref<PageAlertItem[]>([])
  // 已挂载的告警区域数，为 0 时通知服务回退为 toast
  const regionCount = ref(0)

  const hasRegion = computed(() => regionCount.value > 0)

  function push(item: PageAlertItem): void {
    alerts.value = [item, ...alerts.value.filter(alert => alert.id !== item.id)].slice(0, MAX_ALERTS)
  }

  function dismiss(id: string): void {
    alerts.value = alerts.value.filter(alert => alert.id !== id)
  }

  function clear(): void {
    alerts.value = []
  }

  function registerRegion(): void {
    regionCount.value += 1
  }

  function unregisterRegion(): void {
    regionCount.value = Math.max(regionCount.value - 1, 0)
  }

  return {
    alerts,
    hasRegion,
    push,
    dismiss,
    clear,
    registerRegion,
    unregisterRegion,
  }
})
