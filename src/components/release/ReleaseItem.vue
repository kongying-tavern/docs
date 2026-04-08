<script setup lang="ts">
import type { ReleaseItem } from './Release'
import markdownIt from 'markdown-it'
import { computed, ref } from 'vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'

import { useLocalized } from '@/hooks/useLocalized'

const {
  version,
  type,
  feedbackLink = '../feedback/',
  actions = [],
  fixed = [],
  breaking = [],
  optimized = [],
  features = [],
  title = '',
  description = '',
  date = '1980',
} = defineProps<ReleaseItem>()

const { message, formatDate } = useLocalized()

const renderedTitle = computed(() => {
  return title
    ? markdownIt().render(title)
    : `${type}-${version} ${message.value.changelog.title} 🎉`
})

const renderedDescription = computed(() => {
  return markdownIt().render(description)
})

const defaultActions = [
  {
    text: message.value.changelog.action.download,
    link: '../download-client',
  },
  {
    text: message.value.changelog.action.community,
    link: '../community',
  },
]

const renderedActions = computed(() => [...defaultActions, ...actions])

const accordionItems = [
  {
    value: 'item-1',
    title: `${message.value.changelog.changeType.features}✨`,
    content: features,
  },
  {
    value: 'item-2',
    title: `${message.value.changelog.changeType.optimized}🪄`,
    content: optimized,
  },
  {
    value: 'item-3',
    title: `${message.value.changelog.changeType.fixed}🛠️`,
    content: fixed,
  },
  {
    value: 'item-4',
    title: `${message.value.changelog.changeType.breaking}📌`,
    content: breaking,
  },
]

const list = ref<string[]>([])
</script>

<template>
  <section
    :id="version"
    class="slide-enter header-anchor py-24 border-t flex flex-col w-full relative lg:flex-row"
  >
    <div class="w-full md:px-5">
      <h1 class="text-3xl font-bold">
        <span v-html="renderedTitle" />
      </h1>

      <time
        :id="formatDate(date, 'YYYY-MM-DD').value"
        class="c-[var(--vp-c-text-2)] lh-5"
      >
        {{ formatDate(date, 'LL') }}
      </time>

      <div class="mt-2 opacity-70 flex">
        <p v-for="(action, index) in renderedActions" :key="action.text">
          <a
            rel="noopener noreferrer"
            class="text-sm vp-link whitespace-nowrap"
            target="_blank"
            :href="action.link"
          >
            {{ action.text }}
          </a>
          <span class="text-muted-foreground mx-auto px-1 align-mid">
            {{ index < renderedActions.length - 1 ? '•' : '' }}
          </span>
        </p>
      </div>

      <div class="font-size-14px lh-24px mt-4 opacity-70 flex">
        <div class="m-0">
          <p v-if="warning" class="inline-block">
            <span
              class="i-lucide-circle-alert mr-1 vertical-bottom bg-[var(--vp-c-warning-2)] opacity-100 size-6 inline-block"
            />
            {{ warning }}
          </p>
          <DynamicTextReplacer
            class="inline-block"
            :data="message.changelog.reportIssues"
          >
            <template #feedback>
              <a target="feedback" :href="feedbackLink" class="vp-link">
                {{ message.changelog.feedbackPage }}
              </a>
            </template>
          </DynamicTextReplacer>
        </div>
      </div>

      <p
        class="text-md c-[var(--vp-c-text-1)] mt-2"
        v-html="renderedDescription"
      />

      <div class="mt-8 w-full">
        <Accordion
          v-model:model-value="list"
          type="multiple"
          class="font-size-4.5 w-full"
          collapsible
        >
          <AccordionItem
            v-for="item in accordionItems"
            v-show="item.content.length !== 0"
            :key="item.value"
            :value="item.value"
          >
            <AccordionTrigger class="font-size-4.5">
              {{ item.title }}
            </AccordionTrigger>
            <AccordionContent>
              <ul
                class="font-size-4 c-[var(--vp-c-text-2)] lh-6 pl-5 list-disc"
              >
                <li
                  v-for="(contentItem, index) in item.content"
                  :key="index"
                  v-html="markdownIt().render(contentItem)"
                />
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </section>
</template>
