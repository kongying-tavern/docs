<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { ForumSearchFacet, ForumSearchQuery, ForumSearchState } from '~/forum/services/forumSearchQuery'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { useForumLabelStore } from '~/composables/useForumLabelStore'
import { useForumSearchToken } from '~/composables/useForumSearchToken'
import { usePermissionData } from '~/composables/usePermissionData'
import { useTopicTagDisplay } from '~/composables/useTopicTagDisplay'
import { FORUM_SEARCH_STATES, getForumSearchStateGroup } from '~/forum/services/forumSearchQuery'
import { getForumSearchUserGroups } from '~/forum/services/forumSearchUsers'
import { TOPIC_STATUS_GROUP_ORDER } from '~/forum/services/forumTopicStatus'
import ForumTopicStatusBadge from '../ui/ForumTopicStatusBadge.vue'

const props = defineProps<{
  query: ForumSearchQuery
  facet: ForumSearchFacet | null
  users?: ForumAPI.User[]
  inline?: boolean
}>()

const emit = defineEmits<{
  back: []
  chooseFacet: [facet: ForumSearchFacet]
  toggle: [facet: ForumSearchFacet, value: string]
}>()

const { message } = useLocalized()
const { getStateLabel } = useForumSearchToken()
const { permissionData, ensureFreshData } = usePermissionData()
const tagMap = computed(() => getTopicTagMap(message))
const tagLabelGetter = getTopicTagLabelGetter()
const labelStore = useForumLabelStore()
const { getTagDisplay } = useTopicTagDisplay()
const activeIndex = ref(0)
const pickerEl = ref<HTMLElement>()
const authorSearch = ref('')
const authorSearchEl = useTemplateRef<HTMLInputElement>('authorSearchEl')

const rootOptions = computed(() => [
  {
    facet: 'state' as const,
    icon: 'i-lucide-list-filter',
    label: message.value.forum.topic.searchFacets.state,
    inlineLabel: message.value.forum.header.search.stateFilter,
    title: message.value.forum.topic.searchFacets.stateTitle,
    description: message.value.forum.topic.searchFacets.stateDescription,
  },
  {
    facet: 'tags' as const,
    icon: 'i-lucide-tags',
    label: message.value.forum.topic.searchFacets.tags,
    inlineLabel: message.value.forum.topic.searchFacets.tags,
    title: message.value.forum.topic.searchFacets.tagsTitle,
    description: message.value.forum.topic.searchFacets.tagsDescription,
  },
  {
    facet: 'author' as const,
    icon: 'i-lucide-user-round',
    label: message.value.forum.topic.searchFacets.author,
    inlineLabel: message.value.forum.header.search.userFilter,
    title: message.value.forum.topic.searchFacets.authorTitle,
    description: message.value.forum.topic.searchFacets.authorDescription,
  },
])

const tagGroups = computed(() => {
  // 静态 i18n 标签打底，合并仓库实时 CATA- 标签（不在静态表里的动态标签按原名展示）
  const dynamicOptions = labelStore.categoryLabels.value
    .filter(label => !tagLabelGetter.isLabel(label.name))
    .map(label => [label.name, getTagDisplay(label.name)] as [string, string])
  const options = [...tagMap.value, ...dynamicOptions] as Array<[string, string]>
  return indexGroups([
    {
      id: 'platforms',
      label: message.value.forum.topic.searchFacets.platforms,
      options: options.filter(([tag]) => tag.includes('PLATFORM')),
    },
    {
      id: 'categories',
      label: message.value.forum.topic.searchFacets.categories,
      options: options.filter(([tag]) => !tag.includes('PLATFORM')),
    },
  ])
})

const statusGroups = computed(() => indexGroups(
  TOPIC_STATUS_GROUP_ORDER.map(group => ({
    id: group,
    label: message.value.forum.topic.statusGroups[group],
    options: FORUM_SEARCH_STATES
      .filter(state => getForumSearchStateGroup(state) === group)
      .map(state => ({ id: state })),
  })).filter(group => group.options.length > 0),
))

