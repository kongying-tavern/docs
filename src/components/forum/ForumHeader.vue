<template>
  <div mb-6>
    <ForumNavigation />
    <div flex justify-between>
      <ForumSearchbox />
      <div class="forum-topic-sort">
        <Select v-model="forumData.sort">
          <SelectTrigger class="w-27 font-size-4 mt-2 shadow-none">
            {{ sortLabel.get(forumData.sort) }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">
              {{ theme.forum.header.sort.created }}
            </SelectItem>
            <SelectItem value="updated">
              {{ theme.forum.header.sort.updated }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useData } from 'vitepress'
import ForumNavigation from './ForumNavigation.vue'
import ForumSearchbox from './ForumSearchbox.vue'
import { useForumData } from '../../stores/useForumData'

const { theme } = useData()

const sortLabel = new Map([
  ['created', theme.value.forum.header.sort.created],
  ['updated', theme.value.forum.header.sort.updated],
  ['notes_count', theme.value.forum.header.sort.notesCount],
])

const forumData = useForumData()
</script>

<style scoped>
@media (max-width: 468px) {
  .forum-topic-sort {
    display: none;
  }
}
</style>
