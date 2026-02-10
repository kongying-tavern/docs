<script setup lang="ts">
import { useData, useRouter, withBase } from 'vitepress'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import CloseButton from '@/components/ui/CloseButton.vue'
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
    class="py-8px w-full"
    :lang="suggestLang"
    dir="ltr"
    aria-label="Choose country or region"
  >
    <div class="flex flex-wrap w-full items-center">
      <div class="font-size-14px text-align-left max-md:w-85%">
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
                class="bg-[var(--suggest-language-bar-bg)] w-full justify-between hover:text-white hover:bg-[var(--suggest-language-bar-hover-bg)] md:w-[300px]"
              >
                <span class="vpi-languages option-icon icon-btn" />
                {{ suggestLocale?.label }}
                <span
                  class="i-lucide:chevron-down ml-2 opacity-50 shrink-0 h-4 w-4"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              class="p-0 border-none bg-[var(--banner-bg)] w-[--radix-popper-anchor-width]"
            >
              <Command>
                <CommandList>
                  <CommandGroup class="c-#fff bg-[var(--banner-bg)]">
                    <CommandItem
                      v-for="locale in LOCALE_CONFIG"
                      :key="locale.key"
                      :value="locale.key"
                      class="c- c-#ffffffaa hover:text-white focus:bg-[var(--suggest-language-bar-bg)] hover:bg-[var(--suggest-language-bar-bg)]"
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
          class="c-#222 mx-12px bg-[var(--suggest-language-bar-bg)] hover:bg-[var(--suggest-language-bar-hover-bg)]"
          @click="toSuggestLanguagePage(suggestLocale.key)"
        >
          {{ languageSuggestBarTranslate[suggestLocale.key].continue }}
        </Button>

        <CloseButton
          class="ml-8px icon-btn size-28px max-md-right-17px max-md:top-17px max-md:absolute"
          size="28px"
          @click="emit('close')"
        />
      </div>
    </div>
  </aside>
</template>
