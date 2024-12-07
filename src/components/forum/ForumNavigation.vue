<template>
  <NavigationMenu class="forum-navigation mb-4">
    <NavigationMenuList>
      <NavigationMenuItem v-for="item in menuItems" :key="item.id">
        <NavigationMenuLink
          :href="`#${item.hash}`"
          :class="[
            'navigation-menu-link block color-[var(--vp-c-text-3)]',
            { active: activeItem === item.id },
            navigationMenuTriggerStyle(),
          ]"
          @click="setActive(item.id)"
        >
          {{ item.label }}
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger class="color-[var(--vp-c-text-3)]">
          {{ theme.forum.header.navigation.faq.title }}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul
            class="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]"
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
import { useData } from 'vitepress'
import { inject, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { flattenWithTags } from './utils'

const { theme } = useData()
const faq = flattenWithTags([
  theme.value.sidebar[Object.keys(theme.value.sidebar)[0]][1],
])

const menuItems = [
  {
    id: 'ALL',
    hash: 'ALL',
    label: theme.value.forum.header.navigation.allFeedback,
  },
  {
    id: 'BUG',
    hash: 'BUG',
    label: theme.value.forum.header.navigation.bugFeedback,
  },
  {
    id: 'FEAT',
    hash: 'FEAT',
    label: theme.value.forum.header.navigation.featFeedback,
  },
]

const activeItem = ref('ALL')
const filterBy = inject<Ref<string>>('filterBy')!

const setActive = (id: string) => {
  activeItem.value = id
  filterBy.value = id
  window.location.hash = id
}

const updateFilterType = () => {
  const hash = window.location.hash.slice(1)

  if (!hash) return (activeItem.value = 'ALL')

  const item = menuItems.find((item) => item.hash === hash)

  if (item) activeItem.value = item.id
}

watch(activeItem, (newValue) => {
  filterBy.value = newValue
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
