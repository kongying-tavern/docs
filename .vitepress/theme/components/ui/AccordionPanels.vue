<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

interface AccordionPanelItem {
  value: string
  title: string
  description?: string
  slot?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
  triggerClass?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
}

interface Props {
  items: AccordionPanelItem[]
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  collapsible?: boolean
  class?: HTMLAttributes['class']
  itemClass?: HTMLAttributes['class']
  triggerClass?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  type: 'single',
  collapsible: true,
})

const slots = useSlots()

function resolveSlotName(item: AccordionPanelItem) {
  return item.slot ?? item.value
}

function hasSlot(name: string) {
  if (name === 'default')
    return Boolean(slots.default)

  return Boolean(slots[name])
}
</script>

<template>
  <Accordion
    :type="props.type"
    :collapsible="props.collapsible"
    :default-value="props.defaultValue"
    :class="cn('w-full', props.class)"
  >
    <AccordionItem
      v-for="item in props.items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
      :class="cn(props.itemClass, item.class)"
    >
      <AccordionTrigger :class="cn(props.triggerClass, item.triggerClass)">
        {{ item.title }}
      </AccordionTrigger>
      <AccordionContent :class="cn(props.contentClass, item.contentClass)">
        <template v-if="resolveSlotName(item) === 'default'">
          <slot :item="item">
            <div
              v-if="item.description"
              class="text-muted-foreground leading-6"
            >
              {{ item.description }}
            </div>
          </slot>
        </template>

        <slot
          v-else-if="hasSlot(resolveSlotName(item))"
          :name="resolveSlotName(item)"
          :item="item"
        />

        <div
          v-else-if="item.description"
          class="text-muted-foreground leading-6"
        >
          {{ item.description }}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
