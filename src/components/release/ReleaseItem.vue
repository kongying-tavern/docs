<script setup lang="ts">
import type { ReleaseItem } from './Release'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { useLocalized } from '@/hooks/useLocalized'
import markdownIt from 'markdown-it'

import { computed, ref } from 'vue'

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
    class="slide-enter header-anchor relative w-full flex flex-col border-t py-24 lg:flex-row"
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

      <div class="mt-2 flex opacity-70">
        <p v-for="(action, index) in renderedActions" :key="action.text">
          <a
            rel="noopener noreferrer"
            class="whitespace-nowrap text-sm vp-link"
            target="_blank"
            :href="action.link"
          >
            {{ action.text }}
          </a>
          <span class="mx-auto px-1 align-mid text-muted-foreground">
            {{ index < renderedActions.length - 1 ? '•' : '' }}
          </span>
        </p>
      </div>

      <div class="mt-4 flex font-size-14px lh-24px opacity-70">
        <div class="m-0">
          <p v-if="warning" class="inline-block">
            <span
              class="i-lucide-circle-alert mr-1 inline-block size-6 bg-[var(--vp-c-warning-2)] vertical-bottom opacity-100"
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
        class="text-md mt-2 c-[var(--vp-c-text-1)]"
        v-html="renderedDescription"
      />

      <div class="mt-8 w-full">
        <Accordion
          v-model:model-value="list"
          type="multiple"
          class="w-full font-size-4.5"
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
                class="list-disc pl-5 font-size-4 c-[var(--vp-c-text-2)] lh-6"
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
