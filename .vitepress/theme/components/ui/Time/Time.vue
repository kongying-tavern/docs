<script setup lang="ts">
import { useData } from 'vitepress'
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue'
import { DEFAULT_LOCALE } from '~/constants/site'
import { subscribeRelativeTime } from '~/services/relativeTimeClock'
import { relativeTimeValue } from '~/utils/dateTime'

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

const { lang } = useData()

const date = computed(() => {
  const rawDate = props.datetime
  return new Date(rawDate)
})

const now = ref(new Date())
const mounted = ref(false)
const active = ref(false)
let unsubscribe: (() => void) | undefined

watch([() => active.value && props.relative, () => date.value.getTime()], ([enabled]) => {
  unsubscribe?.()
  unsubscribe = enabled && Number.isFinite(date.value.getTime())
    ? subscribeRelativeTime(() => date.value.getTime(), value => now.value = new Date(value))
    : undefined
}, { flush: 'sync' })

onMounted(() => {
  mounted.value = true
  active.value = true
})
onActivated(() => active.value = true)
onDeactivated(() => active.value = false)

onBeforeUnmount(() => {
  active.value = false
  unsubscribe?.()
})

const formatter = computed(() => {
  const { locale: propsLocale, relative, title, datetime, ...rest } = props
  const locale = propsLocale || lang.value || DEFAULT_LOCALE
  if (relative) {
    return new Intl.RelativeTimeFormat(locale)
  }
  return new Intl.DateTimeFormat(locale, rest)
})

const formattedDate = computed(() => {
  if (!Number.isFinite(date.value.getTime()))
    return ''
  // Build hosts and visitors can have different time zones (and clocks).
  // Hydrate a stable absolute date first, then apply the visitor's local format.
  if (!mounted.value) {
    const { locale, relative, title, datetime, ...options } = props
    return new Intl.DateTimeFormat(locale || lang.value || DEFAULT_LOCALE, {
      ...options,
      timeZone: options.timeZone || 'UTC',
    }).format(date.value)
  }
  if (props.relative) {
    const { unit, value } = relativeTimeValue(date.value.getTime(), now.value.getTime())
    return formatter.value.format(value, unit)
  }

  return (formatter.value as Intl.DateTimeFormat).format(date.value)
})

const isoDate = computed(() => Number.isFinite(date.value.getTime()) ? date.value.toISOString() : undefined)

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
    class="tabular-nums"
    :datetime="isoDate"
    :title="title"
  >{{ formattedDate }}</time>
</template>
