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
        <h3 :id="item.id" class="text-2xl c-[var(--vp-c-text-1)] font-medium mb-4 mt-1 text-center col-span-full w-full md:text-left md:hidden">
          {{ item.label }}
        </h3>

        <div
          v-for="(member, index) in item.members"
          :key="member.name"
          class="member text-xs text-neutral-800 font-normal mb-8 md:text-sm"
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
.info {
  flex-shrink: 0;
  padding: 0 24px;
  max-width: 512px;
}

@media (min-width: 768px) {
  .info {
    position: sticky;
    top: calc(var(--vp-layout-top-height, 0px) + 32px);
    left: 0;
    padding: 0 24px 0 0;
    width: 128px;
  }

  html.banner-dismissed .info {
    top: 32px;
  }
}

@media (min-width: 960px) {
  .info {
    top: calc(var(--vp-layout-top-height, 0px) + 88px);
    padding: 0 64px 0 0;
    width: 290px;
  }

  html.banner-dismissed .info {
    top: 88px;
  }
}

.title {
  display: inline-block;
  width: max-content;
  font-size: 24px;
  font-weight: 500;
  word-break: keep-all;
}

@keyframes progress {
  from {
    width: 0%;
    opacity: 0;
  }
  to {
    width: 100%;
    opacity: 1;
  }
}

.lead {
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.members {
  margin-left: 12px;
}

@media (min-width: 768px) {
  .members {
    flex-grow: 1;
  }
}

.member + .member {
  padding-top: 16px;
}

@media (min-width: 640px) {
  .member {
    margin: 0 auto;
    max-width: 592px;
  }
}

@media (min-width: 768px) {
  .member {
    margin: 0;
    max-width: 100%;
  }
}

.members {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.member {
  flex-basis: calc(25% - 26px); /* 25% width with 16px gutter between items */
  box-sizing: border-box;
  text-align: left; /* Adjust text alignment as needed */
  padding: 16px;
  display: flex;
  max-width: 140px;
  flex-direction: column;
  align-items: baseline;
}

.member p {
  margin: 0;
}

.member-name {
  font-size: 16px; /* Adjust the font size as needed */
  font-weight: bold;
  word-break: keep-all;
  white-space: nowrap;
}

.member-title {
  font-size: 14px; /* Adjust the font size as needed */
  color: var(--vp-c-text-2);
  align-self: flex-end; /* Align title to the end (bottom) of the flex container */
}
/* Add the following style to the child element you want to break onto a new line */
.break-line {
  flex-basis: 100%;
  width: 100%;
  box-sizing: border-box;
}
</style>
