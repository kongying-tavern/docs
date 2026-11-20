<script setup lang="ts">
import { Button } from '@theme/components/ui/button/index.ts'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@theme/components/ui/drawer/index.ts'
import { Popover, PopoverContent, PopoverTrigger } from '@theme/components/ui/popover/index.ts'
import { useMediaQuery } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { FORUM_MOBILE_MEDIA_QUERY } from '@/src/forum/services/forumConfig.ts'
import ForumTranslationSettings from '../settings/ForumTranslationSettings.vue'

const { t } = useI18n({ useScope: 'global' })
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
</script>

<template>
  <Drawer v-if="isMobile">
    <DrawerTrigger as-child>
      <Button type="button" variant="ghost" size="icon" class="rounded-full size-6" :aria-label="t('forum.translate.settings')">
        <span class="i-lucide-sliders-horizontal size-3.5" aria-hidden="true" />
      </Button>
    </DrawerTrigger>
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerHeader class="text-left">
        <DrawerTitle>{{ t('forum.translate.settings') }}</DrawerTitle>
        <DrawerDescription>{{ t('forum.translate.settingsDescription') }}</DrawerDescription>
      </DrawerHeader>
      <div class="px-4 pb-2">
        <ForumTranslationSettings />
      </div>
    </DrawerContent>
  </Drawer>

  <Popover v-else>
    <PopoverTrigger as-child>
      <Button type="button" variant="ghost" size="icon" class="rounded-full size-6" :aria-label="t('forum.translate.settings')">
        <span class="i-lucide-sliders-horizontal size-3.5" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="p-2 w-80">
      <ForumTranslationSettings />
    </PopoverContent>
  </Popover>
</template>
