<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useQRCode } from '@/hooks/useQRCode'
import ForumAsideSection from './ForumAsideSection.vue'

const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.contactUs)
const contactQRCode = useQRCode(computed(() => copy.value.qrcodeLink))
</script>

<template>
  <ForumAsideSection section-id="contact" :title="copy.title" card>
    <template #action>
      <a class="contact-action" :href="copy.qrcodeLink" target="_blank" rel="noopener">
        {{ copy.action }}
      </a>
    </template>
    <div class="contact-body">
      <div class="contact-copy">
        <span>{{ copy.join }}</span>
        <span>{{ copy.desc }}</span>
      </div>
      <a :href="copy.qrcodeLink" target="_blank" rel="noopener">
        <img :src="contactQRCode" :alt="copy.qrCodeAlt">
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
