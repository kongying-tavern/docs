import { createGlobalState } from '@vueuse/core'
import { onMounted, readonly, ref } from 'vue'
import { BroadcastChannelSync } from '~/services/events/BroadcastChannelSync'

const useGlobalBroadcastChannelSync = createGlobalState(() => {
  const instance = ref<BroadcastChannelSync | null>(null)
  const isEnabled = ref(false)

  const initInstance = () => {
    if (typeof window !== 'undefined' && !import.meta.env.SSR && !instance.value) {
      try {
        instance.value = BroadcastChannelSync.getInstance()
        instance.value.enable()
        isEnabled.value = true
      }
      catch (error) {
        console.warn('[BroadcastChannelSync] 初始化失败:', error)
      }
    }
  }

  return {
    instance,
    isEnabled,
    initInstance,
  }
})

export function useBroadcastChannelSync() {
  const { instance, isEnabled, initInstance } = useGlobalBroadcastChannelSync()

  onMounted(() => {
    initInstance()
  })

  return {
    instance: readonly(instance),
    isEnabled: readonly(isEnabled),
    getStatus: () => instance.value?.getStatus() ?? null,
  }
}

export function enableBroadcastChannelSync() {
  if (typeof window !== 'undefined' && !import.meta.env.SSR) {
    try {
      const instance = BroadcastChannelSync.getInstance()
      instance.enable()
      return instance
    }
    catch (error) {
      console.warn('[useBroadcastChannelSync] 无法在当前环境启用:', error)
      return null
    }
  }
  return null
}

export function getBroadcastChannelSync() {
  if (typeof window !== 'undefined' && !import.meta.env.SSR) {
    try {
      return BroadcastChannelSync.getInstance()
    }
    catch {
      return null
    }
  }
  return null
}
