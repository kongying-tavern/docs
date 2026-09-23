/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { cn } from '../../.vitepress/theme/lib/utils'
import { composeTopicBody, writeTopicBodyComment } from '../../src/composables/composeTopicBody'
import { extractOfficialAndAuthorComments } from '../../src/services/forum/gitee/inBrowserUtils'
import { normalizeComment, normalizeIssue } from '../../src/services/forum/gitee/utils'
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

test('comment attachments reuse the capped shared image row', async () => {
  const [commentSource, imageSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/comment/ForumTopicComment.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumImage.vue', import.meta.url), 'utf8'),
  ])

  assert.match(commentSource, /<ForumImage[\s\S]*layout="row"[\s\S]*:max-display="3"/)
  assert.doesNotMatch(commentSource, /v-for="\(img, index\) in props\.commentData\.content\.images"/)
  assert.match(imageSource, /grid-template-columns: repeat\(var\(--forum-image-columns\), minmax\(0, 1fr\)\)/)
  assert.match(imageSource, /index === displayImages\.length - 1 && remainingCount > 0/)
  assert.match(imageSource, /<ForumImagePreviewer[\s\S]*:images="validImages"/)
  assert.match(imageSource, /@click="previewEnabled && openAt\(previewIndexFor\(sourceIndex\), \$event\.currentTarget\)"/)
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
  assert.match(stateSource, /if \(!import\.meta\.env\.SSR && !props\.inline\) \{\s+useInfiniteScroll/)
  assert.match(areaSource, /const inputObservationTarget = computed/)
  assert.doesNotMatch(areaSource, /stopObserver|onUnmounted\(cleanup\)/)
})

