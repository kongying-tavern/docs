/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { extractOfficialAndAuthorComments } from '../../.vitepress/theme/apis/forum/gitee/inBrowserUtils'
import { normalizeComment, normalizeIssue } from '../../.vitepress/theme/apis/forum/gitee/utils'
import { cn } from '../../.vitepress/theme/lib/utils'
import { composeTopicBody, writeTopicBodyComment } from '../../src/composables/composeTopicBody'
import {
  LEGACY_PLAIN_COMMENT,
  LEGACY_PLAIN_TOPIC,
  MALFORMED_COMMENT_JSON,
  TIPTAP_WITH_LITERAL_MENTION_TEXT,
  VALID_JSON_PLAIN_TEXTS,
  VALID_TIPTAP_DOC,
} from './fixtures/content'

const user = {
  id: 7,
  login: 'alice',
  name: 'Alice',
  avatar_url: 'https://assets.example/alice.png',
  html_url: 'https://gitee.com/alice',
} as GITEE.User

test('shared class merging preserves component override semantics', () => {
  assert.equal(cn('border border-transparent', 'border-divider'), 'border border-divider')
  assert.equal(cn('justify-center rounded-md h-8 w-8', 'justify-start rounded-full h-20 w-20'), 'justify-start rounded-full h-20 w-20')
})

test('comment emoji and self-profile actions keep their display contracts', async () => {
  const [commentSource, profileSource, profileStateSource, hoverCardSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/comment/ForumTopicComment.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/user/ForumUserProfileHeader.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/user/composables/useUserProfile.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/user/ForumUserHoverCard.vue', import.meta.url), 'utf8'),
  ])

  assert.match(commentSource, /\.content :deep\(img\[data-emoji\]\)/)
  assert.match(commentSource, /width: 20px;[\s\S]*height: 20px;/)
  assert.equal(profileSource.match(/v-if="!isAuthorizedUser"/g)?.length, 2)
  assert.match(profileStateSource, /String\(renderedUser\.value\.id\) === String\(userInfo\.info\?\.id\)/)
  assert.match(hoverCardSource, /v-if="!isAuthorizedUser"/)
  assert.match(hoverCardSource, /useForumUserProfileQuery/)
  assert.doesNotMatch(hoverCardSource, /user-hover|userAPI\.getUser/)
})

test('official comment extraction receives permission state from its caller', () => {
  const authorComment = { ...comment('author'), id: 1, user, target: { issue: { id: 101 } } }
  const officialComment = {
    ...comment('official'),
    id: 2,
    user: { ...user, id: 8, login: 'moderator' },
    target: { issue: { id: 101 } },
  }
  const sourceIssue = { ...issue('body'), id: 101 } as GITEE.IssueInfo
  const result = extractOfficialAndAuthorComments(
    sourceIssue,
    [authorComment, officialComment] as unknown as GITEE.CommentList,
    userId => Number(userId) === 8,
  )

  assert.deepEqual(result?.map(item => item.id), [1, 2])
})

