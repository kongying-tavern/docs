<template>
  <Transition appear v-bind="UI.Notification.transition">
    <div
      :class="wrapperClass"
      role="status"
      @mouseover="onMouseover"
      @mouseleave="onMouseleave"
    >
      <div
        :class="[
          UI.Notification.container,
          UI.Notification.rounded,
          UI.Notification.ring,
        ]"
      >
        <div
          class="flex"
          :class="[
            UI.Notification.padding,
            UI.Notification.gap,
            {
              'items-start': description || $slots.description,
              'items-center': !description && !$slots.description,
            },
          ]"
        >
          <span v-if="icon" :class="iconClass + ' ' + icon" />

          <div class="w-0 flex-1">
            <p v-if="title || $slots.title" :class="UI.Notification.title">
              <slot name="title" :title="title">
                {{ title }}
              </slot>
            </p>
            <div
              v-if="description || $slots.description"
              :class="
                twMerge(
                  UI.Notification.description,
                  !title && !$slots.title && 'mt-0 leading-5',
                )
              "
            >
              <slot name="description" :description="description">
                {{ description }}
              </slot>
            </div>
            <div
              v-if="(description || $slots.description) && actions.length"
              :class="Object.values(UI.Notification.default.actionButton)"
            >
              <button
                v-for="(action, index) of actions"
                :key="index"
                v-bind="{ ...action }"
                class="mt-2 focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 flex-shrink-0 font-medium rounded-md text-xs gap-x-1.5 px-2.5 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 text-gray-900 dark:text-white bg-white hover:bg-gray-50 disabled:bg-white aria-disabled:bg-white dark:bg-gray-900 dark:hover:bg-gray-800/50 dark:disabled:bg-gray-900 dark:aria-disabled:bg-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center"
                @click.stop="onAction(action)"
              >
                <label :for="action.label">{{ action.label }}</label>
              </button>
            </div>
          </div>
          <div
            v-if="closeButton || (!description && !$slots.description)"
            :class="
              twMerge(
                Object.values(UI.Notification.default.actionButton),
                'mt-0',
              )
            "
          >
            <template
              v-if="!description && !$slots.description && actions.length"
            >
              <button
                v-for="(action, index) of actions"
                :key="index"
                v-bind="{ ...action }"
                class="mr-2 focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 flex-shrink-0 font-medium rounded-md text-xs gap-x-1.5 px-2.5 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 text-gray-900 dark:text-white bg-white hover:bg-gray-50 disabled:bg-white aria-disabled:bg-white dark:bg-gray-900 dark:hover:bg-gray-800/50 dark:disabled:bg-gray-900 dark:aria-disabled:bg-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center"
                @click.stop="onAction(action)"
              >
                <label :for="action.label">{{ action.label }}</label>
              </button>
            </template>

            <button
              v-if="closeButton"
              class="focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed a inline-flex items-center"
              aria-label="Close"
              @click.stop="onClose"
            >
              <span
                :class="Object.values(UI.Notification.default.closeButton)"
                aria-hidden="true"
              ></span>
            </button>
          </div>
        </div>
        <div v-if="timeout" :class="progressClass" :style="progressStyle" />
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import { twMerge, twJoin } from 'tailwind-merge'
import { UI } from './config'
import { useTimer } from '../../composables/useTimer'
import type { PropType } from 'vue'
import type { NotificationAction } from './types/notification'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: () => '',
  },
  closeButton: {
    type: Boolean,
    default: () => true,
  },
  timeout: {
    type: Number,
    default: () => 5000,
  },
  actions: {
    type: Array as PropType<NotificationAction[]>,
    default: () => [],
  },
  callback: {
    type: Function,
    default: null,
  },
  color: {
    type: String,
    default: () => 'green',
  },
  class: {
    type: [String, Object, Array] as PropType<any>,
    default: () => '',
  },
})

const emit = defineEmits(['close'])

let timer: null | ReturnType<typeof useTimer> = null
const remaining = ref(props.timeout)

const wrapperClass = computed(() => {
  return twMerge(
    twJoin(
      UI.Notification.wrapper,
      UI.Notification.background.replaceAll(
        '[var(--vp-c-bg-elv))]',
        props.color,
      ),
      UI.Notification.rounded,
      UI.Notification.shadow,
      UI.Notification.ring.replaceAll('{color}', props.color),
    ),
    props.class,
  )
})

const progressClass = computed(() => {
  return twJoin(
    UI.Notification.progress.base,
    UI.Notification.progress.background.replaceAll('bg-{color}', props.color),
  )
})

const progressStyle = computed(() => {
  const remainingPercent = (remaining.value / props.timeout) * 100
  return { width: `${remainingPercent || 0}%` }
})

const iconClass = computed(() => {
  return twJoin(
    UI.Notification.icon.base,
    UI.Notification.icon.color.replaceAll('{color}', props.color),
  )
})

function onMouseover() {
  if (timer) {
    timer.pause()
  }
}

function onMouseleave() {
  if (timer) {
    timer.resume()
  }
}

function onClose() {
  if (timer) {
    timer.stop()
  }

  if (props.callback) {
    props.callback()
  }

  emit('close')
}

function onAction(action: NotificationAction) {
  if (timer) {
    timer.stop()
  }

  if (action.click) {
    action.click()
  }

  emit('close')
}

function initTimer() {
  if (timer) {
    timer.stop()
  }

  if (!props.timeout) {
    return
  }

  timer = useTimer(() => {
    onClose()
  }, props.timeout)

  watchEffect(() => {
    // @ts-ignore
    remaining.value = timer.remaining.value
  })
}

watch(() => props.timeout, initTimer)

onMounted(initTimer)

onUnmounted(() => {
  if (timer) {
    timer.stop()
  }
})
</script>
