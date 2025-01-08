<template>
  <NavigationMenu class="forum-navigation mb-4">
    <NavigationMenuList>
      <NavigationMenuItem v-for="item in menuItems" :key="item.id">
        <NavigationMenuLink
          :href="`#${item.hash}`"
          :class="[
            'navigation-menu-link block color-[var(--vp-c-text-3)] bg-transparent',
            { active: activeItem === item.id },
            navigationMenuTriggerStyle(),
          ]"
          @click="setActive(item.id)"
        >
          {{ item.label }}
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger
          class="color-[var(--vp-c-text-3)] bg-transparent"
        >
          {{ message.forum.header.navigation.faq.title }}
        </NavigationMenuTrigger>
        <NavigationMenuContent class="z-index-999999">
          <ul
            class="grid w-[400px] gap-3 p-4 md:w-[400px] md:grid-cols-2 lg:w-[500px]"
          >
            <li v-for="item in faq" :key="item.text">
              <NavigationMenuLink as-child>
                <a
                  :href="item.link"
                  class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div class="text-sm font-medium leading-none">
                    {{ item.text }}
                  </div>
                  <!-- <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {{ item.link }}
                  </p> -->
                </a>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>

<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { flattenWithTags } from './utils'
import { useForumData, type FilterType } from '~/stores/useForumData'
import { storeToRefs } from 'pinia'
import { useHashChecker } from '@/hooks/useHashChecker'

const { message } = useLocalized()
const { theme } = useData()

const faq = flattenWithTags([
  theme.value.sidebar[Object.keys(theme.value.sidebar)[0]][2],
])

const menuItems: {
  id: FilterType
  hash: FilterType
  label: string
}[] = [
  {
    id: 'ALL',
    hash: 'ALL',
    label: message.value.forum.header.navigation.allFeedback,
  },
  {
    id: 'BUG',
    hash: 'BUG',
    label: message.value.forum.header.navigation.bugFeedback,
  },
  {
    id: 'FEAT',
    hash: 'FEAT',
    label: message.value.forum.header.navigation.featFeedback,
  },
]

const { filter, loading } = storeToRefs(useForumData())

const activeItem = ref<FilterType>(filter.value)

const setActive = (id: FilterType) => {
  activeItem.value = id
  filter.value = id
  window.location.hash = id
}

const updateFilterType = () => {
  const hash = window.location.hash.slice(1)
  if (loading.value) return
  if (!hash) return (activeItem.value = 'ALL')

  const item = menuItems.find((item) => item.hash === hash)

  if (item) activeItem.value = item.id
}

watch(activeItem, (newValue) => {
  filter.value = newValue
})

onMounted(() => {
  updateFilterType()
  window.addEventListener('hashchange', updateFilterType)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', updateFilterType)
})
</script>

<style scoped>
@media (max-width: 468px) {
  .forum-navigation {
    display: none;
  }
}

.navigation-menu-link.active {
  display: block;
  color: var(--vp-c-text-1);
}

.navigation-menu-link.active::after {
  content: '';
  display: inline-block;
  width: 100%;
  height: 2px;
  margin-bottom: 6px;
  background-color: var(--vp-c-text-1);
  transition: all 0.3s;
}
</style>
