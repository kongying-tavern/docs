<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { rememberLoginIntent } from '~/forum/services/loginIntent'
import { FORM_HASH } from '../form/publish-topic-form/form-config'
import ForumAsideSection from './ForumAsideSection.vue'

const { t } = useI18n({ useScope: 'global' })

function startOAuthLogin(): void {
  rememberLoginIntent(FORM_HASH)
  location.hash = 'oauth-login-alert'
}
</script>

<template>
  <ForumAsideSection section-id="login" :title="t('forum.aside.login.title')" card>
    <p>{{ t('forum.aside.login.description') }}</p>
    <Button class="aside-login-button w-full" type="button" @click="startOAuthLogin">
      <span class="i-lucide-log-in" aria-hidden="true" />
      {{ t('forum.aside.login.oauth') }}
    </Button>
  </ForumAsideSection>
</template>

<style scoped>
p {
  margin: 0;
  color: var(--vp-c-text-2);
  @apply text-ui-13;
  @apply leading-ui-20;
  text-wrap: pretty;
}

.aside-login-button {
  margin-top: 18px;
}
</style>
