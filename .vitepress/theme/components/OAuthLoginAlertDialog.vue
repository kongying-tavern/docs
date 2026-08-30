<script setup lang="ts">
import { useData } from 'vitepress'
import { ref } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useHashChecker } from '@/hooks/useHashChecker'
import useLogin from '@/hooks/useLogin'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { clearLoginIntent } from '~/services/forum/loginIntent'

const userAuth = useUserAuthStore()
const { theme } = useData()
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
        <AlertDialogTitle>{{ theme.forum.auth.oauthLoginAlert }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ theme.forum.auth.oauthLoginAlertMsg }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="clearLoginIntent">
          {{ theme.ui.button.cancel }}
        </AlertDialogCancel>
        <AlertDialogAction @click="redirectAuth">
          {{ theme.forum.auth.oauthLogin }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
