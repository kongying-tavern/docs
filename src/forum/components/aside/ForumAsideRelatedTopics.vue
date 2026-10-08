<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import User from '@/components/ui/User.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/forum/composables/data/useForumQueries'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { CATEGORY_LABEL_PREFIX } from '~/forum/services/forumLabel'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicLifecycle from '../ui/ForumTopicLifecycle.vue'
import ForumTopicStatusBadge from '../ui/ForumTopicStatusBadge.vue'
import ForumAsideSection from './ForumAsideSection.vue'

const props = defineProps<{
  topic: ForumAPI.Topic
}>()

const { message } = useLocalized()
const { topicHref } = useForumRoute()
const copy = computed(() => message.value.forum.aside.related)

// 反馈标签按前缀识别，动态新增的 CATA- 标签同样参与相关推荐
const relatedLabels = computed(() => props.topic.tags.filter(tag => tag.startsWith(CATEGORY_LABEL_PREFIX)))
const canLoadRelated = computed(() => relatedLabels.value.length > 0)
const relatedTopics = useForumTopicsQuery(computed(() => ({
  filter: 'all',
  sort: 'created',
  q: '',
  creator: null,
  labels: relatedLabels.value,
  state: 'all',
  pageSize: 6,
})), canLoadRelated)
const relatedSuggestions = computed(() => relatedTopics.rows.value
  .filter(topic => String(topic.id) !== String(props.topic.id))
  .slice(0, 5))

function commentCount(topic: ForumAPI.Topic): number {
  return Math.max(0, topic.commentCount)
}
</script>

<template>
  <ForumAsideSection v-if="canLoadRelated && relatedSuggestions.length" section-id="related" :title="copy.title">
    <ol class="related-topic-list">
      <li v-for="related in relatedSuggestions" :key="related.id">
        <a :href="topicHref(String(related.id), null)" class="related-topic">
          <User
            class="related-user"
            size="xs"
            :avatar="{ src: related.user.avatar, alt: related.user.login }"
          >
            <template #name>
              <span class="related-identity">
                <span class="related-name">{{ related.user.username || related.user.login }}</span>
                <span class="related-login">@{{ related.user.login }}</span>
              </span>
            </template>
          </User>
          <span class="related-title">{{ related.title }}</span>
          <span class="related-footer">
            <span class="related-meta">
              <span>{{ message.forum.sidebar.totalComments.replace('{count}', String(commentCount(related))) }}</span>
              <ForumTime :date="related.createdAt" :toggleable="false" />
            </span>
            <span class="related-status">
              <ForumTopicLifecycle v-if="related.type === 'BUG' || related.type === 'FEAT'" :state="related.state" icon-only />
              <span v-if="related.status" class="related-conclusion">
                <ForumTopicStatusBadge :status="related.status" />
                {{ message.forum.topic.status[related.status] }}
              </span>
              <span v-if="related.goodIssue" class="related-conclusion">
                <ForumTopicStatusBadge status="good-issue" />
                {{ message.forum.topic.status.goodIssue }}
              </span>
            </span>
          </span>
        </a>
      </li>
    </ol>
  </ForumAsideSection>
</template>

<style scoped>
.related-topic-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.related-topic-list li + li {
  border-top: 1px solid var(--vp-c-divider);
}

.related-topic {
  display: grid;
  gap: 7px;
  padding: 13px 4px;
  border-radius: 8px;
  min-width: 0;
}

.related-user {
  min-width: 0;
}

.related-identity {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 4px;
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

.related-name {
  overflow: hidden;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-title);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-login {
  overflow: hidden;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-subtitle);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 500;
  line-height: calc(21px * var(--site-ui-scale));
  overflow-wrap: anywhere;
}

.related-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 3px;
}

.related-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-2);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
  font-variant-numeric: tabular-nums;
}

.related-meta > span {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.related-meta :deep(time) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-status,
.related-conclusion {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  color: var(--vp-c-text-2);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
  white-space: nowrap;
}
</style>
