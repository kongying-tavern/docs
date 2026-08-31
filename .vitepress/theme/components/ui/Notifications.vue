<script lang="ts" setup>
import type { PropType } from 'vue'
import type { Notification } from './types/notification.d'
import { computed, ref, watchEffect } from 'vue'

import { cn } from '@/lib/utils'

import { useNotificationStore } from '@/stores/useNotification'

import { UI } from './config'
import NotificationItem from './Notification.vue'

const props = defineProps({
  class: {
    type: [String, Object, Array] as PropType<string | Record<string, boolean> | string[]>,
    default: () => '',
  },
})

const toast = useNotificationStore()
const notifications = ref<Notification[]>(toast.notifications)

watchEffect(() => {
  notifications.value = toast.notifications
})

const wrapperClass = computed(() => {
  return cn(
    UI.Notifications.wrapper,
    UI.Notifications.position,
    UI.Notifications.width,
    props.class,
  )
})
</script>

<template>
  <Teleport to="body">
    <div :class="wrapperClass" role="region">
      <div v-if="notifications.length" :class="UI.Notifications.container">
        <div v-for="notification in notifications" :key="notification.id">
          <NotificationItem
            v-bind="notification"
            :class="notification.click && 'cursor-pointer'"
            @click="notification.click && notification.click(notification)"
            @close="toast.remove(notification.id)"
          >
            <!-- <template v-for="(_, name) in $slots" #[name]="slotData">
              <slot :name="name" v-bind="slotData" />
            </template> -->
          </NotificationItem>
        </div>
      </div>
    </div>
  </Teleport>
</template>
