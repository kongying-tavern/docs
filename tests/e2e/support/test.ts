import type { ForumScenario } from './forum-api'
import { test as base, expect } from '@playwright/test'
import { installForumApi } from './forum-api'

export const test = base.extend<{ forum: Awaited<ReturnType<typeof installForumApi>>, scenario: ForumScenario }>({
  scenario: [{}, { option: true }],
  forum: [async ({ page, scenario }, use) => {
    const originalHandler = scenario.handle
    const api = await installForumApi(page, scenario)
    try {
      await use(api)
    }
    finally {
      scenario.handle = originalHandler
    }
    expect(api.unexpected, 'Every business request must be explicitly mocked').toEqual([])
  }, { auto: true }],
})
export { expect } from '@playwright/test'
