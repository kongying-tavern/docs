<script setup lang="ts">
import type { ForumImageCommand } from '~/forum/composables/view/useForumImageMenu'
import type { ForumImageResource } from '~/forum/services/forumImageResource'
import { useForumImageMenu } from '~/forum/composables/view/useForumImageMenu'
import ForumMenuContext from './ForumMenuContext.vue'

const props = defineProps<{
  image: ForumImageResource
  commands?: ForumImageCommand[]
  active: boolean
  accepts: (event: KeyboardEvent, id?: string) => boolean
}>()
const { menu } = useForumImageMenu(() => props.image, () => props.commands ?? [], () => props.active, (event, id) => props.accepts(event, id))
</script>

<template>
  <ForumMenuContext :menu="menu">
    <slot />
  </ForumMenuContext>
</template>
