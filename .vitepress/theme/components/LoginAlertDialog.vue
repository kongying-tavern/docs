<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useHashChecker } from '@/hooks/useHashChecker'
import useLogin from '@/hooks/useLogin'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { getLangPath } from '@/utils'

const userAuth = useUserAuthStore()
const { localeIndex, theme } = useData()
const { isAuthenticating, loginWithPassword } = useLogin()

const open = ref(false)
const username = ref('')
const password = ref('')
const canSubmit = computed(() => Boolean(username.value.trim() && password.value))
const accountLoginHelpHref = computed(() => withBase(`${getLangPath(localeIndex.value)}manual/faq/login/accountlogin`))

useHashChecker('account-login-alert', () => {
  if (!userAuth.isTokenValid)
    open.value = true
})

watch(open, (isOpen) => {
  if (!isOpen)
    password.value = ''
})

async function submitPasswordLogin(): Promise<void> {
  if (!canSubmit.value || isAuthenticating.value)
    return

  const success = await loginWithPassword(username.value, password.value)
  if (success) {
    username.value = ''
    password.value = ''
    open.value = false
  }
  else {
    password.value = ''
  }
}

function startOAuthLogin(): void {
  open.value = false
  location.hash = 'oauth-login-alert'
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="p-0 gap-0 max-w-[min(420px,calc(100vw-2rem))] overflow-hidden">
      <div class="px-6 py-5 border-b bg-muted/30">
        <DialogHeader class="pr-8 text-left">
          <DialogTitle class="text-xl leading-tight">
            {{ theme.forum.auth.loginAlert }}
          </DialogTitle>
          <DialogDescription>
            {{ theme.forum.auth.loginAlertMsg }}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="px-6 py-5 gap-5 grid">
        <form class="gap-4 grid" @submit.prevent="submitPasswordLogin">
          <FieldGroup class="gap-4">
            <Field>
              <FieldLabel for="gitee-login-username">
                {{ theme.forum.auth.account }}
              </FieldLabel>
              <div class="relative">
                <span class="i-lucide-user text-muted-foreground size-4 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2" aria-hidden="true" />
                <Input
                  id="gitee-login-username"
                  v-model="username"
                  name="username"
                  type="text"
                  class="login-credential-input pl-9"
                  autocomplete="username"
                  autocapitalize="none"
                  :placeholder="theme.forum.auth.accountPlaceholder"
                  :disabled="isAuthenticating"
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel for="gitee-login-password">
                {{ theme.forum.auth.password }}
              </FieldLabel>
              <div class="relative">
                <span class="i-lucide-lock-keyhole text-muted-foreground size-4 pointer-events-none left-3 top-1/2 absolute -translate-y-1/2" aria-hidden="true" />
                <Input
                  id="gitee-login-password"
                  v-model="password"
                  name="password"
                  type="password"
                  class="login-credential-input pl-9"
                  autocomplete="current-password"
                  :placeholder="theme.forum.auth.passwordPlaceholder"
                  :disabled="isAuthenticating"
                  required
                />
              </div>
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            class="w-full"
            :disabled="!canSubmit || isAuthenticating"
          >
            <span
              v-if="isAuthenticating"
              class="i-lucide-loader-circle animate-spin"
              aria-hidden="true"
            />
            {{ theme.forum.auth.passwordLogin }}
          </Button>

          <a :href="accountLoginHelpHref" class="text-sm vp-link w-fit">
            {{ theme.forum.auth.loginHelp }}
          </a>
        </form>

        <FieldSeparator>{{ theme.forum.auth.or }}</FieldSeparator>

        <Button
          type="button"
          variant="outline"
          class="w-full"
          :disabled="isAuthenticating"
          @click="startOAuthLogin"
        >
          <span class="i-lucide-external-link" aria-hidden="true" />
          {{ theme.forum.auth.oauthLogin }}
        </Button>

        <DynamicTextReplacer
          :data="theme.forum.auth.notGiteeAccountMsg"
          class="text-center"
        >
          <template #signup>
            <a
              href="https://gitee.com/signup"
              class="vp-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ theme.forum.auth.clickToGiteeSignup }}
            </a>
          </template>
        </DynamicTextReplacer>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
:deep(.login-credential-input) {
  border: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

:deep(.login-credential-input:focus-visible) {
  border-bottom-color: var(--vp-c-brand-1);
  box-shadow: 0 1px 0 var(--vp-c-brand-1);
  outline: none;
}
</style>
