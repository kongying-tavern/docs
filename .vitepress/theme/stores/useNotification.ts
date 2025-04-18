import type { Notification } from '../components/ui/types/notification'
import { defineStore } from 'pinia'

import { ref } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  function add(notification: Partial<Notification>) {
    const body = {
      id: new Date().getTime().toString(),
      ...notification,
    }

    const index = notifications.value.findIndex(
      (n: Notification) => n.id === body.id,
    )
    if (index === -1) {
      notifications.value.push(body as Notification)
    }

    return body
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(
      (n: Notification) => n.id !== id,
    )
  }

  function update(id: string, notification: Partial<Notification>) {
    const index = notifications.value.findIndex(
      (n: Notification) => n.id === id,
    )
    if (index !== -1) {
      const previous = notifications.value[index]
      notifications.value.splice(index, 1, { ...previous, ...notification })
    }
  }

  function clear() {
    notifications.value = []
  }

  return {
    add,
    remove,
    update,
    clear,
    notifications,
  }
})
