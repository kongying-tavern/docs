import type { ForumFestivalDefinition, ForumFestivalWindow } from '~/forum/services/forumFestival'

const CONFIGURED_YEARS = [2025, 2026, 2027, 2028, 2029, 2030] as const

function date(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(value: string, days: number): string {
  const next = new Date(`${value}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

function fixedChristmasWindows(): ForumFestivalWindow[] {
  return CONFIGURED_YEARS.map(year => ({
    occurrence: `christmas-${year}`,
    start: date(year, 12, 24),
    end: date(year, 12, 26),
    autoTriggerAt: `${date(year, 12, 25)}T00:00:00+08:00`,
  }))
}

function fixedNewYearWindows(): ForumFestivalWindow[] {
  return CONFIGURED_YEARS.map(year => ({
    occurrence: `new-year-${year}`,
    start: date(year - 1, 12, 31),
    end: date(year, 1, 2),
    autoTriggerAt: `${date(year, 1, 1)}T00:00:00+08:00`,
  }))
}

function lunarFestivalWindow(id: string, festivalDate: string, startOffset: number, endOffset: number): ForumFestivalWindow {
  const year = festivalDate.slice(0, 4)
  return {
    occurrence: `${id}-${year}`,
    start: addDays(festivalDate, startOffset),
    end: addDays(festivalDate, endOffset),
    autoTriggerAt: `${festivalDate}T00:00:00+08:00`,
  }
}

const SPRING_FESTIVAL_DATES = [
  '2025-01-29',
  '2026-02-17',
  '2027-02-06',
  '2028-01-26',
  '2029-02-13',
  '2030-02-03',
] as const

export const forumFestivals = [
  {
    id: 'spring-festival',
    priority: 40,
    locales: ['root'],
    labelKey: 'springFestivalFireworks',
    icon: 'i-lucide-sparkles',
    durationMs: 6000,
    windows: SPRING_FESTIVAL_DATES.map(value => lunarFestivalWindow('spring-festival', value, -1, 5)),
    effectOptions: {
      fireworkStyle: 'spring-festival',
      palette: ['#ff1f3d', '#ff3d00', '#ffb300', '#ffd54f'],
    },
    loadEffect: () => import('~/forum/effects/fireworks'),
  },
  {
    id: 'new-year',
    priority: 20,
    locales: ['root', 'en', 'ja'],
    labelKey: 'newYearFireworks',
    icon: 'i-lucide-party-popper',
    durationMs: 6000,
    windows: fixedNewYearWindows(),
    effectOptions: {
      fireworkStyle: 'new-year',
      palette: ['#38bdf8', '#f8fafc', '#facc15', '#fb7185'],
    },
    loadEffect: () => import('~/forum/effects/fireworks'),
  },
  {
    id: 'christmas',
    priority: 10,
    locales: ['root', 'en', 'ja'],
    labelKey: 'christmasSnow',
    icon: 'i-lucide-snowflake',
    durationMs: 20_000,
    windows: fixedChristmasWindows(),
    loadEffect: () => import('~/forum/effects/snow'),
  },
] as const satisfies readonly ForumFestivalDefinition[]