test('comment uploads stay editable and gist permission failures offer reauthorization', async () => {
  const [source, richTextareaSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/comment/ForumCommentInputBox.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/form/ForumRichTextarea.vue', import.meta.url), 'utf8'),
  ])

  assert.match(source, /const loading = computed\(\(\) => submitPending\.value \|\| forumMutations\.creatingComment\.value\)/)
  assert.match(source, /const busy = computed\(\(\) => loading\.value \|\| queue\.isBusy\.value\)/)
  assert.match(source, /:disabled="loading"[\s\S]*:loading="busy"/)
  assert.match(source, /error instanceof GiteeAPIError && error\.state === 403/)
  assert.match(source, /logout\(\)[\s\S]*redirectAuth\(\)/)
  assert.match(richTextareaSource, /editable: !props\.disabled/)
  assert.match(richTextareaSource, /watch\(\(\) => props\.disabled,[\s\S]*setEditable\(!disabled\)/)
  assert.doesNotMatch(richTextareaSource, /watch\(\(\) => props\.loading,[\s\S]*setEditable/)
  assert.match(richTextareaSource, /:disabled="disabled \|\| loading \|\| charCount === 0"/)
})

test('every Gitee login flow requests gist permission', async () => {
  const [configSource, oauthSource, passwordSource] = await Promise.all([
    readFile(new URL('../../src/services/forum/gitee/config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/forum/gitee/oauth.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/forum/gitee/password.ts', import.meta.url), 'utf8'),
  ])

  assert.match(configSource, /GITEE_AUTH_SCOPES = \[[^\]]*'gists'[^\]]*\] as const/)
  assert.match(oauthSource, /scope: GITEE_AUTH_SCOPES\.join\(' '\)/)
  assert.match(passwordSource, /scope: readonly string\[\] = GITEE_AUTH_SCOPES/)
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

test('Topic status is set from a grouped submenu instead of a dialog', async () => {
  const [menuSource, statusSource, dropdownMenu, pickerSource, statusDialog] = await Promise.all([
    readFile(new URL('../../src/composables/defineTopicDropdownMenu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/forum/forumTopicStatus.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumDropdownMenu.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/search/ForumSearchFilterPicker.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/topic/ForumTopicStatusDialog.vue', import.meta.url), 'utf8'),
  ])

  // 状态项本身就是二级菜单，直接点选提交，不再唤起弹窗
  assert.match(menuSource, /type: 'submenu',\s*id: 'status-topic'/)
  assert.doesNotMatch(menuSource, /openTopicStatusEditorDialog/)
  // 弹窗只剩「归档时挑结论状态」这一条路径，状态文案随之退场
  assert.match(statusDialog, /closeFeedback\.title/)
  assert.doesNotMatch(statusDialog, /modifyStatus\.(title|description|placeholder)|isCloseMode/)
  // 分组顺序只在服务层定义一次，菜单与筛选器共用
  assert.match(statusSource, /export const TOPIC_STATUS_GROUP_ORDER/)
  assert.match(statusSource, /export function groupTopicStatuses/)
  assert.match(menuSource, /groupTopicStatuses\(\s*getSelectableTopicStatuses\(/)
  assert.match(pickerSource, /TOPIC_STATUS_GROUP_ORDER\.map\(/)
  assert.doesNotMatch(pickerSource, /\(\['planning', 'triage', 'maintenance', 'resolution'\] as const\)/)
  // 候选里不含当前状态，「清除状态」只在真有状态时出现
  assert.match(statusSource, /export function getSelectableTopicStatuses[\s\S]*?definition\.id !== currentStatus/)
  assert.match(menuSource, /if \(currentStatus\) \{\s*items\.push\(\{\s*id: 'status-topic-none'/)
  assert.match(menuSource, /disabled: updatingTopic\.value/)
  assert.match(dropdownMenu, /<ForumTopicStatusBadge v-if="item\.status !== undefined" :status="item\.status \?\? undefined" \/>/)
  // 会带走未结话题的分组标题要带说明：hint 由 hidesTopic 推导，不写死分组名
  assert.match(menuSource, /hint: definitions\.some\(definition => definition\.hidesTopic\)/)
  assert.match(menuSource, /menuLabels\.value\.modifyStatus\.conclusiveHint/)
  assert.match(dropdownMenu, /<ForumHintIcon v-if="item\.hint" :label="item\.hint" \/>/)
})

test('toggle menu items name the action, never the current state', async () => {
  const menuSource = await readFile(new URL('../../src/composables/defineTopicDropdownMenu.ts', import.meta.url), 'utf8')

  // 已隐藏（state progressing，展示为「已结反馈」）时必须给「取消隐藏」+ eye，
  // 未隐藏才给「隐藏反馈」+ eye-off。hideState 是 ComputedRef：
  // 写成 `hideState ? ...` 漏掉 .value 会永远取到前一个分支，且照样过类型检查。
  assert.match(menuSource, /label: hideState\.value \? menuLabels\.value\.unhideFeedback\.text : menuLabels\.value\.hideFeedback\.text/)
  assert.match(menuSource, /icon: hideState\.value \? 'i-lucide:eye' : 'i-lucide:eye-off'/)
  // 换 action 的同类项一律同构，新增时应照此写
  assert.match(menuSource, /label: closeState\.value \? menuLabels\.value\.reopenFeedback\.text : menuLabels\.value\.closeFeedback\.text/)
  assert.match(menuSource, /label: currentTopic\.value\.pinned \? menuLabels\.value\.pinTopic\.unpin : menuLabels\.value\.pinTopic\.pin/)
  assert.match(menuSource, /label: currentTopic\.value\.commentCount === -1 \? menuLabels\.value\.commentArea\.open : menuLabels\.value\.commentArea\.close/)
  assert.doesNotMatch(menuSource, /\b(hideState|closeState)\s*\?/)
})

test('Topic status management has one lazy host and shares edit permission', async () => {
  const [forumLayout, menuSource, managerSource, statusDialog, typeBadge] = await Promise.all([
    readFile(new URL('../../.vitepress/theme/layouts/Forum.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/defineTopicDropdownMenu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/useTopicManager.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/topic/ForumTopicStatusDialog.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumTopicTypeBadge.vue', import.meta.url), 'utf8'),
  ])

  assert.match(forumLayout, /import\('~\/components\/forum\/topic\/ForumTopicStatusDialog\.vue'\)/)
  assert.match(forumLayout, /<ForumTopicStatusDialog v-if="shouldMountTopicStatusEditor" \/>/)
  assert.match(menuSource, /const hasEditPermission = hasAnyPermissions\('edit_feedback'\)/)
  assert.match(menuSource, /id: 'status-topic'/)
  assert.match(menuSource, /id: 'good-issue-topic'/)
  assert.ok(menuSource.indexOf('...needEditStatusItems.value') > menuSource.indexOf('...noAnyPermissionItems.value'))
  assert.ok(menuSource.indexOf('...needEditStatusItems.value') < menuSource.indexOf('...needManagePermissionItems.value'))
  assert.ok(menuSource.indexOf('...closeTopicItems.value') > menuSource.indexOf('...needManagePermissionItems.value'))
  assert.match(statusDialog, /getConclusiveTopicStatuses/)
  // 弹窗内的状态选择改为响应式 select：选项行前缀仍渲染状态色块
  assert.match(statusDialog, /<ForumResponsiveSelect/)
  assert.match(statusDialog, /<ForumTopicStatusBadge :status="option\.id === KEEP \? undefined : option\.id" \/>/)
  assert.match(typeBadge, /getTopicDisplayStatus\(status, state\)/)
  assert.match(typeBadge, /v-if="displayStatus && interactive"/)
  assert.match(typeBadge, /@click\.stop="filterByStatus\(displayStatus\)"/)
  assert.match(typeBadge, /<ForumTopicStatusBadge v-else-if="displayStatus" :status="displayStatus" \/>/)
  assert.match(typeBadge, /@click\.stop="filterByType"/)
  assert.match(typeBadge, /navigateType\(typeFilter\.value, true\)/)
  const statusMutationSource = managerSource.slice(
    managerSource.indexOf('const setTopicStatus'),
    managerSource.indexOf('const toggleGoodIssue'),
  )
  assert.match(statusMutationSource, /topicStatusHidesTopic\(status\)/)
  assert.match(statusMutationSource, /state: 'progressing' as const/)
  assert.doesNotMatch(statusMutationSource, /state: 'closed'|composeTopicBody/)
})

test('tag and state filter hover styles stay on the neutral color system', async () => {
  const [tagList, typeBadge] = await Promise.all([
    readFile(new URL('../../src/components/forum/ui/ForumTagList.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumTopicTypeBadge.vue', import.meta.url), 'utf8'),
  ])
  // 只取 hover 那一条规则：命中态（已筛选）另有品牌色样式，不能污染这条断言
  const tagHover = tagList.slice(tagList.indexOf('.forum-tag-filter:hover'), tagList.indexOf('.forum-tag-filter-active'))
  const tagActive = tagList.slice(tagList.indexOf('.forum-tag-filter-active'))
  const stateHover = typeBadge.slice(typeBadge.indexOf('.forum-badge-state-square-filter:hover'))

  assert.match(tagHover, /color: var\(--vp-c-text-1\)/)
  assert.match(tagHover, /background: var\(--vp-c-default-3\)/)
  assert.doesNotMatch(tagHover, /--vp-c-brand/)
  assert.match(tagActive, /color: var\(--vp-c-brand-1\)/)
  assert.match(tagActive, /background: var\(--vp-c-brand-soft\)/)
  assert.match(stateHover, /outline-color: var\(--vp-c-border\)/)
  assert.match(stateHover, /color: var\(--vp-c-text-1\)/)
  assert.doesNotMatch(stateHover, /--vp-c-brand/)
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

test('normalizes only valid quoted Topic metadata into the public Topic contract', () => {
  const valid = normalizeIssue(issue('<!-- {"quotedTopic":{"id":"ICROD8","type":"BUG"}} -->Body'))
  const invalid = normalizeIssue(issue('<!-- {"quotedTopic":{"id":"../admin","type":"BUG"}} -->Body'))

  assert.deepEqual(valid.quotedTopic, { id: 'ICROD8', type: 'BUG' })
  assert.equal(invalid.quotedTopic, undefined)
  assert.equal(valid.content.text, 'Body')
})

test('normalizes pinned state from the authoritative Gitee label', () => {
  const pinnedIssue = issue('Body')
  pinnedIssue.labels = [{ name: 'PINNED' }] as GITEE.IssueLabel[]
  assert.equal(normalizeIssue(pinnedIssue).pinned, true)
  assert.equal(normalizeIssue(issue('Body')).pinned, false)
})

test('normalizes provider labels separately from editable tags and status fields', () => {
  const labeledIssue = issue('Body')
  labeledIssue.labels = [
    { name: 'TYP-BUG' },
    { name: 'CATA-DOCS' },
    { name: 'ST-CONFIRMED' },
    { name: 'GOOD-ISSUE' },
  ] as GITEE.IssueLabel[]

  const topic = normalizeIssue(labeledIssue)
  assert.deepEqual(topic.labels, ['TYP-BUG', 'CATA-DOCS', 'ST-CONFIRMED', 'GOOD-ISSUE'])
  assert.deepEqual(topic.tags, ['CATA-DOCS'])
  assert.equal(topic.status, 'confirmed')
  assert.equal(topic.goodIssue, true)
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
  const [issuesSource, browserUtilsSource, mutationsSource, topicContentSource, navigateSource, transitionSource, sidebarSource, blogHeaderSource, themeSource, sidebarLayoutSource, routeViewSource, profileHeaderSource, animationSource] = await Promise.all([
    readFile(new URL('../../src/services/forum/gitee/issues.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/forum/gitee/inBrowserUtils.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/forum/useForumMutations.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/topic/ForumTopicContent.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/composables/useNavigateToTopic.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/theme/lib/forumViewTransition.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/sidebar/ForumSidebarNav.vue', import.meta.url), 'utf8'),
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
  assert.match(themeSource, /return shouldLoadPage/)
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
  assert.match(previewerStyleSource, /\.forum-preview-nav\.(prev|next)/)
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
  assert.match(imageSource, /:disabled="previewEnabled && !isPreviewReady\(image, sourceIndex\) \? true : undefined"/)
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
    readFile(new URL('../../src/services/forum/gitee/password.ts', import.meta.url), 'utf8'),
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

test('archived feedback is admin-only and the archive action swaps to archive icons', async () => {
  const [dropdownSource, hintSource, menuSource, routeSource, zhForumSource, pillSource, desktopSelectSource, listControlOptionsSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/list/ForumTopicTypeDropdown.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumHintIcon.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/defineTopicDropdownMenu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/services/forum/forumRoute.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/locales/zh/forum.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/list/ForumPillSelect.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumSelectDesktop.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/forum/useForumListControlOptions.ts', import.meta.url), 'utf8'),
  ])

  assert.match(routeSource, /\['all', 'closed', 'archived', 'everything'\]/)
  assert.match(routeSource, /\['bug', 'feat'\]/)
  // 选项契约已收敛到 useForumListControlOptions；dropdown 本身只是 ForumPillSelect 的薄封装
  assert.match(listControlOptionsSource, /hasAnyRoles\('teamMember', 'feedbackMember'\)/)
  assert.match(listControlOptionsSource, /if \(canViewArchived\.value\)/)
  assert.match(listControlOptionsSource, /id: 'everything'/)
  assert.match(listControlOptionsSource, /hint: navigation\.adminOnly/)
  // 「已归档」排在状态组最后
  assert.match(listControlOptionsSource, /const items: Array<\{[\s\S]*?everythingFeedback[\s\S]*?items\.push\(\{ id: 'archived'/)
  // pill 只承载触发按钮；选项行渲染在响应式 select 的桌面分支里
  assert.match(pillSource, /<ForumResponsiveSelect/)
  assert.match(pillSource, /<ForumHintIcon v-if="current\?\.hint" :label="current\.hint" \/>/)
  assert.match(desktopSelectSource, /<ForumHintIcon v-if="option\.hint" :label="option\.hint" \/>/)
  // 文字与图标必须同处一个 inline-flex 行，否则块级 svg 会另起一行/错位
  assert.equal(pillSource.match(/<span class="inline-flex gap-1 items-center">/g)?.length, 1)
  assert.equal(desktopSelectSource.match(/<span class="inline-flex gap-1 items-center">/g)?.length, 1)
  assert.match(desktopSelectSource, /<SelectGroup>/)
  assert.match(dropdownSource, /navigation\.groups\.status/)
  assert.doesNotMatch(dropdownSource, /navigation\.groups\.type/)
  // 提示图标是共用件，文案由调用方传入
  assert.match(hintSource, /import \{ Info \} from '@lucide\/vue'/)
  assert.match(hintSource, /inline-flex/)
  assert.match(hintSource, /HoverCardContent/)
  assert.match(hintSource, /label: string/)
  assert.doesNotMatch(hintSource, /adminOnly/)
  assert.match(menuSource, /closeState\.value \? 'i-lucide:archive-restore' : 'i-lucide:archive'/)
  assert.match(zhForumSource, /navigation: \{[\s\S]*?groups: \{[\s\S]*?status: '状态'[\s\S]*?adminOnly: '仅管理员可见'[\s\S]*?archivedFeedback: '已归档反馈'[\s\S]*?everythingFeedback: '全部反馈'/)
})

test('responsive select/menu hosts split desktop popper from mobile drawer chunks', async () => {
  const [selectHost, selectDesktop, selectMobile, menuHost, menuDesktop, menuMobile, mobilePanel, dropdownRenderer, viewDropdownSource, typesSource, listControlOptionsSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/ui/responsive/ForumResponsiveSelect.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumSelectDesktop.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumSelectMobileDrawer.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumResponsiveMenu.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumMenuDesktop.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumMenuMobileDrawer.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/responsive/ForumMenuMobilePanel.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/ui/ForumDropdownMenu.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/list/ForumTopicViewDropdown.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/types.d.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/composables/forum/useForumListControlOptions.ts', import.meta.url), 'utf8'),
  ])

  // host 只做环境判断与分支组装，自身不携带任何浮层/抽屉实现
  assert.match(selectHost, /defineAsyncComponent\(\(\) => import\('\.\/ForumSelectDesktop\.vue'\)\)/)
  assert.match(selectHost, /defineAsyncComponent\(\(\) => import\('\.\/ForumSelectMobileDrawer\.vue'\)\)/)
  assert.match(menuHost, /defineAsyncComponent\(\(\) => import\('\.\/ForumMenuDesktop\.vue'\)\)/)
  assert.match(menuHost, /defineAsyncComponent\(\(\) => import\('\.\/ForumMenuMobileDrawer\.vue'\)\)/)
  assert.doesNotMatch(`${selectHost}\n${menuHost}`, /vaul-vue|@\/components\/ui\/drawer/)
  assert.doesNotMatch(menuHost, /@\/components\/ui\/dropdown-menu/)
  // 桌面分支只依赖 reka 浮层，移动端分支只依赖 vaul 抽屉
  assert.doesNotMatch(`${selectDesktop}\n${menuDesktop}\n${dropdownRenderer}`, /vaul-vue|@\/components\/ui\/drawer/)
  assert.match(`${selectMobile}\n${menuMobile}`, /@\/components\/ui\/drawer/)
  assert.doesNotMatch(`${selectMobile}\n${menuMobile}`, /reka-ui/)
  // 菜单模型是双端渲染器的单一来源：排序逻辑共用，radio 组两端都渲染
  assert.match(dropdownRenderer, /sortMenuItems\(items\)/)
  assert.match(mobilePanel, /sortMenuItems\(items\)/)
  assert.match(dropdownRenderer, /item\.type === 'radio-group'/)
  assert.match(mobilePanel, /item\.type === 'radio-group'/)
  assert.match(typesSource, /type: 'radio-group'/)
  assert.match(typesSource, /type: 'radio-item'/)
  // 视图/排序菜单走声明式 radio 模型，不再各自写一套渲染
  assert.match(viewDropdownSource, /type: 'radio-group'/)
  assert.match(viewDropdownSource, /type: 'radio-item'/)
  assert.match(listControlOptionsSource, /getViewModeIconClass\(mode\)/)
  assert.doesNotMatch(viewDropdownSource, /<DropdownMenu/)
})

test('user profile empty state offers create and closed-feedback actions', async () => {
  const [emptySource, feedbackButtonSource, zhForumSource] = await Promise.all([
    readFile(new URL('../../src/components/forum/list/ForumTopicListEmpty.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/forum/form/OpenFeedbackFormButton.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../.vitepress/locales/zh/forum.ts', import.meta.url), 'utf8'),
  ])

  assert.match(emptySource, /route\.value\?\.name === 'user' && !props\.error && !isSearchEmpty\.value && !hasActiveFilters\.value/)
  assert.match(emptySource, /const showUserEmptyActions = computed/)
  assert.match(emptySource, /async function handleShowClosed\(\) \{\s+await navigateFilter\('closed'\)\s+\}/)
  assert.match(emptySource, /<OpenFeedbackFormButton :label="message\.forum\.empty\.createFeedback" \/>/)
  assert.match(emptySource, /message\.forum\.empty\.showClosed/)
  assert.match(feedbackButtonSource, /defineProps<\{ label\?: string \}>/)
  assert.match(feedbackButtonSource, /return props\.label \?\? message\.value\.forum\.publish\.title/)
  assert.match(zhForumSource, /createFeedback: '新建反馈'[\s\S]*?showClosed: '查看已结反馈'/)
})