const authorGroups = computed(() => indexGroups(
  getForumSearchUserGroups(props.users ?? [], permissionData.value.teamMembers, authorSearch.value)
    .map(group => ({
      id: group.id,
      label: group.id === 'recommended'
        ? message.value.forum.topic.searchFacets.recommendedUsers
        : message.value.forum.topic.searchFacets.teamMembers,
      options: group.users,
    })),
))

const optionCount = computed(() => {
  if (!props.facet)
    return rootOptions.value.length
  if (props.facet === 'tags')
    return tagGroups.value.reduce((count, group) => count + group.options.length, 0)
  if (props.facet === 'state')
    return statusGroups.value.reduce((count, group) => count + group.options.length, 0)
  return authorGroups.value.reduce((count, group) => count + group.options.length, 0)
})

watch(() => props.facet, (facet) => {
  activeIndex.value = 0
  authorSearch.value = ''
  if (facet === 'author') {
    nextTick(() => authorSearchEl.value?.focus())
    void ensureFreshData()
  }
  if (facet === 'tags')
    void labelStore.loadLabels()
})

watch(authorSearch, () => activeIndex.value = 0)

function isTagSelected(tag: string): boolean {
  return props.query.tags.includes(tagLabelGetter.getLabel(tag) ?? tag)
}

function isStateSelected(state: ForumSearchState): boolean {
  return props.query.states.includes(state)
}

function moveActive(offset: number) {
  if (!optionCount.value)
    return
  activeIndex.value = (activeIndex.value + offset + optionCount.value) % optionCount.value
  nextTick(() => pickerEl.value?.querySelector<HTMLElement>(`[data-forum-filter-index="${activeIndex.value}"]`)?.scrollIntoView({ block: 'nearest' }))
}

function selectActive() {
  pickerEl.value?.querySelector<HTMLButtonElement>(`[data-forum-filter-index="${activeIndex.value}"]`)?.click()
}

function indexGroups<T, G extends { options: T[] }>(groups: G[]): Array<G & { startIndex: number }> {
  let startIndex = 0
  return groups.map((group) => {
    const indexed = { ...group, startIndex }
    startIndex += group.options.length
    return indexed
  })
}

defineExpose({ moveActive, selectActive })
</script>

