<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { rememberSettingsReturnUrl } from '~/services/settingsNavigation'

defineProps<{
  open: boolean
  privacyHref: string
  agreementHref: string
  settingsHref: string
}>()

defineEmits<{
  'update:open': [open: boolean]
}>()

const { message } = useLocalized()
</script>

<template>
  <div class="forum-sidebar-information">
    <Button
      variant="ghost"
      class="forum-sidebar-information-trigger w-full justify-start"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="$emit('update:open', !open)"
    >
      <span class="i-lucide-menu icon-btn bg-[var(--vp-c-text-2)] size-4" aria-hidden="true" />
      {{ message.forum.sidebar.information }}
    </Button>
    <div
      v-if="open"
      class="forum-information-popover"
      role="dialog"
      :aria-label="message.forum.sidebar.information"
    >
      <a
        class="forum-sidebar-menu-item"
        :href="settingsHref"
        @click="rememberSettingsReturnUrl()"
      >
        <span class="i-lucide-settings forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.settings.title }}
      </a>
      <a class="forum-sidebar-menu-item" :href="privacyHref">
        <span class="i-lucide-shield-check forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.forum.sidebar.privacyPolicy }}
      </a>
      <a class="forum-sidebar-menu-item" :href="agreementHref">
        <span class="i-lucide-file-text forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.forum.sidebar.userAgreement }}
      </a>
      <a
        class="forum-sidebar-menu-item"
        href="https://github.com/kongying-tavern/docs"
        target="_blank"
        rel="noopener"
      >
        <span class="i-lucide-github forum-sidebar-menu-icon icon-btn" aria-hidden="true" />
        {{ message.forum.sidebar.opensource }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.forum-sidebar-information {
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin-top: auto;
  padding: 8px 0 12px;
  background: var(--forum-sidebar-sticky-bg);
  box-shadow: 0 -10px 18px -16px var(--forum-sidebar-sticky-shadow);
}

.forum-sidebar-information::before {
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 28px;
  background: linear-gradient(to top, var(--forum-sidebar-sticky-bg), transparent);
  content: '';
  pointer-events: none;
}

.forum-sidebar-information-trigger {
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 20px;
}

.forum-sidebar-information-trigger:hover {
  background: var(--vp-c-default-soft);
}

.forum-information-popover {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 11;
  width: 256px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  overflow: visible;
}

.forum-sidebar-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 20px;
  text-align: left;
}

.forum-sidebar-menu-item:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.forum-sidebar-menu-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  background-color: currentcolor;
}
</style>
