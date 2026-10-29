<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQRCode } from '@/hooks/useQRCode'
import ForumAsideSection from './ForumAsideSection.vue'

const { theme } = useData()

const { t } = useI18n({ useScope: 'global' })

const contactQRCode = useQRCode(computed(() => theme.value.forum.aside.contactUs.qrcodeLink))
</script>

<template>
  <ForumAsideSection section-id="contact" :title="t('forum.aside.contactUs.title')" card>
    <template #action>
      <a class="contact-action" :href="theme.forum.aside.contactUs.qrcodeLink" target="_blank" rel="noopener">
        {{ t('forum.aside.contactUs.action') }}
      </a>
    </template>
    <div class="contact-body">
      <div class="contact-copy">
        <span>{{ t('forum.aside.contactUs.join') }}</span>
        <span>{{ t('forum.aside.contactUs.desc') }}</span>
      </div>
      <a :href="theme.forum.aside.contactUs.qrcodeLink" target="_blank" rel="noopener">
        <img :src="contactQRCode" :alt="t('forum.aside.contactUs.qrCodeAlt')">
      </a>
    </div>
  </ForumAsideSection>
</template>

<style scoped>
.contact-action {
  display: inline-flex;
  height: 28px;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid oklch(var(--ring));
  border-radius: 999px;
  color: var(--vp-c-brand-1);
  @apply text-ui-12;
  font-weight: 500;
  line-height: 1;
}

.contact-body {
  display: grid;
  grid-template-columns: 1fr 88px;
  align-items: center;
  gap: 16px;
}

.contact-copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.contact-copy span {
  color: var(--vp-c-text-2);
  @apply text-ui-13;
  @apply leading-ui-19;
}

.contact-body img {
  display: block;
  width: 88px;
  height: 88px;
  border-radius: 8px;
}
</style>
