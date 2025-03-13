<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ensureStartingSlash, getLangPath } from '@/utils'
import { useData, useRouter, withBase } from 'vitepress'

import { computed, ref } from 'vue'

import { languageSuggestBarTranslate } from '../../../locales/common/LanguageSuggestBar'
import { LOCALE_CONFIG } from './configs'

const { suggestLang } = defineProps<{
  suggestLang: string
}>()

const emit = defineEmits(['close'])

const { localeIndex, page, theme, site, hash } = useData()
const { go } = useRouter()

const open = ref(false)
const currentLangPath = computed(() => getLangPath(localeIndex.value))
const suggestLocale = computed(
  () =>
    LOCALE_CONFIG.find(val => val?.lang.includes(suggestLang))
    ?? LOCALE_CONFIG[0],
)

function handleLanguageSelect(ev: CustomEvent) {
  if (typeof ev.detail.value !== 'string')
    return
  toSuggestLanguagePage(ev.detail.value)
  emit('close')
}

function toSuggestLanguagePage(locale?: string) {
  go(
    withBase(
      normalizeLink(
        getLangPath(locale || suggestLocale.value.key),
        theme.value.i18nRouting !== false,
        page.value.relativePath.slice(currentLangPath.value.length - 1),
        !site.value.cleanUrls,
      ) + hash.value,
    ),
  )
}

function normalizeLink(
  link: string,
  addPath: boolean,
  path: string,
  addExt: boolean,
) {
  return addPath
    ? link.replace(/\/$/, '')
    + ensureStartingSlash(
      path
        .replace(/(^|\/)index\.md$/, '$1')
        .replace(/\.md$/, addExt ? '.html' : ''),
    )
    : link
}
</script>

<template>
  <aside
    class="w-full py-8px"
    :lang="suggestLang"
    dir="ltr"
    aria-label="Choose country or region"
  >
    <div class="w-full flex flex-wrap items-center">
      <div class="text-align-left font-size-14px max-md:w-85%">
        {{ languageSuggestBarTranslate[suggestLocale.key].changeLanguage }}
      </div>
      <div class="mt-4 flex flex-1 items-center justify-end md:mt-0">
        <div class="w-full md:flex md:justify-end">
          <Popover v-model:open="open" class="bg-#ffffff14">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="open"
                class="w-full justify-between bg-[var(--suggest-language-bar-bg)] md:w-[300px] hover:bg-[var(--suggest-language-bar-hover-bg)] hover:c-#ffff"
              >
                <span class="vpi-languages option-icon icon-btn" />
                {{ suggestLocale?.label }}
                <span
                  class="i-lucide:chevron-down ml-2 h-4 w-4 shrink-0 opacity-50"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              class="w-[--radix-popper-anchor-width] border-none bg-[var(--banner-bg)] p-0"
            >
              <Command>
                <CommandList>
                  <CommandGroup class="bg-[var(--banner-bg)] c-#fff">
                    <CommandItem
                      v-for="locale in LOCALE_CONFIG"
                      :key="locale.key"
                      :value="locale.key"
                      class="focus:bg-[var(--suggest-language-bar-bg)] hover:bg-[var(--suggest-language-bar-bg)] hover:c-#fff"
                      @select="handleLanguageSelect"
                    >
                      {{ locale.label }}
                      <span
                        :class="
                          cn(
                            'i-lucide:check ml-auto h-4 w-4',
                            suggestLocale?.key === locale.key
                              ? 'opacity-100'
                              : 'opacity-0',
                          )
                        "
                      />
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          class="mx-12px bg-#f5f5f7 c-#222 hover:bg-#fff"
          @click="toSuggestLanguagePage(suggestLocale.key)"
        >
          {{ languageSuggestBarTranslate[suggestLocale.key].continue }}
        </Button>

        <button
          class="ml-8px icon-btn size-28px max-md:absolute max-md-right-17px max-md:top-17px"
          @click="emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
            />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
