<script setup lang="ts">
import { useQueryCache } from '@pinia/colada'
import { useEventListener, useLocalStorage, useMediaQuery } from '@vueuse/core'
import { useData, withBase } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { FluidHoverList } from '@/components/ui/fluid-hover'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumPersonalState } from '~/forum/composables/data/useForumPersonalState'
import { useForumTopicQuery, useForumTopicsQuery } from '~/forum/composables/data/useForumQueries'
import { useFeedbackFormExperiment } from '~/forum/composables/state/useFeedbackFormExperiment'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumTopicSeenState } from '~/forum/composables/state/useForumTopicSeenState'
import { useForumShortcut } from '~/forum/composables/view/useForumShortcut'
import { useIdlePreload } from '~/forum/composables/view/useIdlePreload'
import { readSavedTopicDrafts, TOPIC_DRAFT_CHANGE_EVENT } from '~/forum/services/form/topicDraft'
import { getAllowedTopicTypes } from '~/forum/services/form/validation'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { decodeForumText } from '~/forum/services/forumContentCodec'
import { isRecentClosedTopic } from '~/forum/services/forumPersonalState'
import { forumKeys } from '~/forum/services/forumQueryContracts'
import { isClosedUnseen } from '~/forum/services/forumTopicSeenState'
import { rememberLoginIntent } from '~/forum/services/loginIntent'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { FORM_HASH } from '../form/publish-topic-form/form-config'
import { preloadForumRichTextarea } from '../utils/forumComponentPreload'
import { preloadForumPublishForm, publishTopic } from '../utils/submitFormUi'
import ForumSidebarAccountMenu from './ForumSidebarAccountMenu.vue'
import ForumSidebarFestivalItem from './ForumSidebarFestivalItem.vue'
import ForumSidebarNav from './ForumSidebarNav.vue'
import ForumSidebarSection from './ForumSidebarSection.vue'

const { localeIndex } = useData()
const { message } = useLocalized()
const auth = useUserAuthStore()
const userInfo = useUserInfoStore()
const queryCache = useQueryCache()
const { route, topicHref, userHref } = useForumRoute()
const personal = useForumPersonalState()
const topicSeen = useForumTopicSeenState()

const isLoggedIn = computed(() => auth.isTokenValid)
useIdlePreload(preloadForumPublishForm, () => isLoggedIn.value)
useIdlePreload(preloadForumRichTextarea, () => isLoggedIn.value)
const username = computed(() => userInfo.info?.login ?? '')
const { hasAnyPermissions } = useRuleChecks()
const canManageFeedback = hasAnyPermissions('manage_feedback')
const experiment = useFeedbackFormExperiment()
const topicDrafts = shallowRef<ReturnType<typeof readSavedTopicDrafts>>([])
function refreshDrafts(): void {
  topicDrafts.value = isLoggedIn.value && experiment.variant.value === 'compact' ? readSavedTopicDrafts(getAllowedTopicTypes(canManageFeedback.value)) : []
}
onMounted(refreshDrafts)
watch([isLoggedIn, canManageFeedback, username, experiment.variant], refreshDrafts)
useEventListener(TOPIC_DRAFT_CHANGE_EVENT, refreshDrafts)
useEventListener('storage', refreshDrafts)
watch(() => userInfo.info, (info) => {
  if (info)
    queryCache.setQueryData(forumKeys.user(info.login), info)
}, { immediate: true })
const submitted = useForumTopicsQuery(computed(() => ({
  filter: 'all',
  sort: 'created',
  q: '',
  creator: username.value || null,
  pageSize: 20,
  // 已结反馈也保留在列表里，不随状态切换移除
  state: 'all',
})), computed(() => isLoggedIn.value && Boolean(username.value)))

// null = 用户未主动设置过：默认跟随登录态（未登录收起 / 登录后展开）
const submittedOpen = useLocalStorage<boolean | null>('forum-sidebar-submitted-open', null)
const followedOpen = useLocalStorage<boolean | null>('forum-sidebar-followed-open', null)
const participatedOpen = useLocalStorage<boolean | null>('forum-sidebar-participated-open', null)

const submittedSectionOpen = computed({
  get: () => Boolean(submittedOpen.value ?? isLoggedIn.value),
  set: value => submittedOpen.value = value,
})
const followedSectionOpen = computed({
  get: () => Boolean(followedOpen.value ?? isLoggedIn.value),
  set: value => followedOpen.value = value,
})
const participatedSectionOpen = computed({
  get: () => Boolean(participatedOpen.value ?? isLoggedIn.value),
  set: value => participatedOpen.value = value,
})
const SIDEBAR_DETAIL_QUERY_LIMIT = 5

