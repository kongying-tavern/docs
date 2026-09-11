<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import Time from '@/components/ui/Time/Time.vue'

const { date = new Date(), relative = true, toggleable = true } = defineProps<{
  date?: string | number | Date
  relative?: boolean
  /** 链接内的实例应关闭交互，避免点击时间同时触发跳转 */
  toggleable?: boolean
}>()

const { lang } = useData()

// 浏览器本地语言；SSR 阶段不可用时回退站点 locale
const browserLocale = import.meta.env.SSR ? '' : navigator.language

const parsedDate = computed(() => new Date(date))

// 以浏览器时区判断是否同年，同年时绝对时间省略年份
const isCurrentYear = computed(
  () => parsedDate.value.getFullYear() === new Date().getFullYear(),
)

const absoluteOptions = computed<Intl.DateTimeFormatOptions>(() => ({
  year: isCurrentYear.value ? undefined : 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}))

// 完整本地化时间，Intl 默认使用运行时（用户当前）时区
const absoluteText = computed(() => new Intl.DateTimeFormat(
  browserLocale || lang.value || 'zh-CN',
  absoluteOptions.value,
).format(parsedDate.value))

const showAbsolute = ref(false)
const isRelative = computed(() => relative && !showAbsolute.value)
const canToggle = computed(() => relative && toggleable)

// 绝对时间依赖浏览器语言与时区，挂载后再输出，避免 SSR 水合不一致
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

function toggle() {
  if (canToggle.value)
    showAbsolute.value = !showAbsolute.value
}
</script>

<template>
  <Time
    v-bind="isRelative ? {} : absoluteOptions"
    data-forum-time="true"
    :datetime="date"
    :locale="lang"
    :relative="isRelative"
    :title="isRelative && mounted ? absoluteText : undefined"
    :class="canToggle ? 'cursor-pointer' : 'cursor-default'"
    :role="canToggle ? 'button' : undefined"
    :tabindex="canToggle ? 0 : undefined"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  />
</template>
