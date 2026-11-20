<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHashChecker } from '@/src/forum/hooks/useHashChecker'
import useLogin from '@/src/forum/hooks/useLogin'
import { clearLoginIntent } from '@/src/forum/services/loginIntent'
import { useUserAuthStore } from '@/src/forum/stores/auth/useUserAuth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'

const { t } = useI18n({ useScope: 'global' })

const userAuth = useUserAuthStore()
const { redirectAuth } = useLogin()
const open = ref(false)

useHashChecker(['login-alert', 'oauth-login-alert'], () => {
  if (!userAuth.isTokenValid)
    open.value = true
})
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="max-w-[min(420px,calc(100vw-2rem))]">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('forum.auth.oauthLoginAlert') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('forum.auth.oauthLoginAlertMsg') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="clearLoginIntent">
          {{ t('ui.button.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction @click="redirectAuth">
          {{ t('forum.auth.oauthLogin') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
