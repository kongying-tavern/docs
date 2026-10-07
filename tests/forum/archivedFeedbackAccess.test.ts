import type ForumAPI from '../../src/forum/api/types'
import assert from 'node:assert/strict'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { test } from 'vitest'
import { createSSRApp, effectScope, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import teamMembers from '../../src/_data/teamMemberList.json'
import { useArchivedFeedbackAccess } from '../../src/forum/composables/auth/useArchivedFeedbackAccess'
import { useUserAuthStore } from '../../src/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '../../src/forum/stores/auth/useUserInfo'

test('archived feedback requires a logged-in administrator or the queried creator', async () => {
  const app = createSSRApp({ setup: () => () => null })
    .use(createPinia())
    .use(PiniaColada, { queryOptions: { gcTime: 0 } })
  await renderToString(app)
  const scope = effectScope()
  const loggedIn = ref(false)
  const creator = ref<string | null>('alice')
  try {
    app.runWithContext(() => {
      const auth = useUserAuthStore()
      Object.defineProperty(auth, 'isLoggedIn', { get: () => loggedIn.value })
      const info = useUserInfoStore()
      info.info = { id: -1, login: 'Alice' } as ForumAPI.User
      const access = scope.run(() => useArchivedFeedbackAccess(creator))!
      assert.equal(access.value, false)
      loggedIn.value = true
      assert.equal(access.value, true)
      creator.value = 'bob'
      assert.equal(access.value, false)
      creator.value = null
      assert.equal(access.value, false)
      info.info = teamMembers.data[0] as ForumAPI.User
      assert.equal(access.value, true)
      creator.value = 'bob'
      assert.equal(access.value, true)
      loggedIn.value = false
      assert.equal(access.value, false)
    })
  }
  finally {
    scope.stop()
  }
})
