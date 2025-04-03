<script setup lang="ts">
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
import { useData } from 'vitepress'

const { theme } = useData()

const { isMatch: open } = useHashChecker('login-alert', () => {}, {
  clearHash: false,
})

const { redirectAuth: login } = useLogin()
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="max-w-[clamp(30vw,400px,90vw)] rounded-md">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ theme.forum.auth.loginAlert }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ theme.forum.auth.loginAlertMsg }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel
          class="border-color-[var(--vp-c-divider)] important:border-width-1 important:border-style-solid"
        >
          {{ theme.ui.button.cancel }}
        </AlertDialogCancel>
        <AlertDialogAction @click="login">
          {{ theme.forum.auth.login }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
