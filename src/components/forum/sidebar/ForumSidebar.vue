<script setup lang="ts">
import type { ForumSort } from '~/services/forum/forumRoute'
import { useQueryCache } from '@pinia/colada'
import { useEventListener, useLocalStorage, useMediaQuery } from '@vueuse/core'
import { useData, withBase } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { getLangPath } from '@/utils'
import { useForumPersonalState } from '~/composables/forum/useForumPersonalState'
import { useForumTopicQuery, useForumTopicsQuery } from '~/composables/forum/useForumQueries'
import { useForumTopicSeenState } from '~/composables/forum/useForumTopicSeenState'
import { useForumRoute } from '~/composables/useForumRoute'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'
import { isRecentClosedTopic } from '~/services/forum/forumPersonalState'
import { forumKeys } from '~/services/forum/forumQueryContracts'
import { isClosedUnseen } from '~/services/forum/forumTopicSeenState'
import { rememberLoginIntent } from '~/services/forum/loginIntent'
import { FORM_HASH } from '../form/publish-topic-form/config'
import { publishTopic } from '../utils/forumUi'
import ForumSidebarCreateButton from './ForumSidebarCreateButton.vue'
import ForumSidebarInformationMenu from './ForumSidebarInformationMenu.vue'
import ForumSidebarNav from './ForumSidebarNav.vue'
import ForumSidebarSection from './ForumSidebarSection.vue'

const { localeIndex } = useData()
const { message } = useLocalized()
const auth = useUserAuthStore()
const userInfo = useUserInfoStore()
const queryCache = useQueryCache()
const { route, list, topicHref, userHref, navigateSort } = useForumRoute()
const personal = useForumPersonalState()
const topicSeen = useForumTopicSeenState()

const isLoggedIn = computed(() => auth.isTokenValid)
const username = computed(() => userInfo.info?.login ?? '')
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
const informationOpen = ref(false)
const sortOpen = ref(false)
const informationMenu = useTemplateRef('informationMenu')
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

useEventListener('pointerdown', (event) => {
  if (event.target instanceof Node && !informationMenu.value?.$el?.contains(event.target))
    informationOpen.value = false
})
useEventListener('keydown', (event) => {
  if (event.key === 'Escape')
    informationOpen.value = false
})

const navItems = computed(() => {
  const items = [
    { label: message.value.forum.sidebar.home, icon: 'i-lucide-house', href: pageHref('feedback'), active: route.value?.name === 'home' },
    { label: message.value.forum.sidebar.manual, icon: 'i-lucide-book-open', href: pageHref('manual/client/') },
  ]
  if (isLoggedIn.value && username.value) {
    items.push({ label: message.value.forum.sidebar.myProfile, icon: 'i-lucide-circle-user', href: userHref(username.value), username: username.value })
  }
  items.push({ label: message.value.forum.sidebar.faq, icon: 'i-lucide-circle-help', href: pageHref('manual/faq/accountsafety/acntban') })
  return items
})

const submittedItems = computed(() => submitted.rows.value
  .filter(topic => isRecentClosedTopic(topic))
  .slice(0, 20)
  .map(topic => ({
    id: String(topic.id),
    title: topic.title,
    href: topicHref(String(topic.id), null),
    type: topic.type,
    commentCount: Math.max(0, topic.commentCount),
    closedUnseen: isClosedUnseen(topic, topicSeen.seenAt(String(topic.id))),
    menuTopic: topic,
  })))
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

async function selectSort(sort: ForumSort) {
  await navigateSort(sort)
  sortOpen.value = false
}

watch(informationOpen, (open) => {
  if (!open)
    sortOpen.value = false
})
</script>

<template>
  <div class="forum-sidebar">
    <div class="forum-sidebar-scroll">
      <ForumSidebarNav :items="navItems" />

      <ForumSidebarCreateButton :is-logged-in="isLoggedIn" @create="handleCreate" />

      <ForumSidebarSection
        v-model:open="submittedSectionOpen"
        :title="message.forum.sidebar.recentSubmitted"
        icon="i-lucide-history"
        :items="submittedItems"
        :login-prompt="isLoggedIn ? '' : message.forum.sidebar.loginToView"
        :login-action="isLoggedIn ? '' : message.forum.sidebar.loginNow"
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
    </div>

    <ForumSidebarInformationMenu
      ref="informationMenu"
      :open="informationOpen"
      :sort-open="sortOpen"
      :has-list="Boolean(list)"
      :current-sort="list?.sort ?? 'created'"
      :privacy-href="pageHref('privacy')"
      :agreement-href="pageHref('agreement')"
      @update:open="informationOpen = $event"
      @update:sort-open="sortOpen = $event"
      @select-sort="selectSort"
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
  flex: 1;
  min-height: 0;
  padding-top: 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.forum-sidebar-scroll::-webkit-scrollbar {
  display: none;
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
  font-size: 12px;
  font-weight: 500;
  line-height: 24px;
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
