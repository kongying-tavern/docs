// @unocss-includes
<script setup lang="ts">
import type { StaffListItem } from './types'
import Timeline from '@/components/ui/Timeline.vue'

const { list, title, desc } = defineProps<{
  list: StaffListItem[]
  title: string
  desc: string
}>()
</script>

<template>
  <Timeline
    class="h-fit w-full"
    :title="title"
    :description="desc"
    :items="list"
  >
    <template
      v-for="(item) in list"
      :key="`${item.id}template`"
      #[item.id]
    >
      <div
        class="ml-0 grid grid-cols-[repeat(auto-fit,minmax(150px,3fr))] h-fit w-full justify-items-center md:mt-62px md:justify-items-stretch"
      >
        <h3 :id="item.id" class="text-2xl c-[var(--vp-c-text-1)] font-medium mb-4 mt-1 text-center col-span-full w-full md:hidden">
          {{ item.label }}
        </h3>

        <div
          v-for="(member, index) in item.members"
          :key="member.name"
          class="member mb-8"
        >
          <p class="view-fade-y member-name c-[var(--vp-c-text-1)] font-[var(--vp-font-family-subtitle)] text-center w-full md:text-left">
            {{ member.name }}
          </p>
          <p v-if="member?.title" class="view-fade-y member-title c-[var(--vp-c-text-2)] text-center w-full md:text-right">
            {{ member.title }}
          </p>
          <div
            v-if="
              member.title === undefined
                && item.members[
                  index < item.members.length
                    ? index + 1
                    : item.members.length
                ]?.title !== undefined
            "
            class="break-line"
          />
        </div>
      </div>
    </template>
  </Timeline>
</template>

<style scoped>
.member {
  box-sizing: border-box;
  text-align: left;
  padding: 16px;
  display: flex;
  max-width: 140px;
  flex-direction: column;
  align-items: baseline;
  @apply leading-ui-16;
}

@media (min-width: 768px) {
  .member {
    @apply leading-ui-20;
  }
}

.member p {
  margin: 0;
}

.member-name {
  @apply text-ui-16;
  font-weight: bold;
  word-break: keep-all;
  white-space: nowrap;
}

.member-title {
  @apply text-ui-14;
  color: var(--vp-c-text-2);
  align-self: flex-end;
}
.break-line {
  flex-basis: 100%;
  width: 100%;
  box-sizing: border-box;
}
</style>
