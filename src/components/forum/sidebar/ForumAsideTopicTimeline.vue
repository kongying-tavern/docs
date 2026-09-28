<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import User from '@/components/ui/User.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicTimelineQuery } from '~/composables/forum/useForumQueries'
import { getTopicStateMap } from '~/composables/getTopicStateMap'
import { useTopicUserRole } from '~/composables/useTopicUserRole'
import { getTopicDisplayStatus } from '~/forum/services/forumTopicStatus'
import { getTopicStateIcon, getTopicStatusIcon } from '~/forum/services/forumTopicStatusIcon'
import { ensureTopicTimelineAnchor, hasTopicTimelineChanges } from '~/forum/services/forumTopicTimeline'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicStatusBadge from '../ui/ForumTopicStatusBadge.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import ForumAsideSection from './ForumAsideSection.vue'

const props = defineProps<{
  topic: ForumAPI.Topic
}>()

const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.timeline)
const topicStateMap = getTopicStateMap()
const { resolveRole } = useTopicUserRole()

const timeline = useForumTopicTimelineQuery(computed(() => props.topic.id))
const events = computed(() => ensureTopicTimelineAnchor(timeline.data.value ?? [], props.topic))
const hasChanges = computed(() => hasTopicTimelineChanges(events.value))

function statusText(status: ForumAPI.TopicStatus): string {
  return message.value.forum.topic.status[status]
}

/**
 * 方块沿用项目既有的状态色：状态标签取目标状态，状态流转走展示状态
 * （Gitee 的 progressing 与 closed 展示状态都是 closed，即「已结」）。
 */
function eventDisplayStatus(event: ForumAPI.TopicTimelineEvent): ForumAPI.TopicDisplayStatus | undefined {
  return getTopicDisplayStatus(event.to, event.state)
}

/** 轨道节点图标：状态流转按原始状态取，状态标签按展示状态取，其余按事件种类退化 */
function eventIcon(event: ForumAPI.TopicTimelineEvent): string {
  // 必须先判 state：已结(progressing)与已归档(closed)的展示状态相同，
  // 都走展示状态的话两个都会变成归档图标
  if (event.kind === 'state')
    return getTopicStateIcon(event.state) ?? 'i-lucide-circle'

  const statusIcon = getTopicStatusIcon(eventDisplayStatus(event))
  if (statusIcon)
    return statusIcon

  // 创建锚点 / 状态标签被清除
  return event.kind === 'created' ? 'i-lucide-circle-plus' : 'i-lucide-circle-minus'
}

interface TimelineSegment {
  before: string
  label: string
  /** 状态词之后的剩余文案（如日语「に変更」），与状态词分开以允许换行 */
  suffix: string
  status?: ForumAPI.TopicDisplayStatus
}

/** 哨兵：把目标状态词从模板里切出来，好让状态方块内联在它前面 */
const STATUS_SLOT = '\uE000'

/**
 * 组装节点文案。不假设状态词在句尾 —— 日语是「ステータスを X に変更」，
 * 故用哨兵定位，而不是直接裁剪字符串。
 */
function describeSegments(event: ForumAPI.TopicTimelineEvent): TimelineSegment {
  const status = eventDisplayStatus(event)

  if (event.kind === 'created')
    return { before: copy.value.created, label: '', suffix: '' }

  if (event.kind === 'state') {
    const label = (event.state ? topicStateMap.get(event.state) : event.stateLabel) ?? ''
    return segment(copy.value.stateChanged, { state: label }, 'state', status)
  }

  if (event.from && event.to) {
    return segment(copy.value.statusChanged, {
      from: statusText(event.from),
      to: statusText(event.to),
    }, 'to', status)
  }

  return event.to
    ? segment(copy.value.statusSet, { status: statusText(event.to) }, 'status', status)
    : { before: copy.value.statusCleared, label: '', suffix: '' }
}

function segment(
  template: string,
  values: Record<string, string>,
  slot: string,
  status: ForumAPI.TopicDisplayStatus | undefined,
): TimelineSegment {
  let text = template
  for (const [key, value] of Object.entries(values)) {
    if (key !== slot)
      text = text.replace(`{${key}}`, value)
  }

  const [before = '', ...rest] = text.replace(`{${slot}}`, STATUS_SLOT).split(STATUS_SLOT)
  return {
    before,
    label: values[slot] ?? '',
    suffix: rest.join(''),
    ...(status ? { status } : {}),
  }
}

const nodes = computed(() => events.value.map(event => ({
  id: event.id,
  at: event.at,
  actor: event.actor,
  icon: eventIcon(event),
  role: event.actor ? resolveRole(props.topic.user.id, event.actor.id) : null,
  ...describeSegments(event),
})))
</script>

