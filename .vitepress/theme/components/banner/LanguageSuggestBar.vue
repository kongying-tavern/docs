<template>
  <aside
    class="w-full py-8px"
    :lang="suggestLang"
    dir="ltr"
    aria-label="Choose country or region"
  >
    <div class="flex flex-wrap items-center w-full">
      <div class="font-size-14px max-md:w-85% text-align-left">
        {{ languageSuggestBarTranslate[suggestLocale.key].changeLanguage }}
      </div>
      <div class="flex justify-end md:mt-0 mt-4 items-center flex-1">
        <div class="w-full md:flex md:justify-end">
          <Popover class="bg-#ffffff14" v-model:open="open">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="open"
                class="md:w-[300px] w-full justify-between bg-[var(--suggest-language-bar-bg)] hover:bg-[var(--suggest-language-bar-hover-bg)] hover:c-#ffff"
              >
                <span class="vpi-languages option-icon icon-btn" />
                {{ suggestLocale?.label }}
                <span
                  class="i-lucide:chevron-down ml-2 h-4 w-4 shrink-0 opacity-50"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              class="w-[--radix-popper-anchor-width] p-0 border-none bg-[var(--banner-bg)]"
            >
              <Command>
                <CommandList>
                  <CommandGroup class="bg-[var(--banner-bg)] c-#fff">
                    <CommandItem
                      v-for="locale in LOCALE_CONFIG"
                      :key="locale.key"
                      :value="locale.key"
                      @select="handleLanguageSelect"
                      class="focus:bg-[var(--suggest-language-bar-bg)] hover:bg-[var(--suggest-language-bar-bg)] hover:c-#fff"
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
          class="bg-#f5f5f7 hover:bg-#fff c-#222 mx-12px"
          @click="toSuggestLanguagePage(suggestLocale.key)"
        >
          {{ languageSuggestBarTranslate[suggestLocale.key].continue }}
        </Button>

        <button
          class="icon-btn size-28px ml-8px max-md:top-17px max-md-right-17px max-md:absolute"
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
import { computed, ref } from 'vue'
import { useData, useRouter, withBase } from 'vitepress'
import { ensureStartingSlash, getLangPath } from '@/utils'
import { languageSuggestBarTranslate } from '../../../locales/common/LanguageSuggestBar'
import { LOCALE_CONFIG } from './configs'

const { suggestLang } = defineProps<{
  suggestLang: string
}>()

const emit = defineEmits(['close'])

const { localeIndex, page, theme, site, hash } = useData()
const { go } = useRouter()

const open = ref(false)
const currentLang = computed(() => getLangPath(localeIndex.value))
const suggestLocale = computed(
  () =>
    LOCALE_CONFIG.find((val) => val?.lang.includes(suggestLang)) ??
    LOCALE_CONFIG[0],
)

const handleLanguageSelect = (ev: CustomEvent) => {
  if (typeof ev.detail.value !== 'string') return
  toSuggestLanguagePage(ev.detail.value)
  emit('close')
}

function toSuggestLanguagePage(locale?: string) {
  go(
    withBase(
      normalizeLink(
        getLangPath(locale || suggestLocale.value.key),
        theme.value.i18nRouting !== false,
        page.value.relativePath.slice(currentLang.value.length - 1),
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
    ? link.replace(/\/$/, '') +
        ensureStartingSlash(
          path
            .replace(/(^|\/)index\.md$/, '$1')
            .replace(/\.md$/, addExt ? '.html' : ''),
        )
    : link
}
</script>
