<script lang="ts" setup>
import { useRouter } from 'vitepress'
import { onMounted } from 'vue'

const { go } = useRouter()

const checkUserLang = (language: string | string[]): boolean => {
  const userLang = getUserLang()
  const checkLang = (lang: string): boolean => userLang === lang
  if (typeof language === 'string') {
    return checkLang(language)
  }
  return language.some((lang) => checkLang(lang))
}

const getUserLang = (): string => window.navigator.language.substring(0, 2)

onMounted(() => {
  if (document.referrer === '') return
  if (checkUserLang('en')) {
    go('/en/')
  } else if (checkUserLang(['ja', 'jp'])) {
    go('/ja/')
  } else if (checkUserLang(['kr', 'ka'])) {
    go('/kr/')
  }
})
</script>

<template>
  <div></div>
</template>