test('translated comment text is never interpolated as HTML', async () => {
  const source = await readFile(new URL('../../src/components/forum/comment/ForumTopicComment.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /v-html="[^"]*translatedText/)
  assert.match(source, /\{\{\s*showingTranslation \? translatedText : content\.text\s*\}\}/)
  assert.match(source, /v-html="content\.html"/)
})

test('comment scrolling hooks register during component setup', async () => {
  const [stateSource, areaSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/comment/composables/useCommentAreaState.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/comment/ForumCommentArea.vue', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(stateSource, /function initialize/)
  assert.match(stateSource, /if \(!import\.meta\.env\.SSR\) \{\s+useInfiniteScroll/)
  assert.match(areaSource, /const inputObservationTarget = computed/)
  assert.doesNotMatch(areaSource, /stopObserver|onUnmounted\(cleanup\)/)
})

test('Forum hash changes preserve VitePress History state', async () => {
  const [hashCheckerSource, domUtilsSource] = await Promise.all([
    readFile(new URL('../../.vitepress/theme/hooks/useHashChecker.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/utils/dom-utils.ts', import.meta.url), 'utf8'),
  ])

  assert.match(hashCheckerSource, /replaceState\(history\.state/)
  assert.match(domUtilsSource, /replaceState\(history\.state/)
  assert.doesNotMatch(`${hashCheckerSource}\n${domUtilsSource}`, /replaceState\(null/)
})

test('Topic Tags editor has one Forum-wide lazy host', async () => {
  const [forumLayout, topicPage, userPage, basePage] = await Promise.all([
    readFile(new URL('../../.vitepress/theme/layouts/Forum.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/topic/ForumTopicPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/user/ForumUserPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/base/BaseForumPage.vue', import.meta.url), 'utf8'),
  ])

  assert.match(forumLayout, /import\('~\/components\/forum\/topic\/ForumTopicTagsEditorDialog\.vue'\)/)
  assert.match(forumLayout, /<ForumTopicTagsEditorDialog v-if="shouldMountTopicTagsEditor" \/>/)
  assert.doesNotMatch(`${topicPage}\n${userPage}\n${basePage}`, /ForumTopicTagsEditorDialog|name="teleport"/)
})

test('expanded personal sidebar sections bound live detail hydration', async () => {
  const sidebarSource = await readFile(new URL('../../src/components/forum/sidebar/ForumSidebar.vue', import.meta.url), 'utf8')

  assert.match(sidebarSource, /const SIDEBAR_DETAIL_QUERY_LIMIT = 5/)
  assert.equal(sidebarSource.match(/Array\.from\(\{ length: SIDEBAR_DETAIL_QUERY_LIMIT \}/g)?.length, 2)
  assert.equal(sidebarSource.match(/\.slice\(0, 20\)/g)?.length, 3)
})

test('topic authors can close their own feedback from the topic menu', async () => {
  const [permissionsSource, menuSource, routeSource, topicStateSource] = await Promise.all([
    readFile(new URL('../../src/composables/useRuleChecks.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/defineTopicDropdownMenu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/useForumRoute.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/topic/composables/useTopicPageState.ts', import.meta.url), 'utf8'),
  ])

  assert.match(permissionsSource, /author: \['edit_feedback'\]/)
  assert.match(menuSource, /label: closeState\.value \? menuLabels\.value\.reopenFeedback\.text : menuLabels\.value\.closeFeedback\.text/)
  assert.match(menuSource, /action: handleToggleCloseTopic/)
  assert.match(routeSource, /window\.history\.back\(\)[\s\S]*router\.go\(homeHref\(\)\)/)
  assert.match(menuSource, /await leaveTopic\(\)/)
  assert.match(topicStateSource, /backToPreviousPage: leaveTopic/)
  assert.doesNotMatch(`${menuSource}\n${topicStateSource}`, /window\.history\.back\(\)/)
})

function issue(body: string): GITEE.IssueInfo {
  return {
    number: 'I12345',
    title: 'BUG:Codec contract',
    body,
    user: user as unknown as GITEE.UserInfo,
    labels: [],
    state: 'open',
    html_url: 'https://gitee.com/example/issues/I12345',
    comments: 0,
    created_at: '2026-08-24T00:00:00Z',
    updated_at: '2026-08-24T01:00:00Z',
  } as unknown as GITEE.IssueInfo
}

function comment(body: string): GITEE.Comment {
  return {
    id: 42,
    body,
    user,
    created_at: '2026-08-24T00:00:00Z',
    updated_at: '2026-08-24T01:00:00Z',
  } as GITEE.Comment
}

test('composeTopicBody keeps labels unique and state rewrites preserve existing labels', () => {
  const body = 'Body\n![diagram](https://assets.example/diagram.webp){thumbhash:"hash",width:"640",height:"480"}'
  const composed = composeTopicBody(body, {
    labels: ['WEB-FEEDBACK', null, 'WEB-FEEDBACK', 'CATA-DOCS'],
    state: 'open',
  })
  assert.equal(
    composed,
    `<!-- {"labels":["WEB-FEEDBACK","CATA-DOCS"],"state":"open"} -->${body}`,
  )
  const rewritten = writeTopicBodyComment(composed, { state: 'closed' })
  assert.equal(rewritten, `<!-- {"labels":["WEB-FEEDBACK","CATA-DOCS"],"state":"closed"} -->${body}`)
  assert.equal(rewritten.slice(rewritten.indexOf('-->') + 3), body)
})

test('normalizes Topics as plain text even when their content looks like Tiptap', () => {
  const raw = JSON.stringify(VALID_TIPTAP_DOC)
  const topic = normalizeIssue(issue(raw))
  assert.equal(topic.content.text, raw)
  assert.equal(topic.type, 'BUG')
  assert.equal(topic.title, 'Codec contract')
})

test('normalizes pinned state from the authoritative Gitee label', () => {
  const pinnedIssue = issue('Body')
  pinnedIssue.labels = [{ name: 'PINNED' }] as GITEE.IssueLabel[]
  assert.equal(normalizeIssue(pinnedIssue).pinned, true)
  assert.equal(normalizeIssue(issue('Body')).pinned, false)
})

test('normalizes the authoritative Gitee close time', () => {
  const closedIssue = issue('Body')
  closedIssue.state = 'closed'
  closedIssue.finished_at = '2026-08-25T12:00:00Z'
  assert.equal(normalizeIssue(closedIssue).closedAt, closedIssue.finished_at)
})

test('preserves legacy plain Topic and Comment bodies', () => {
  assert.equal(normalizeIssue(issue(LEGACY_PLAIN_TOPIC)).content.text, LEGACY_PLAIN_TOPIC)
  assert.equal(normalizeComment(comment(LEGACY_PLAIN_COMMENT)).content.text, LEGACY_PLAIN_COMMENT)
})

test('keeps serialized Comment JSON parseable and never injects mention HTML', () => {
  const raw = JSON.stringify(VALID_TIPTAP_DOC)
  const normalized = normalizeComment(comment(raw))

  assert.deepEqual(JSON.parse(normalized.content.text), VALID_TIPTAP_DOC)
  assert.equal(normalized.content.text.includes('<a'), false)
  assert.equal(normalized.content.text.includes('@alice'), false)
  assert.equal(normalizeComment(comment('hello @alice')).content.text, 'hello @alice')
})

test('does not inject HTML into an ordinary Tiptap text node containing @alice', () => {
  const normalized = normalizeComment(comment(JSON.stringify(TIPTAP_WITH_LITERAL_MENTION_TEXT)))

  assert.deepEqual(JSON.parse(normalized.content.text), TIPTAP_WITH_LITERAL_MENTION_TEXT)
  assert.equal(normalized.content.text.includes('<a'), false)
  assert.equal(normalized.content.text.includes('hello @alice'), true)
})

test('keeps malformed Comment JSON byte-visible without throwing', () => {
  assert.doesNotThrow(() => normalizeComment(comment(MALFORMED_COMMENT_JSON)))
  assert.equal(normalizeComment(comment(MALFORMED_COMMENT_JSON)).content.text, MALFORMED_COMMENT_JSON)
})

test('keeps valid JSON plain Comments visible after provider normalization', () => {
  for (const raw of VALID_JSON_PLAIN_TEXTS)
    assert.equal(normalizeComment(comment(raw)).content.text, raw)
})

test('normalizes Comment attachments without changing content order', () => {
  const normalized = normalizeComment(comment('Text\n![one](https://assets.example/one.png)\n![two](https://assets.example/two.png){thumbhash:"h",width:"10",height:"20"}'))

  assert.equal(normalized.content.text, 'Text')
  assert.deepEqual(normalized.content.images, [
    { src: 'https://assets.example/one.png', alt: 'one' },
    { src: 'https://assets.example/two.png', alt: 'two', thumbHash: 'h', width: 10, height: 20 },
  ])
})

test('mutation and navigation wiring keeps authoritative and keyboard contracts', async () => {
  const [issuesSource, browserUtilsSource, mutationsSource, userPageSource, topicContentSource, navigateSource, transitionSource, sidebarSource, asideSource, blogHeaderSource, themeSource, sidebarLayoutSource, routeViewSource, profileHeaderSource, animationSource] = await Promise.all([
    readFile(new URL('../../.vitepress/theme/apis/forum/gitee/issues.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/apis/forum/gitee/inBrowserUtils.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/forum/useForumMutations.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/user/ForumUserPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/topic/ForumTopicContent.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/composables/useNavigateToTopic.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/lib/forumViewTransition.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/sidebar/ForumSidebarNav.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/sidebar/ForumAside.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/blog/ForumBlogPostHeader.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/sidebar/ForumSidebar.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ForumRouteView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/user/ForumUserProfileHeader.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/styles/animation.css', import.meta.url), 'utf8'),
  ])

  assert.match(issuesSource, /topic: await getTopic\(String\(number\)\)/)
  assert.doesNotMatch(`${issuesSource}\n${browserUtilsSource}`, /useRuleChecks/)
  assert.match(mutationsSource, /skipReformat: canSkipTopicReformat\.value/)
  assert.match(userPageSource, /if \(list\.value\?\.q\)\s+return/)
  assert.match(topicContentSource, /event: MouseEvent \| KeyboardEvent/)
  assert.match(topicContentSource, /event instanceof MouseEvent/)
  assert.match(navigateSource, /queryCache\.setQueryData\(forumKeys\.topic\(topic\.id\), topic\)/)
  assert.doesNotMatch(transitionSource, /requestAnimationFrame|waitForSharedElements/)
  assert.match(sidebarSource, /data-forum-user-avatar/)
  assert.match(transitionSource, /findUserElement\(shared\.username, root, '\.avatar-image, \[data-forum-user-avatar\], img'\)/)
  assert.match(profileHeaderSource, /<Avatar\s+data-forum-user-avatar/)
  assert.match(sidebarLayoutSource, /queryCache\.setQueryData\(forumKeys\.user\(info\.login\), info\)/)
  assert.match(routeViewSource, /defineAsyncComponent/)
  assert.match(transitionSource, /transitionForumBlog/)
  assert.match(transitionSource, /current\.username === target\.username/)
  assert.match(transitionSource, /for \(const \{ element \} of sharedElements\)[\s\S]*removeProperty\('view-transition-name'\)/)
  assert.match(transitionSource, /transition\.finished\.then\(cleanup, cleanup\)/)
  assert.match(themeSource, /router\.onBeforeRouteChange/)
  assert.match(asideSource, /data-forum-shared-blog="cover"/)
  assert.match(blogHeaderSource, /data-forum-shared-blog="title"/)
  assert.match(transitionSource, /matchMedia\(FORUM_MOBILE_MEDIA_QUERY\)/)
  assert.match(transitionSource, /dataset\.forumNavigated = ''/)
  assert.match(animationSource, /@media \(max-width: 959px\)[\s\S]*#VPContent \{[\s\S]*view-transition-name: forum-page/)
  assert.match(animationSource, /html\[data-forum-navigated\] \.Forum\.slide-enter[\s\S]*animation: none/)
  assert.match(animationSource, /forum-page-enter-right/)
  assert.match(animationSource, /forum-page-exit-left/)
})

test('all image entry points reuse the shared multi-file drop zone', async () => {
  const [dropZoneSource, imageUploadSource, richTextareaSource, topicContentInputSource] = await Promise.all([
    readFile(new URL('../../src/composables/forum/useForumImageDropZone.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/form/ForumImageUpload.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/form/ForumRichTextarea.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/form/publish-topic-form/ForumContentInputBox.vue', import.meta.url), 'utf8'),
  ])

  assert.match(dropZoneSource, /useDropZone/)
  assert.match(dropZoneSource, /multiple:\s*true/)
  assert.match(imageUploadSource, /useForumImageDropZone\(dropZone/)
  assert.match(imageUploadSource, /\n\s+multiple\n/)
  assert.match(richTextareaSource, /useForumImageDropZone\(container/)
  assert.match(richTextareaSource, /<ForumImageUpload[\s\S]*?size="sm"/)
  assert.match(topicContentInputSource, /useForumImageDropZone\(dropZone/)
  assert.match(topicContentInputSource, /disabled: \(\) => !props\.supportPaste/)
  assert.doesNotMatch(`${imageUploadSource}\n${richTextareaSource}\n${topicContentInputSource}`, /@(?:dragover|drop)\.prevent/)
})

test('image preview waits for real images and animates every chrome surface before unmount', async () => {
  const [previewerSource, previewerStyleSource, flipSource, controlsSource, sidePanelSource, cardsSource, sheetSource, imageSource, imageItemSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/ui/image-previewer/ForumImagePreviewer.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/image-previewer/ForumImagePreviewer.scss', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/image-previewer/composables/usePreviewerFlip.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/image-previewer/components/PreviewerControls.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/image-previewer/components/PreviewerSidePanel.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/components/ui/cards/FeyCards.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/components/ui/sheet/SheetContent.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumImage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumImageItem.vue', import.meta.url), 'utf8'),
  ])

  assert.match(previewerSource, /usePreviewerFlip/)
  assert.match(previewerSource, /import \{ stackTransform, usePreviewerFlip \}/)
  assert.match(flipSource, /export function stackTransform/)
  assert.match(flipSource, /const BASE_EXIT_MS = 320/)
  assert.match(previewerStyleSource, /\.closing \.forum-preview-cards/)
  assert.match(previewerStyleSource, /\.closing \.forum-preview-nav/)
  assert.match(previewerStyleSource, /\.closing \.forum-preview-panel-toggle/)
  assert.match(previewerStyleSource, /\.closing :deep\(\.forum-preview-close\)/)
  assert.match(previewerStyleSource, /\.closing :deep\(\.forum-preview-dots\)/)
  assert.match(controlsSource, /transition:\s*opacity 200ms ease,\s*transform 220ms ease/)
  assert.match(sidePanelSource, /:force-mount="true"/)
  assert.match(sidePanelSource, /const EXIT_MS = 320/)
  assert.match(sidePanelSource, /animation-fill-mode: forwards/)
  assert.match(sidePanelSource, /rendered\.value = false/)
  assert.match(cardsSource, /transition:\s*opacity 220ms ease,\s*transform 280ms/)
  assert.match(sheetSource, /data-\[state=closed\]:\[animation-duration:300ms\]/)
  assert.match(sheetSource, /data-\[state=open\]:\[animation-duration:500ms\]/)
  assert.match(imageSource, /:disabled="!isPreviewReady\(image, sourceIndex\)"/)
  assert.match(imageSource, /@ready="handleReady\(sourceIndex\)"/)
  assert.match(imageItemSource, /img\.decode\?\.\(\)\?\.finally\(markRealImageReady\)/)
  assert.match(imageItemSource, /emit\('ready'\)/)
})

test('authorization remains the default while password login is available only by its direct hash', async () => {
  const [loginSource, authStoreSource, dialogSource, oauthDialogSource, layoutSource, passwordApiSource, zhForumSource] = await Promise.all([
    readFile(new URL('../../.vitepress/theme/hooks/useLogin.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/stores/useUserAuth.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/components/LoginAlertDialog.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/components/OAuthLoginAlertDialog.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/layouts/Layout.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/apis/forum/gitee/password.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/locales/zh/forum.ts', import.meta.url), 'utf8'),
  ])

  assert.match(loginSource, /passwordAuth\.getToken\(normalizedUsername, password\)/)
  assert.match(loginSource, /await storeUserSession\(auth\)/)
  assert.match(loginSource, /await refreshInterKnotSSOToken\(\)/)
  assert.match(loginSource, /queryCache\.invalidateQueries\(\{ key: forumKeys\.all \}, 'all'\)/)
  assert.match(loginSource, /loginWithPassword: handlePasswordLogin/)
  assert.doesNotMatch(loginSource, /TODO: Implement password login/)

  assert.match(dialogSource, /<form[\s\S]*?@submit\.prevent="submitPasswordLogin"/)
  assert.match(dialogSource, /autocomplete="username"/)
  assert.match(dialogSource, /autocomplete="current-password"/)
  assert.match(dialogSource, /useHashChecker\('account-login-alert'/)
  assert.match(dialogSource, /manual\/faq\/login\/accountlogin/)
  assert.match(dialogSource, /<DialogTitle class="text-xl leading-tight">/)
  assert.doesNotMatch(dialogSource, /FieldDescription|accountHint/)
  assert.match(dialogSource, /variant="outline"[\s\S]*?@click="startOAuthLogin"/)
  assert.match(dialogSource, /location\.hash = 'oauth-login-alert'/)
  assert.match(dialogSource, /href="https:\/\/gitee\.com\/signup"/)
  assert.doesNotMatch(dialogSource, /AlertDialog|Checkbox/)

  assert.match(oauthDialogSource, /useHashChecker\(\['login-alert', 'oauth-login-alert'\]/)
  assert.match(oauthDialogSource, /<AlertDialogAction @click="redirectAuth">/)
  assert.match(loginSource, /location\.hash = 'login-alert'/)
  assert.match(loginSource, /await storeUserSession\(result\.data\)/)
  assert.match(authStoreSource, /authRefresh\.startAutoRefresh\(\)/)
  assert.match(layoutSource, /<LoginAlertDialog \/>[\s\S]*?<OAuthLoginAlertDialog \/>/)

  assert.match(passwordApiSource, /grant_type: 'password'/)
  assert.match(passwordApiSource, /username,/)
  assert.match(passwordApiSource, /password,/)
  assert.match(zhForumSource, /accountPlaceholder: 'Gitee 登录名或邮箱（不支持手机号或游戏账号）'/)
})
