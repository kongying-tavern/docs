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
import { oauth } from '@/apis/forum/gitee'
import { useData } from 'vitepress'
import { useHashChecker } from '@/composables/useHashChecker'

const { theme } = useData()

const { isMatch: open } = useHashChecker('login-alert')

const login = () => {
  return oauth.redirectAuth()
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent class="max-w-[clamp(30vw,400px,90vw)]">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ theme.forum.auth.loginAlert }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ theme.forum.auth.loginAlertMsg }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel
          class="important:border-width-1 important:border-style-solid border-color-[var(--vp-c-divider)]"
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
