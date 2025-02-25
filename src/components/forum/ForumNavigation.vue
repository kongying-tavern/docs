<script setup lang="ts">
import type { FilterType } from '~/stores/useForumData'
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
import { storeToRefs } from 'pinia'
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useForumData } from '~/stores/useForumData'

import { flattenWithTags } from './utils'

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
  {
    id: 'CLOSED',
    hash: 'CLOSED',
    label: message.value.forum.header.navigation.closedFeedback,
  },
]

const { filter, loading } = storeToRefs(useForumData())

const activeItem = ref<FilterType>(filter.value)

function setActive(id: FilterType) {
  activeItem.value = id
  filter.value = id
  window.location.hash = id
}

function updateFilterType() {
  const hash = window.location.hash.slice(1)
  if (loading.value)
    return
  if (!hash)
    return (activeItem.value = 'ALL')

  const item = menuItems.find(item => item.hash === hash)

  if (item)
    activeItem.value = item.id
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

<template>
  <NavigationMenu class="forum-navigation mb-4">
    <NavigationMenuList>
      <NavigationMenuItem v-for="item in menuItems" :key="item.id">
        <NavigationMenuLink
          :href="`#${item.hash}`"
          class="navigation-menu-link block bg-transparent color-[var(--vp-c-text-3)]"
          :class="[
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
          class="bg-transparent color-[var(--vp-c-text-3)]"
        >
          {{ message.forum.header.navigation.faq.title }}
        </NavigationMenuTrigger>
        <NavigationMenuContent class="z-index-999999">
          <ul
            class="grid w-[400px] gap-3 p-4 md:grid-cols-2 lg:w-[500px] md:w-[400px]"
          >
            <li v-for="item in faq" :key="item.text">
              <NavigationMenuLink as-child>
                <VPLink
                  :href="item.link"
                  class="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors space-y-1 focus:bg-accent hover:bg-accent focus:text-accent-foreground hover:text-accent-foreground"
                >
                  <div class="text-sm font-medium leading-none">
                    {{ item.text }}
                  </div>
                  <!-- <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {{ item.link }}
                  </p> -->
                </VPLink>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>

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
