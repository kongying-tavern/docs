/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type { ForumFestivalDefinition } from '../../src/forum/services/festival'
import assert from 'node:assert/strict'
import test from 'node:test'
import { forumFestivals } from '../../src/forum/config/festivals'
import {
  FESTIVAL_AUTO_TOLERANCE_MS,
  formatFestivalDate,
  normalizeOccurrenceList,
  pruneOccurrenceList,
  resolveActiveForumFestival,
  resolveForumFestivalAutoStart,
} from '../../src/forum/services/festival'

function timestamp(value: string): number {
  return Date.parse(value)
}

test('formats festival dates in Asia/Shanghai rather than the host timezone', () => {
  assert.equal(formatFestivalDate(timestamp('2026-09-24T16:00:00Z')), '2026-09-25')
  assert.equal(formatFestivalDate(timestamp('2026-09-24T15:59:59Z')), '2026-09-24')
})

test('resolves localized fixed and lunar festival windows', () => {
  const springFestival = timestamp('2026-02-17T12:00:00+08:00')
  assert.equal(resolveActiveForumFestival({
    festivals: forumFestivals,
    now: springFestival,
    locale: 'root',
  })?.definition.id, 'spring-festival')
  assert.equal(resolveActiveForumFestival({
    festivals: forumFestivals,
    now: springFestival,
    locale: 'en',
  }), null)

  const christmas = timestamp('2026-12-24T00:00:00+08:00')
  assert.equal(resolveActiveForumFestival({
    festivals: forumFestivals,
    now: christmas,
    locale: 'ja',
  })?.definition.id, 'christmas')
})

test('includes festival window boundaries and excludes the next day', () => {
  const options = { festivals: forumFestivals, locale: 'root' }
  assert.equal(resolveActiveForumFestival({
    ...options,
    now: timestamp('2026-02-22T23:59:59+08:00'),
  })?.definition.id, 'spring-festival')
  assert.equal(resolveActiveForumFestival({
    ...options,
    now: timestamp('2026-02-23T00:00:00+08:00'),
  }), null)
  assert.equal(resolveActiveForumFestival({
    ...options,
    now: timestamp('2026-12-31T00:00:00+08:00'),
  })?.definition.id, 'new-year')
  assert.equal(resolveActiveForumFestival({
    ...options,
    now: timestamp('2027-01-02T23:59:59+08:00'),
  })?.window.occurrence, 'new-year-2027')
})

test('dismissal applies only to one festival occurrence', () => {
  assert.equal(resolveActiveForumFestival({
    festivals: forumFestivals,
    now: timestamp('2026-12-25T12:00:00+08:00'),
    locale: 'root',
    dismissedOccurrences: ['christmas-2026'],
  }), null)
  assert.equal(resolveActiveForumFestival({
    festivals: forumFestivals,
    now: timestamp('2027-12-25T12:00:00+08:00'),
    locale: 'root',
    dismissedOccurrences: ['christmas-2026'],
  })?.window.occurrence, 'christmas-2027')
})

test('automatic start uses an inclusive one-minute entry window', () => {
  const triggerAt = timestamp('2027-01-01T00:00:00+08:00')
  const resolve = (offset: number, now = triggerAt) => resolveForumFestivalAutoStart({
    festivals: forumFestivals,
    enteredAt: triggerAt + offset,
    now,
    locale: 'en',
  })

  assert.equal(resolve(-FESTIVAL_AUTO_TOLERANCE_MS - 1), null)
  assert.equal(resolve(-FESTIVAL_AUTO_TOLERANCE_MS, triggerAt - FESTIVAL_AUTO_TOLERANCE_MS)?.delayMs, FESTIVAL_AUTO_TOLERANCE_MS)
  assert.equal(resolve(-1, triggerAt - 1)?.delayMs, 1)
  assert.equal(resolve(0)?.delayMs, 0)
  assert.equal(resolve(FESTIVAL_AUTO_TOLERANCE_MS)?.delayMs, 0)
  assert.equal(resolve(FESTIVAL_AUTO_TOLERANCE_MS + 1), null)
})

test('automatic start respects locale, dismissal, and prior playback', () => {
  const triggerAt = timestamp('2026-02-17T00:00:00+08:00')
  const base = {
    festivals: forumFestivals,
    enteredAt: triggerAt,
    now: triggerAt,
  }
  assert.equal(resolveForumFestivalAutoStart({ ...base, locale: 'en' }), null)
  assert.equal(resolveForumFestivalAutoStart({
    ...base,
    locale: 'root',
    dismissedOccurrences: ['spring-festival-2026'],
  }), null)
  assert.equal(resolveForumFestivalAutoStart({
    ...base,
    locale: 'root',
    autoplayedOccurrences: ['spring-festival-2026'],
  }), null)
})

test('resolver uses explicit priority and never invokes effect loaders', () => {
  let loaderCalls = 0
  const makeFestival = (id: string, priority: number): ForumFestivalDefinition => ({
    id,
    priority,
    locales: ['root'],
    labelKey: 'christmasSnow',
    icon: 'test',
    durationMs: 1000,
    windows: [{
      occurrence: `${id}-2026`,
      start: '2026-01-01',
      end: '2026-01-01',
      autoTriggerAt: '2026-01-01T00:00:00+08:00',
    }],
    loadEffect: async () => {
      loaderCalls += 1
      throw new Error('should not load')
    },
  })
  const resolved = resolveActiveForumFestival({
    festivals: [makeFestival('low', 1), makeFestival('high', 10)],
    now: timestamp('2026-01-01T12:00:00+08:00'),
    locale: 'root',
  })

  assert.equal(resolved?.definition.id, 'high')
  assert.equal(loaderCalls, 0)
})

test('festival registry has valid unique occurrences and bounded durations', () => {
  const ids = new Set<string>()
  const occurrences = new Set<string>()
  for (const festival of forumFestivals) {
    assert.equal(ids.has(festival.id), false)
    ids.add(festival.id)
    assert.ok(festival.durationMs > 0 && festival.durationMs <= 20_000)
    assert.ok(festival.locales.length > 0)
    assert.ok(festival.windows.length > 0)
    for (const window of festival.windows) {
      assert.equal(occurrences.has(window.occurrence), false)
      occurrences.add(window.occurrence)
      assert.ok(window.start <= window.end)
      const triggerDate = formatFestivalDate(timestamp(window.autoTriggerAt))
      assert.ok(window.start <= triggerDate && triggerDate <= window.end)
    }
  }
  assert.deepEqual(forumFestivals.map(festival => festival.id), [
    'spring-festival',
    'new-year',
    'christmas',
  ])
  assert.equal(forumFestivals[0].effectOptions.fireworkStyle, 'spring-festival')
  assert.equal(forumFestivals[1].effectOptions.fireworkStyle, 'new-year')
  assert.equal(forumFestivals[0].windows.at(-1)?.occurrence, 'spring-festival-2030')
})

test('normalizes malformed occurrence storage and prunes old years', () => {
  assert.deepEqual(normalizeOccurrenceList(null), [])
  assert.deepEqual(normalizeOccurrenceList(['christmas-2026', 1, '', 'christmas-2026']), ['christmas-2026'])
  assert.deepEqual(
    pruneOccurrenceList(['christmas-2024', 'new-year-2025', 'spring-festival-2026', 'custom'], 2026),
    ['new-year-2025', 'spring-festival-2026', 'custom'],
  )
})
