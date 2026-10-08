import type { ForumScenario } from './forum-api'
import { test as base, expect } from '@playwright/test'
import { installForumApi } from './forum-api'

/**
 * An option fixture is one object per worker, not one per test: `test.use({ scenario })`
 * supplies the same reference to every test in scope, so a test that mutates it (a
 * pushed topic, `following = false`) would silently change what the next test serves.
 * Snapshot it before the test and put every field back afterwards; tests still mutate
 * the live object mid-test, which is how the mock reacts to scenario changes.
 */
function snapshotScenario(scenario: ForumScenario) {
  return { fields: { ...scenario }, topics: scenario.topics?.slice(), comments: scenario.comments?.slice() }
}

function restoreScenario(scenario: ForumScenario, snapshot: ReturnType<typeof snapshotScenario>) {
  for (const key of Object.keys(scenario))
    Reflect.deleteProperty(scenario, key)
  Object.assign(scenario, snapshot.fields)
  if (scenario.topics && snapshot.topics)
    scenario.topics.splice(0, scenario.topics.length, ...snapshot.topics)
  if (scenario.comments && snapshot.comments)
    scenario.comments.splice(0, scenario.comments.length, ...snapshot.comments)
}

export const test = base.extend<{ forum: Awaited<ReturnType<typeof installForumApi>>, scenario: ForumScenario }>({
  scenario: [{}, { option: true }],
  forum: [async ({ page, scenario }, use) => {
    const snapshot = snapshotScenario(scenario)
    const api = await installForumApi(page, scenario)
    try {
      await use(api)
    }
    finally {
      restoreScenario(scenario, snapshot)
    }
    expect(api.unexpected, 'Every business request must be explicitly mocked').toEqual([])
  }, { auto: true }],
})
export { expect } from '@playwright/test'