const followedTopicQueries = Array.from({ length: SIDEBAR_DETAIL_QUERY_LIMIT }, (_, index) => useForumTopicQuery(computed(() => (
  isLoggedIn.value && followedSectionOpen.value
    ? personal.state.value.followedTopics[index]?.topicId ?? ''
    : ''
))))
const currentFollowedTopics = computed(() => new Map(
  followedTopicQueries.flatMap(query => query.data.value ? [[String(query.data.value.id), query.data.value] as const] : []),
))
const participatedTopicQueries = Array.from({ length: SIDEBAR_DETAIL_QUERY_LIMIT }, (_, index) => useForumTopicQuery(computed(() => (
  isLoggedIn.value && participatedSectionOpen.value
    ? personal.state.value.recentParticipated[index]?.topicId ?? ''
    : ''
))))
const currentParticipatedTopics = computed(() => new Map(
  participatedTopicQueries.flatMap(query => query.data.value ? [[String(query.data.value.id), query.data.value] as const] : []),
))

// 移动端（<960px）收藏创建按钮从 sidebar 移入 VPLocalNav 的返回顶部右侧。
// VPLocalNav 由默认主题渲染且晚于本组件挂载，故用原生 DOM 手动挂载（Teleport 时序不可靠）。
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
function openDraft(): void {
  preloadForumPublishForm()
  if (isMobile.value)
    document.querySelector<HTMLElement>('.VPBackdrop')?.click()
}
let localNavCreateBtn: HTMLButtonElement | null = null

function renderLocalNavCreateBtn() {
  if (!localNavCreateBtn)
    return
  const icon = document.createElement('span')
  icon.className = 'icon-btn'
  icon.classList.toggle('i-lucide-square-pen', isLoggedIn.value)
  icon.classList.toggle('i-lucide-log-in', !isLoggedIn.value)
  icon.ariaHidden = 'true'
  const label = document.createElement('span')
  label.textContent = isLoggedIn.value
    ? message.value.forum.sidebar.createFeedback
    : message.value.forum.sidebar.loginToCreate
  localNavCreateBtn.replaceChildren(icon, label)
}

function mountLocalNavCreateBtn() {
  if (localNavCreateBtn)
    return
  const target = document.querySelector<HTMLElement>('.VPLocalNav .container')
  if (!target)
    return
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'forum-localnav-create'
  btn.addEventListener('click', handleCreate)
  localNavCreateBtn = btn
  renderLocalNavCreateBtn()
  target.append(btn)
}

function unmountLocalNavCreateBtn() {
  localNavCreateBtn?.remove()
  localNavCreateBtn = null
}

onMounted(() => {
  if (isMobile.value)
    mountLocalNavCreateBtn()
})
watch(isMobile, (mobile) => {
  if (mobile)
    mountLocalNavCreateBtn()
  else
    unmountLocalNavCreateBtn()
})
watch(isLoggedIn, renderLocalNavCreateBtn)
onBeforeUnmount(unmountLocalNavCreateBtn)

const navItems = computed(() => {
  const items: InstanceType<typeof ForumSidebarNav>['$props']['items'] = [
    { label: message.value.forum.sidebar.home, icon: 'i-lucide-house', href: pageHref('feedback'), active: route.value?.name === 'home' },
    { label: message.value.forum.sidebar.manual, icon: 'i-lucide-book-open', href: pageHref('manual/client/') },
    { label: message.value.forum.sidebar.faq, icon: 'i-lucide-circle-help', href: pageHref('manual/faq/accountsafety/acntban') },
  ]
  items.push({
    label: isLoggedIn.value ? message.value.forum.sidebar.createFeedback : message.value.forum.sidebar.loginToCreate,
    icon: isLoggedIn.value ? 'i-lucide-square-pen' : 'i-lucide-log-in',
    action: true,
  })
  return items
})

const submittedItems = computed(() => [
  ...topicDrafts.value.map(draft => ({
    id: `draft-${draft.type}`,
    title: draft.title.trim() || decodeForumText(draft.text).text.trim() || message.value.forum.publish.feedbackForm.untitledDraft,
    href: `#${FORM_HASH}-DRAFT-${draft.type}`,
    type: draft.type,
    draft: true,
  })),
  ...submitted.rows.value
    .filter(topic => isRecentClosedTopic(topic))
    .slice(0, 20)
    .map(topic => ({
      id: String(topic.id),
      title: topic.title,
      href: topicHref(String(topic.id), null),
      type: topic.type,
      state: topic.state,
      status: topic.status,
      goodIssue: topic.goodIssue,
      commentCount: Math.max(0, topic.commentCount),
      closedUnseen: isClosedUnseen(topic, topicSeen.seenAt(String(topic.id))),
      menuTopic: topic,
    })),
])
const followedItems = computed(() => personal.state.value.followedTopics
  .map(topic => ({ topic, current: currentFollowedTopics.value.get(topic.topicId) }))
  .filter(({ topic, current }) => isRecentClosedTopic(current ?? topic))
  .slice(0, 20)
  .map(({ topic, current }) => {
    return {
      id: topic.topicId,
      title: current?.title ?? topic.title,
      href: topicHref(topic.topicId, null),
      type: current?.type ?? topic.type,
      state: current?.state ?? topic.state,
      status: current?.status ?? topic.status,
      goodIssue: current?.goodIssue ?? topic.goodIssue,
      commentCount: Math.max(0, current?.commentCount ?? topic.commentCount ?? 0),
      closedUnseen: isClosedUnseen(
        { state: current?.state ?? topic.state, closedAt: current?.closedAt ?? topic.closedAt },
        topicSeen.seenAt(topic.topicId),
      ),
      canUnfollow: true,
    }
  }))