<template>
  <div ref="pickerEl" class="forum-filter-picker" :class="{ 'is-inline': inline }" :role="inline ? undefined : 'listbox'" :aria-label="message.forum.topic.searchFacets.label">
    <div v-if="inline && !facet" class="forum-filter-picker-categories">
      <button
        v-for="option in rootOptions"
        :key="option.facet"
        type="button"
        class="forum-filter-picker-category"
        @click="emit('chooseFacet', option.facet)"
      >
        <span class="forum-filter-picker-category-icon" :class="option.icon" aria-hidden="true" />
        <span>{{ option.inlineLabel }}</span>
      </button>
    </div>
    <div v-else-if="!facet" class="forum-filter-picker-header">
      {{ message.forum.topic.searchFacets.choose }}
    </div>
    <button v-else type="button" class="forum-filter-picker-back" @click="emit('back')">
      <span class="i-lucide-arrow-left size-4" aria-hidden="true" />
      {{ message.forum.topic.searchFacets.back }}
    </button>

    <div v-if="!inline || facet" class="forum-filter-picker-options" :class="{ 'is-inline': inline }">
      <template v-if="!facet">
        <button
          v-for="(option, index) in rootOptions"
          :key="option.facet"
          type="button"
          class="forum-filter-picker-root-option"
          :class="{ active: activeIndex === index }"
          :data-forum-filter-index="index"
          role="option"
          :aria-selected="false"
          @mouseenter="activeIndex = index"
          @click="emit('chooseFacet', option.facet)"
        >
          <span class="forum-filter-picker-icon" :class="option.icon" aria-hidden="true" />
          <span class="min-w-0">
            <span class="forum-filter-picker-title">{{ option.title }}</span>
            <span class="forum-filter-picker-description">{{ option.description }}</span>
          </span>
          <span class="i-lucide-chevron-right ml-auto shrink-0 size-4" aria-hidden="true" />
        </button>
      </template>

      <template v-else-if="facet === 'tags'">
        <template v-for="group in tagGroups" :key="group.id">
          <div class="forum-filter-picker-group">
            {{ group.label }}
          </div>
          <button
            v-for="([tag, label], index) in group.options"
            :key="tag"
            type="button"
            class="forum-filter-picker-option"
            :class="{ active: !inline && activeIndex === group.startIndex + index }"
            :data-forum-filter-index="group.startIndex + index"
            :role="inline ? undefined : 'option'"
            :aria-selected="inline ? undefined : isTagSelected(tag)"
            :aria-pressed="inline ? isTagSelected(tag) : undefined"
            @mouseenter="activeIndex = Number(($event.currentTarget as HTMLElement).dataset.forumFilterIndex)"
            @click="emit('toggle', 'tags', tagLabelGetter.getLabel(tag) ?? tag)"
          >
            <span class="i-lucide-tag forum-filter-picker-option-icon" aria-hidden="true" />
            <span>{{ label }}</span>
            <span v-if="isTagSelected(tag)" class="i-lucide-check ml-auto size-4" aria-hidden="true" />
          </button>
        </template>
      </template>

      <template v-else-if="facet === 'state'">
        <template v-for="group in statusGroups" :key="group.id">
          <div class="forum-filter-picker-group">
            {{ group.label }}
          </div>
          <button
            v-for="(option, index) in group.options"
            :key="option.id"
            type="button"
            class="forum-filter-picker-option"
            :class="{ active: !inline && activeIndex === group.startIndex + index }"
            :data-forum-filter-index="group.startIndex + index"
            :role="inline ? undefined : 'option'"
            :aria-selected="inline ? undefined : isStateSelected(option.id)"
            :aria-pressed="inline ? isStateSelected(option.id) : undefined"
            @mouseenter="activeIndex = Number(($event.currentTarget as HTMLElement).dataset.forumFilterIndex)"
            @click="emit('toggle', 'state', option.id)"
          >
            <ForumTopicStatusBadge :status="option.id" />
            <span>{{ getStateLabel(option.id) }}</span>
            <span v-if="isStateSelected(option.id)" class="i-lucide-check ml-auto size-4" aria-hidden="true" />
          </button>
        </template>
      </template>

      <template v-else>
        <div class="forum-filter-picker-user-search">
          <span class="i-lucide-search forum-filter-picker-search-icon" aria-hidden="true" />
          <input
            ref="authorSearchEl"
            v-model="authorSearch"
            type="search"
            :placeholder="message.forum.topic.searchFacets.searchUsers"
            :aria-label="message.forum.topic.searchFacets.searchUsers"
            autocomplete="off"
            spellcheck="false"
            @keydown.down.prevent="moveActive(1)"
            @keydown.up.prevent="moveActive(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc.prevent="emit('back')"
          >
        </div>
        <template v-for="group in authorGroups" :key="group.id">
          <template v-if="group.options.length">
            <div class="forum-filter-picker-group">
              {{ group.label }}
            </div>
            <button
              v-for="(user, index) in group.options"
              :key="user.login"
              type="button"
              class="forum-filter-picker-option forum-filter-picker-user-option"
              :class="{ active: !inline && activeIndex === group.startIndex + index }"
              :data-forum-filter-index="group.startIndex + index"
              :role="inline ? undefined : 'option'"
              :aria-selected="inline ? undefined : query.author?.toLocaleLowerCase() === user.login.toLocaleLowerCase()"
              :aria-pressed="inline ? query.author?.toLocaleLowerCase() === user.login.toLocaleLowerCase() : undefined"
              @mouseenter="activeIndex = group.startIndex + index"
              @click="emit('toggle', 'author', user.login)"
            >
              <img v-if="user.avatar" :src="user.avatar" alt="" class="forum-filter-picker-avatar">
              <span v-else class="i-lucide-circle-user-round forum-filter-picker-avatar-placeholder" aria-hidden="true" />
              <span class="flex flex-col min-w-0">
                <span class="truncate">{{ user.username }}</span>
                <span class="forum-filter-picker-login truncate">@{{ user.login }}</span>
              </span>
              <span v-if="query.author?.toLocaleLowerCase() === user.login.toLocaleLowerCase()" class="i-lucide-check ml-auto size-4" aria-hidden="true" />
            </button>
          </template>
        </template>
        <div v-if="!optionCount" class="forum-filter-picker-empty">
          {{ message.forum.topic.searchFacets.noOptions }}
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.forum-filter-picker {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  width: max(100%, 336px);
  max-width: calc(100vw - 32px);
  max-height: min(460px, 65vh);
  overflow-y: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 6px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}

