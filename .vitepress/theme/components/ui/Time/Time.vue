<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

const props = withDefaults(defineProps<{
  locale?: string
  datetime: string | number | Date
  localeMatcher?: 'best fit' | 'lookup'
  weekday?: 'long' | 'short' | 'narrow'
  era?: 'long' | 'short' | 'narrow'
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  day?: 'numeric' | '2-digit'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  second?: 'numeric' | '2-digit'
  timeZoneName?: 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric'
  formatMatcher?: 'best fit' | 'basic'
  hour12?: boolean
  timeZone?: string

  calendar?: string
  dayPeriod?: 'narrow' | 'short' | 'long'
  numberingSystem?: string

  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
  relative?: boolean
  title?: boolean | string
}>(), {
  hour12: undefined,
})

const date = computed(() => {
  const rawDate = props.datetime
  if (!rawDate)
    return new Date()
  return new Date(rawDate)
})

const now = ref(new Date())
let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (props.relative) {
    now.value = new Date()
    interval = setInterval(() => {
      now.value = new Date()
    }, 1000)
  }
})

onBeforeUnmount(() => {
  if (interval)
    clearInterval(interval)
})

const formatter = computed(() => {
  const { locale: propsLocale, relative, ...rest } = props
  const locale = propsLocale || import.meta.env.SSR ? 'zh-CN' : navigator.language
  if (relative) {
    return new Intl.RelativeTimeFormat(locale, rest)
  }
  return new Intl.DateTimeFormat(locale, rest)
})

const formattedDate = computed(() => {
  if (props.relative) {
    const diffInSeconds = (date.value.getTime() - now.value.getTime()) / 1000
    const units: Array<{ unit: Intl.RelativeTimeFormatUnit, value: number }> = [
      { unit: 'second', value: diffInSeconds },
      { unit: 'minute', value: diffInSeconds / 60 },
      { unit: 'hour', value: diffInSeconds / 3600 },
      { unit: 'day', value: diffInSeconds / 86400 },
      { unit: 'month', value: diffInSeconds / 2592000 },
      { unit: 'year', value: diffInSeconds / 31536000 },
    ]
    const { unit, value } = units.find(({ value }) => Math.abs(value) < 60) || units[units.length - 1]!
    return formatter.value.format(Math.round(value), unit)
  }

  return (formatter.value as Intl.DateTimeFormat).format(date.value)
})

const isoDate = computed(() => date.value.toISOString())

const title = computed(() => {
  if (props.title === true)
    return isoDate.value
  if (typeof props.title === 'string')
    return props.title
  return undefined
})

const dataset: Record<string, string | number | boolean | Date | undefined> = {}
for (const prop in props) {
  if (prop !== 'datetime') {
    const value = props[prop as keyof typeof props]
    if (value != null) {
      const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      dataset[`data-${kebab}`] = value
    }
  }
}
</script>

<template>
  <time
    v-bind="dataset"
    :datetime="isoDate"
    :title="title"
  >{{ formattedDate }}</time>
</template>