const participatedItems = computed(() => personal.state.value.recentParticipated
  .map(topic => ({ topic, current: currentParticipatedTopics.value.get(topic.topicId) }))
  .filter(({ topic, current }) => isRecentClosedTopic(current ?? topic))
  .slice(0, 20)
  .map(({ topic, current }) => ({
    id: topic.topicId,
    title: current?.title ?? topic.title,
    href: topicHref(topic.topicId, null),
    type: current?.type ?? topic.type,
    state: current?.state ?? topic.state,
    status: current?.status ?? topic.status,
    goodIssue: current?.goodIssue ?? topic.goodIssue,
    commentCount: Math.max(0, current?.commentCount ?? topic.commentCount ?? 0),
    closedUnseen: isClosedUnseen(
      { state: current?.state ?? topic.state, closedAt: current?.closedAt ?? topic.closedAt },
      topicSeen.seenAt(topic.topicId),
    ),
  })))

function pageHref(path: string): string {
  return withBase(`${getLangPath(localeIndex.value)}${path}`)
}

function handleCreate() {
  if (isLoggedIn.value) {
    publishTopic()
  }
  else {
    rememberLoginIntent(FORM_HASH)
    location.hash = 'login-alert'
  }
}
useForumShortcut('publish', handleCreate)
</script>

<template>
  <div class="forum-sidebar">
    <div class="forum-sidebar-scroll">
      <FluidHoverList
        active=".forum-sidebar-link.active"
        active-indicator-class="bg-[var(--vp-c-default-soft)]"
      >
        <ForumSidebarNav :items="navItems" @create="handleCreate" />

        <ForumSidebarSection
          v-model:open="submittedSectionOpen"
          :title="message.forum.sidebar.recentSubmitted"
          icon="i-lucide-history"
          :items="submittedItems"
          :login-prompt="isLoggedIn ? '' : message.forum.sidebar.loginToView"
          :login-action="isLoggedIn ? '' : message.forum.sidebar.loginNow"
          @open-draft="openDraft"
        />
        <ForumSidebarSection
          v-model:open="participatedSectionOpen"
          :title="message.forum.sidebar.recentParticipated"
          icon="i-lucide-message-circle-more"
          :items="participatedItems"
          :login-prompt="isLoggedIn ? '' : message.forum.sidebar.loginToView"
          :login-action="isLoggedIn ? '' : message.forum.sidebar.loginNow"
        />
        <ForumSidebarSection
          v-model:open="followedSectionOpen"
          :title="message.forum.sidebar.followedTopics"
          icon="i-lucide-bookmark"
          :items="followedItems"
          :action-disabled="personal.saving.value"
          :login-prompt="isLoggedIn ? '' : message.forum.sidebar.loginToView"
          :login-action="isLoggedIn ? '' : message.forum.sidebar.loginNow"
          @unfollow="personal.unfollow"
        />
      </FluidHoverList>
    </div>

    <ForumSidebarFestivalItem />
    <ForumSidebarAccountMenu
      :privacy-href="pageHref('privacy')"
      :agreement-href="pageHref('agreement')"
      :profile-href="username ? userHref(username) : pageHref('feedback')"
    />
  </div>
</template>

<style scoped>
.forum-sidebar {
  display: flex;
  flex-direction: column;
  --forum-sidebar-sticky-bg: var(--vp-sidebar-bg-color);
  --forum-sidebar-sticky-shadow: color-mix(in srgb, var(--vp-c-black) 14%, transparent);
  min-width: 0;
  height: calc(100dvh - var(--vp-layout-top-height, 0px) - 32px);
}

:global(.VPSidebar:has(.forum-sidebar)) {
  padding-bottom: 0;
  overflow: visible;
}

:global(.dark .forum-sidebar) {
  --forum-sidebar-sticky-shadow: color-mix(in srgb, var(--vp-c-black) 42%, transparent);
}

.forum-sidebar-scroll {
  @apply scrollbar-none;
  flex: 1;
  min-height: 0;
  padding-top: 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

:global(.forum-localnav-create) {
  display: inline-flex;
  height: 28px;
  align-self: center;
  align-items: center;
  margin-right: 12px;
  gap: 6px;
  padding: 0 8px;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  @apply text-ui-12;
  font-weight: 500;
  @apply leading-ui-24;
  cursor: pointer;
}

:global(.forum-localnav-create:hover) {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

@media (min-width: 960px) {
  .forum-sidebar {
    height: calc(100dvh - var(--vp-layout-top-height, 0px) - var(--vp-nav-height));
  }
}
</style>
