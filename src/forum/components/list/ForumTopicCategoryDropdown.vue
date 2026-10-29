<script setup lang="ts">
import type { ForumTopicType } from '~/forum/services/forumRoute'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForumListControlOptions } from '~/forum/composables/view/useForumListControlOptions'
import ForumPillSelect from './ForumPillSelect.vue'

const props = defineProps<{ topicType: ForumTopicType }>()
const emit = defineEmits<{ change: [topicType: ForumTopicType] }>()
const { t } = useI18n({ useScope: 'global' })

const { types: options } = useForumListControlOptions()
const value = computed<ForumTopicType>({
  get: () => props.topicType,
  set: next => emit('change', next),
})
const currentLabel = computed(() => options.value.find(option => option.id === value.value)?.label ?? options.value[0].label)
</script>

<template>
  <ForumPillSelect
    v-model="value"
    :label="t('forum.header.navigation.groups.type')"
    :options="options"
    :aria-label="`${t('forum.header.navigation.groups.type')}${t('ui.labelSeparator')}${currentLabel}`"
  />
</template>
