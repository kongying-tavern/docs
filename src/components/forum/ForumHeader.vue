<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumData } from '~/stores/useForumData'
import ForumNavigation from './ForumNavigation.vue'
import ForumSearchbox from './ForumSearchbox.vue'

const { message } = useLocalized()

const sortLabel = new Map([
  ['created', message.value.forum.header.sort.created],
  ['updated', message.value.forum.header.sort.updated],
  ['notes_count', message.value.forum.header.sort.notesCount],
])

const forumData = useForumData()
</script>

<template>
  <div mb-6>
    <ForumNavigation />

    <div flex justify-between>
      <ForumSearchbox />

      <div class="forum-topic-sort">
        <Select v-model="forumData.sort">
          <SelectTrigger
            class="mt-2 w-27 whitespace-break-spaces font-size-4 shadow-none"
          >
            {{ sortLabel.get(forumData.sort) }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">
              {{ message.forum.header.sort.created }}
            </SelectItem>
            <SelectItem value="updated">
              {{ message.forum.header.sort.updated }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 468px) {
  .forum-topic-sort {
    display: none;
  }
}
</style>