<template>
  <ForumAsideSection
    v-if="timeline.error.value || hasChanges"
    section-id="timeline"
    :title="copy.title"
  >
    <div
      v-if="timeline.error.value"
      class="color-[--vp-c-text-2] px-1 py-3.5 border-t border-t-[var(--vp-c-divider)] border-solid flex gap-3 items-center justify-between text-ui-13"
      role="status"
    >
      <span>{{ copy.error }}</span>
      <button
        type="button"
        class="vp-link shrink-0"
        :disabled="timeline.isLoading.value"
        @click="timeline.refetch()"
      >
        {{ copy.retry }}
      </button>
    </div>

    <ol v-else class="aside-timeline-list">
      <li v-for="node in nodes" :key="node.id" class="aside-timeline-item">
        <span class="aside-timeline-icon" :class="node.icon" aria-hidden="true" />
        <div class="aside-timeline-body">
          <p class="aside-timeline-text">
            <span>{{ node.before }}</span>
            <span v-if="node.label" class="aside-timeline-status"><ForumTopicStatusBadge class="aside-timeline-square" :status="node.status" />{{ node.label }}</span>
            <span v-if="node.suffix">{{ node.suffix }}</span>
            <span class="aside-timeline-when"><span class="aside-timeline-sep" aria-hidden="true">•</span><ForumTime class="aside-timeline-time" :date="node.at" /></span>
          </p>
          <div class="aside-timeline-meta">
            <ForumUserHoverCard v-if="node.actor" :user="node.actor">
              <template #trigger>
                <User
                  class="aside-timeline-actor"
                  size="3xs"
                  :name="node.actor.username || node.actor.login"
                  :avatar="{ src: node.actor.avatar, alt: node.actor.login }"
                />
              </template>
            </ForumUserHoverCard>
            <ForumRoleBadge
              v-if="node.role"
              class="important:mb-0"
              :type="node.role"
            />
          </div>
        </div>
      </li>
    </ol>
  </ForumAsideSection>
</template>

<style scoped>
/* 类名刻意避开全局 .timeline-*：markdown 时间线的同名单会带 padding/伪元素一起套用 */
.aside-timeline-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.aside-timeline-item {
  position: relative;
  padding: 0 4px 14px 22px;
}

.aside-timeline-item:last-child {
  padding-bottom: 0;
}

/* 轨道只画到下一节点，末项留空避免尾部悬线 */
.aside-timeline-item:not(:last-child)::before {
  position: absolute;
  left: 9px;
  top: 18px;
  bottom: -5px;
  width: 1px;
  content: '';
  background-color: var(--vp-c-divider);
}

/* 轨道节点图标：语义由图标承担，色值仍由文案里的状态方块承担 */
.aside-timeline-icon {
  position: absolute;
  left: 1.5px;
  top: 1.5px;
  width: 16px;
  height: 16px;
  color: var(--vp-c-text-3);
  font-size: calc(16px * var(--site-ui-scale));
  line-height: 1;
}

.aside-timeline-body {
  min-width: 0;
}

.aside-timeline-text {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(19px * var(--site-ui-scale));
  overflow-wrap: anywhere;
}

/* 状态词与方块整体不拆行（保持 inline 才能共用正文基线，inline-flex 会自成行盒）；
   状态词之后的剩余文案（日语「に変更」）放在 chip 外，仍可自由换行 */
.aside-timeline-status {
  white-space: nowrap;
}

/* -0.1em 让方块中心与状态词的字体内容框中心重合（13px 字号实测校准） */
.aside-timeline-square {
  margin-right: 4px;
  vertical-align: -0.1em;
}

.aside-timeline-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

/* 触发 ForumUserHoverCard 的整块（头像+昵称）都可点，故给手型 */
.aside-timeline-actor {
  cursor: pointer;
}

/* 分隔点与时间整体不拆行：否则文案换行时会把「•」孤零零留在行尾。
   保持 inline（不用 flex）才能与正文共用基线。 */
.aside-timeline-when {
  white-space: nowrap;
}

/* 文案行里事件描述与时间之间的分隔点 */
.aside-timeline-sep {
  margin: 0 3px;
  color: var(--vp-c-text-3);
}

/* 时间弱化，避免在 13px 的正文行里抢戏 */
.aside-timeline-time {
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
}

/* 长昵称不撑破窄栏 */
.aside-timeline-meta :deep([data-forum-user-name]) {
  overflow: hidden;
  max-width: 8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
