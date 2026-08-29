<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLocalized } from '@/hooks/useLocalized'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'
import ForumTranslationSettings from './ForumTranslationSettings.vue'

const { message } = useLocalized()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
</script>

<template>
  <Drawer v-if="isMobile">
    <DrawerTrigger as-child>
      <Button type="button" variant="ghost" size="icon" class="rounded-full size-6" :aria-label="message.forum.translate.settings">
        <span class="i-lucide-sliders-horizontal size-3.5" aria-hidden="true" />
      </Button>
    </DrawerTrigger>
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerHeader class="text-left">
        <DrawerTitle>{{ message.forum.translate.settings }}</DrawerTitle>
        <DrawerDescription>{{ message.forum.translate.settingsDescription }}</DrawerDescription>
      </DrawerHeader>
      <div class="px-4 pb-2">
        <ForumTranslationSettings />
      </div>
    </DrawerContent>
  </Drawer>

  <Popover v-else>
    <PopoverTrigger as-child>
      <Button type="button" variant="ghost" size="icon" class="rounded-full size-6" :aria-label="message.forum.translate.settings">
        <span class="i-lucide-sliders-horizontal size-3.5" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="p-2 w-80">
      <ForumTranslationSettings />
    </PopoverContent>
  </Popover>
</template>
