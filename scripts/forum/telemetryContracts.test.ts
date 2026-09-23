/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('telemetry keeps reporting, session, and settings boundaries intact', async () => {
  const [head, clarity, session, telemetryPanel, hub, gitee, commentInput, publishForm, settingsPage, sidebar] = await Promise.all([
    readFile(new URL('../../.vitepress/config/head.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/telemetry/clarity.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/telemetry/session.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/telemetry/TelemetrySettings.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/apis/interknot.site/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/forum/gitee/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/comment/ForumCommentInputBox.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/settings/SettingsPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/sidebar/ForumSidebarInformationMenu.vue', import.meta.url), 'utf8'),
  ])

  assert.match(head, /dataset\.clarityLoaded="true"[\s\S]*clarity-ready/)
  assert.match(clarity, /addEventListener\('clarity-ready', flushPending, \{ once: true \}\)/)
  assert.match(clarity, /revokeClarityConsent[\s\S]*pending\.length = 0[\s\S]*analytics_Storage: 'denied'/)
  assert.doesNotMatch(clarity, /setInterval/)
  assert.doesNotMatch(hub, /retryCount === 0/)
  assert.match(gitee, /const mappedError = toGiteeAPIError[\s\S]*reportRequestFailure\(mappedError\)[\s\S]*throw mappedError/)
  assert.match(session, /expiresAt: Date\.now\(\) \+ SESSION_IDLE_MS[\s\S]*rotated[\s\S]*if \(!rotated\)/)
  assert.match(telemetryPanel, /:display-label="sessionId"/)
  assert.match(commentInput, /formatImageAttachmentError[\s\S]*\{ report: false \}/)
  assert.match(publishForm, /imageErrorText\(error\), \{ report: false \}/)
  assert.match(settingsPage, /<TelemetrySettings/)
  assert.doesNotMatch(sidebar, /<TelemetrySettings/)
})
