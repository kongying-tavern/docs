<script setup lang="ts">
import type { TopicFormData } from '~/forum/services/form/validation'
import { ChevronDownIcon, HashIcon, TagsIcon } from '@lucide/vue'
import { refDebounced } from '@vueuse/core'
import { ListboxFilter } from 'reka-ui'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTopicsQuery } from '~/forum/composables/data/useForumQueries'
import { VALIDATION_LIMITS } from '~/forum/services/forumConfig'
import { isQuotableTopicType } from '~/forum/services/forumTopicQuote'
import { useTagsInput } from '../composables/useTagsInput'

const props = defineProps<{ tags: string[], quotedTopic?: TopicFormData['quotedTopic'], disabled: boolean }>()
const emit = defineEmits<{
  'update:tags': [tags: string[]]
  'update:quotedTopic': [reference: TopicFormData['quotedTopic']]
}>()
const { message } = useLocalized()
const copy = computed(() => message.value.forum.publish.feedbackForm)
const tagsModel = computed({ get: () => props.tags, set: value => emit('update:tags', value) })
const { tags, tagList, isLoading, loadError, isDisabled, getLocalizedTagName, handleSelect, handleDelete, loadTags } = useTagsInput({ modelValue: tagsModel, max: VALIDATION_LIMITS.TAGS.MAX_COUNT, includeSelected: true })
const referenceOpen = ref(false)
const search = ref('')
const query = refDebounced(search, 250)
const topics = useForumTopicsQuery(computed(() => ({ filter: 'all', sort: 'updated', creator: null, q: query.value, pageSize: 20 })), referenceOpen)
const references = computed(() => topics.rows.value.filter(topic => isQuotableTopicType(topic.type)))
function selectReference(id: string, type: string) {
  if (!isQuotableTopicType(type))
    return
  emit('update:quotedTopic', { id, type })
  referenceOpen.value = false
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5 items-center">
    <Popover>
      <PopoverTrigger as-child>
        <Button id="tags" type="button" variant="secondary" size="xs" class="rounded-full" :disabled="disabled" v-bind="$attrs">
          <TagsIcon data-icon="inline-start" />
          <span class="max-w-40 truncate">{{ tagsModel.length === 1 ? getLocalizedTagName(tagsModel[0]) : copy.selectTags }}</span>
          <span v-if="tagsModel.length > 1">{{ tagsModel.length }}</span>
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" class="p-0 max-w-[calc(100vw-2rem)] w-72">
        <Command>
          <CommandInput :placeholder="message.forum.publish.tagsInput.searchTags" :aria-label="message.forum.publish.tagsInput.searchTags" />
          <CommandList :style="{ maxHeight: 'min(300px, calc(var(--reka-popover-content-available-height) - 42px))' }">
            <p v-if="isLoading" class="text-sm text-muted-foreground p-4">
              {{ message.forum.publish.tagsInput.loading }}
            </p>
            <div v-else-if="loadError" class="text-sm p-4" role="alert">
              {{ message.forum.publish.tagsInput.loadFailed }}
              <Button type="button" variant="ghost" size="sm" @click="loadTags">
                {{ message.forum.publish.tagsInput.retry }}
              </Button>
            </div>
            <template v-else>
              <p v-if="tags.length === 0" class="text-sm py-6 text-center" role="status">
                {{ message.forum.publish.tagsInput.noResultsFound }}
              </p>
              <CommandEmpty v-else>
                {{ message.forum.publish.tagsInput.noResultsFound }}
              </CommandEmpty>
              <CommandGroup v-for="group in tagList" :key="group.heading" :heading="group.heading">
                <CommandItem v-for="tag in group.list" :key="tag" :value="getLocalizedTagName(tag)" :disabled="disabled || (isDisabled && !tagsModel.includes(tag))" :aria-selected="tagsModel.includes(tag)" @select.prevent="tagsModel.includes(tag) ? handleDelete(tag) : handleSelect(tag)">
                  <span class="flex-1">{{ getLocalizedTagName(tag) }}</span>
                  <span v-if="tagsModel.includes(tag)" class="i-lucide-check size-4" aria-hidden="true" />
                </CommandItem>
              </CommandGroup>
            </template>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <Popover v-model:open="referenceOpen">
      <PopoverTrigger as-child>
        <Button type="button" variant="secondary" size="xs" class="rounded-full" :disabled="disabled">
          <HashIcon data-icon="inline-start" />{{ copy.selectReference }}<ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" class="p-0 max-w-[calc(100vw-2rem)] w-80">
        <Command>
          <div class="px-3 border-b flex h-10 items-center">
            <ListboxFilter v-model="search" auto-focus class="text-base outline-none bg-transparent w-full sm:text-sm" :placeholder="copy.searchReference" :aria-label="copy.searchReference" />
          </div>
          <CommandList :style="{ maxHeight: 'min(300px, calc(var(--reka-popover-content-available-height) - 42px))' }">
            <p v-if="topics.isLoading.value" class="text-sm text-muted-foreground p-4">
              {{ message.forum.publish.tagsInput.loading }}
            </p>
            <div v-else-if="topics.error.value" class="text-sm p-4" role="alert">
              {{ message.forum.loadError }}
              <Button type="button" variant="ghost" size="sm" @click="topics.refetch()">
                {{ message.forum.publish.tagsInput.retry }}
              </Button>
            </div>
            <template v-else>
              <p v-if="references.length === 0" class="text-sm py-6 text-center" role="status">
                {{ message.forum.publish.tagsInput.noResultsFound }}
              </p>
              <CommandGroup v-else>
                <CommandItem v-for="topic in references" :key="topic.id" :value="topic.id" @select="selectReference(topic.id, topic.type)">
                  <span class="text-xs text-muted-foreground shrink-0">{{ topic.id }}</span><span class="truncate">{{ topic.title }}</span>
                </CommandItem>
              </CommandGroup>
              <Button v-if="topics.canLoadMore.value" type="button" variant="ghost" size="sm" class="w-full" :disabled="topics.loadingMore.value" @click="topics.loadMore()">
                {{ message.forum.loadMore }}
              </Button>
            </template>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
