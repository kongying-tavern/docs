<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { getLangPath } from '@/utils'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import BentoGridItem from './ForumBento.vue'

const props = defineProps<{
  list: ForumAPI.Topic[]
}>()

const { localeIndex } = useData()

const presetUser = {
  avatar: 'https://yuanshen.site/docs/imgs/common/logo/logo_256.png',
  username: 'Kongying Tavern',
  login: 'kongying-tavern',
}

const presetList: {
  id: string
  icon: string
  title: string
  relativeLink: string
  user: {
    avatar: string
    username: string
    login: string
  }
}[] = [
  {
    id: 'team-blog',
    icon: 'i-lucide-rss',
    title: '团队博客',
    relativeLink: 'blog',
    user: presetUser,
  },
  {
    id: 'manuel',
    icon: 'i-lucide-book-text',
    title: '使用手册',
    relativeLink: 'manual/client/',
    user: presetUser,
  },
  {
    id: 'community',
    icon: 'i-lucide-aperture',
    title: '加入社区',
    relativeLink: 'community',
    user: presetUser,
  },
]

const sortedList = computed(() => {
  return [...props.list].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
})
</script>

<template>
  <Carousel
    v-slot="{ canScrollNext, canScrollPrev }"
    class="w-full"
    :opts="{
      align: 'start',
    }"
  >
    <CarouselContent class="-ml-1">
      <CarouselItem v-for="topic in [...sortedList, ...presetList]" :key="topic.id" class="pl-4 lg:basis-1/4 md:basis-1/2">
        <BentoGridItem class="border border-[var(--vp-c-divider)]" :to="withBase(getLangPath(localeIndex) + ('relativeLink' in topic ? topic.relativeLink : `feedback/topic/${topic.id}`))">
          <template #icon>
            <span class="icon-btn size-6" :class="'icon' in topic ? topic.icon : 'i-lucide-pin'" />
          </template>

          <template #title>
            <h4 class="line-clamp-1">
              {{ topic.title }}
            </h4>
          </template>

          <template #description>
            <User size="xs" :name="topic.user.username" :avatar="{ src: topic.user.avatar, alt: topic.user.login }" />
          </template>
        </BentoGridItem>
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious v-if="canScrollPrev" class="left-1rem" />
    <CarouselNext v-if="canScrollNext" class="right-1rem" />
  </Carousel>
</template>