.forum-filter-picker.is-inline {
  position: static;
  width: var(--forum-search-content-width, 100%);
  max-width: none;
  max-height: none;
  overflow: visible;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.forum-filter-picker-options.is-inline {
  padding-top: 8px;
}

.forum-filter-picker-categories {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.forum-filter-picker-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 104px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: calc(13px * var(--site-ui-scale));
  font-weight: 600;
  transition: background-color 160ms ease;
}

.forum-filter-picker-category:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-brand-1);
}

.forum-filter-picker-category-icon {
  width: 22px;
  height: 22px;
}

.forum-filter-picker-header,
.forum-filter-picker-group {
  padding: 6px 10px 5px;
  color: var(--vp-c-text-3);
  font-size: calc(11px * var(--site-ui-scale));
  font-weight: 600;
}

.forum-filter-picker-back,
.forum-filter-picker-root-option,
.forum-filter-picker-option {
  display: flex;
  width: 100%;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-2);
  text-align: left;
}

.forum-filter-picker-back {
  gap: 8px;
  align-items: center;
  margin-bottom: 3px;
  padding: 7px 10px;
  font-size: calc(12px * var(--site-ui-scale));
}

.forum-filter-picker-root-option {
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 8px 10px;
}

.forum-filter-picker-option {
  gap: 9px;
  align-items: center;
  min-height: 38px;
  padding: 7px 10px;
  font-size: calc(13px * var(--site-ui-scale));
}

.forum-filter-picker-back:hover,
.forum-filter-picker-root-option:hover,
.forum-filter-picker-root-option.active,
.forum-filter-picker-option:hover,
.forum-filter-picker-option.active {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.forum-filter-picker-icon {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  color: var(--vp-c-text-3);
}

.forum-filter-picker-title,
.forum-filter-picker-description {
  display: block;
}

.forum-filter-picker-title {
  color: var(--vp-c-text-1);
  font-size: calc(14px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
}

.forum-filter-picker-description,
.forum-filter-picker-login {
  color: var(--vp-c-text-3);
  font-size: calc(11px * var(--site-ui-scale));
  line-height: calc(16px * var(--site-ui-scale));
}

.forum-filter-picker-option-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: var(--vp-c-text-3);
}

.forum-filter-picker-avatar {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 9999px;
  object-fit: cover;
  outline: 1px solid oklch(0 0 0 / 0.1);
}

:global(.dark) .forum-filter-picker-avatar {
  outline-color: oklch(1 0 0 / 0.1);
}

.forum-filter-picker-user-option {
  min-height: 48px;
}

.forum-filter-picker-avatar-placeholder {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  color: var(--vp-c-text-3);
}

.forum-filter-picker-user-search {
  position: relative;
  margin: 2px 4px 4px;
}

.forum-filter-picker-user-search input {
  width: 100%;
  height: 34px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  padding: 0 10px 0 32px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  font-size: calc(12px * var(--site-ui-scale));
  outline: none;
}

.forum-filter-picker-user-search input:focus-visible {
  border-color: var(--vp-c-brand-1);
  outline: 2px solid color-mix(in srgb, var(--vp-c-brand-1) 45%, transparent);
  outline-offset: 1px;
}

.forum-filter-picker-search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--vp-c-text-3);
  pointer-events: none;
  transform: translateY(-50%);
}

.forum-filter-picker-empty {
  padding: 20px 10px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  text-align: center;
}
</style>
