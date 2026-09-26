<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { rememberLoginIntent } from '~/services/forum/loginIntent'
import { FORM_HASH } from '../form/publish-topic-form/config'
import ForumAsideSection from './ForumAsideSection.vue'

const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.login)

function startOAuthLogin(): void {
  rememberLoginIntent(FORM_HASH)
  location.hash = 'oauth-login-alert'
}
</script>

<template>
  <ForumAsideSection section-id="login" :title="copy.title" card>
    <p>{{ copy.description }}</p>
    <Button class="aside-login-button w-full" type="button" @click="startOAuthLogin">
      <span class="i-lucide-log-in" aria-hidden="true" />
      {{ copy.oauth }}
    </Button>
  </ForumAsideSection>
</template>

<style scoped>
p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
  text-wrap: pretty;
}

.aside-login-button {
  margin-top: 18px;
}
</style>
