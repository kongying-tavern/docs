<script setup lang="ts">
import { OctagonXIcon, XIcon } from '@lucide/vue'

import { useData, withBase } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getLangPath } from '@/utils'
import { useAccountLoginExperiment } from '~/forum/composables/state/useAccountLoginExperiment'
import { useHashChecker } from '~/forum/hooks/useHashChecker'
import useLogin from '~/forum/hooks/useLogin'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'

const { t } = useI18n({ useScope: 'global' })

const userAuth = useUserAuthStore()
const { localeIndex } = useData()
const { isAuthenticating, passwordLoginError, loginWithPassword } = useLogin()
const { browserAccess } = useAccountLoginExperiment()

const open = ref(false)
const username = ref('')
const password = ref('')
const canSubmit = computed(() => Boolean(username.value.trim() && password.value))
const accountLoginHelpHref = computed(() => withBase(`${getLangPath(localeIndex.value)}manual/faq/login/accountlogin`))

useHashChecker('account-login-alert', () => {
  if (!userAuth.isTokenValid && browserAccess())
    open.value = true
})

watch(open, (isOpen) => {
  if (!isOpen) {
    password.value = ''
    passwordLoginError.value = null
  }
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
    <DialogContent class="p-0 flex flex-col gap-0 max-h-[calc(100dvh-2rem)] max-w-[min(420px,calc(100vw-2rem))] overflow-hidden sm:max-w-[420px]">
      <div class="px-6 py-5 border-b bg-muted/30 shrink-0">
        <DialogHeader class="pr-8 text-left">
          <DialogTitle class="text-xl leading-tight">
            {{ t('forum.auth.loginAlert') }}
          </DialogTitle>
          <DialogDescription>
            {{ t('forum.auth.loginAlertMsg') }}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="px-6 py-5 overscroll-contain gap-5 grid min-h-0 overflow-y-auto">
        <Alert v-if="passwordLoginError" variant="destructive" class="pr-9">
          <OctagonXIcon />
          <AlertTitle>{{ passwordLoginError }}</AlertTitle>
          <button
            type="button"
            class="color-[var(--vp-c-text-2)] icon-btn right-1.5 top-1.5 absolute hover:color-[var(--vp-c-text-1)]"
            :aria-label="t('ui.button.close')"
            @click="passwordLoginError = null"
          >
            <XIcon class="size-3.5" />
          </button>
        </Alert>

        <form class="gap-4 grid" @submit.prevent="submitPasswordLogin">
          <FieldGroup class="gap-4">
            <Field>
              <FieldLabel for="gitee-login-username">
                {{ t('forum.auth.account') }}
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
                  :placeholder="t('forum.auth.accountPlaceholder')"
                  :disabled="isAuthenticating"
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel for="gitee-login-password">
                {{ t('forum.auth.password') }}
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
                  :placeholder="t('forum.auth.passwordPlaceholder')"
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
            {{ t('forum.auth.passwordLogin') }}
          </Button>

          <a :href="accountLoginHelpHref" class="text-sm vp-link w-fit">
            {{ t('forum.auth.loginHelp') }}
          </a>
        </form>

        <FieldSeparator>{{ t('forum.auth.or') }}</FieldSeparator>

        <Button
          type="button"
          variant="outline"
          class="w-full"
          :disabled="isAuthenticating"
          @click="startOAuthLogin"
        >
          <span class="i-lucide-external-link" aria-hidden="true" />
          {{ t('forum.auth.oauthLogin') }}
        </Button>

        <I18nT
          keypath="forum.auth.notGiteeAccountMsg" scope="global" tag="p"
          class="text-center"
        >
          <template #signup>
            <a
              href="https://gitee.com/signup"
              class="vp-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('forum.auth.clickToGiteeSignup') }}
            </a>
          </template>
        </I18nT>
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
  border-bottom-color: oklch(var(--ring));
  box-shadow: 0 1px 0 oklch(var(--ring));
  outline: none;
}
</style>
