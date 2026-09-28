import type { ForumFestivalEffectModule, ForumFestivalEffectOptions } from '~/forum/effects/types'

export type ForumFestivalLocale = 'root' | 'en' | 'ja'

export interface ForumFestivalWindow {
  occurrence: string
  start: string
  end: string
  autoTriggerAt: string
}

export interface ForumFestivalDefinition {
  id: string
  priority: number
  locales: readonly ForumFestivalLocale[]
  labelKey: 'christmasSnow' | 'newYearFireworks' | 'springFestivalFireworks'
  icon: string
  durationMs: number
  windows: readonly ForumFestivalWindow[]
  effectOptions?: Omit<ForumFestivalEffectOptions, 'durationMs'>
  loadEffect: () => Promise<ForumFestivalEffectModule>
}

export interface ActiveForumFestival {
  definition: ForumFestivalDefinition
  window: ForumFestivalWindow
}

export interface ForumFestivalAutoStart extends ActiveForumFestival {
  delayMs: number
}

export const FESTIVAL_DISMISSALS_STORAGE_KEY = 'forum-festival-dismissals-v1'
export const FESTIVAL_AUTOPLAYED_STORAGE_KEY = 'forum-festival-autoplayed-v1'
export const FESTIVAL_TIME_ZONE = 'Asia/Shanghai'
export const FESTIVAL_AUTO_TOLERANCE_MS = 60_000

const OCCURRENCE_YEAR_REGEX = /(?:^|-)(\d{4})$/

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: FESTIVAL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function formatFestivalDate(timestamp: number): string {
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(timestamp).map(part => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function normalizeOccurrenceList(value: unknown): string[] {
  if (!Array.isArray(value))
    return []

  return [...new Set(value.filter(item => typeof item === 'string' && item.length > 0))]
}

export function pruneOccurrenceList(values: readonly string[], referenceYear: number): string[] {
  return values.filter((value) => {
    const year = Number(value.match(OCCURRENCE_YEAR_REGEX)?.[1])
    return !Number.isFinite(year) || year >= referenceYear - 1
  })
}

function isWindowActive(window: ForumFestivalWindow, date: string): boolean {
  return window.start <= date && date <= window.end
}

function byPriority(left: ActiveForumFestival, right: ActiveForumFestival): number {
  return right.definition.priority - left.definition.priority
}

export function resolveActiveForumFestival(options: {
  festivals: readonly ForumFestivalDefinition[]
  now: number
  locale: string
  dismissedOccurrences?: readonly string[]
}): ActiveForumFestival | null {
  const date = formatFestivalDate(options.now)
  const dismissed = new Set(options.dismissedOccurrences)

  return options.festivals
    .flatMap(definition => definition.locales.includes(options.locale as ForumFestivalLocale)
      ? definition.windows
          .filter(window => isWindowActive(window, date) && !dismissed.has(window.occurrence))
          .map(window => ({ definition, window }))
      : [])
    .sort(byPriority)[0] ?? null
}

export function resolveForumFestivalAutoStart(options: {
  festivals: readonly ForumFestivalDefinition[]
  enteredAt: number
  now: number
  locale: string
  dismissedOccurrences?: readonly string[]
  autoplayedOccurrences?: readonly string[]
  toleranceMs?: number
}): ForumFestivalAutoStart | null {
  const dismissed = new Set(options.dismissedOccurrences)
  const autoplayed = new Set(options.autoplayedOccurrences)
  const toleranceMs = options.toleranceMs ?? FESTIVAL_AUTO_TOLERANCE_MS

  return options.festivals
    .flatMap(definition => definition.locales.includes(options.locale as ForumFestivalLocale)
      ? definition.windows.flatMap((window) => {
          const triggerAt = Date.parse(window.autoTriggerAt)
          const enteredInWindow = Number.isFinite(triggerAt)
            && Math.abs(options.enteredAt - triggerAt) <= toleranceMs
          if (
            !enteredInWindow
            || dismissed.has(window.occurrence)
            || autoplayed.has(window.occurrence)
          ) {
            return []
          }

          return [{
            definition,
            window,
            delayMs: Math.max(0, triggerAt - options.now),
          }]
        })
      : [])
    .sort(byPriority)[0] ?? null
}
