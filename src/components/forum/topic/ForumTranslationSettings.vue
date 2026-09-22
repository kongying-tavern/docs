<script setup lang="ts">
import { CheckIcon, ChevronDownIcon } from '@lucide/vue'
import {
  ListboxContent,
  ListboxFilter,
  ListboxItem,
  ListboxItemIndicator,
  ListboxRoot,
  useFilter,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import { useLanguage } from '@/composables/useLanguage'
import { useLocalized } from '@/hooks/useLocalized'
import supportedLanguages from '~/_data/supportedLanguages.json'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import { useForumTranslationPreferences } from '~/composables/forum/useForumTranslationPreferences'

const { message } = useLocalized()
const { currentPageLang } = useLanguage()
const {
  autoTranslateEnabled,
  excludedSourceLanguages,
} = useForumTranslationPreferences()
const searchTerm = ref('')
const open = ref(false)
const { contains } = useFilter({ sensitivity: 'base' })

const languageOptions = computed(() => {
  let localizedNames: Intl.DisplayNames | undefined
  let englishNames: Intl.DisplayNames | undefined
  try {
    localizedNames = new Intl.DisplayNames([currentPageLang.value], { type: 'language', style: 'long' })
    englishNames = new Intl.DisplayNames(['en'], { type: 'language', style: 'long' })
  }
  catch {
    // Language codes remain available when DisplayNames is unsupported.
  }

  return supportedLanguages
    .map(value => ({
      value,
      label: localizedNames?.of(value) ?? value,
      searchText: `${localizedNames?.of(value) ?? value} ${englishNames?.of(value) ?? ''} ${value}`,
    }))
    .toSorted((first, second) => first.label.localeCompare(second.label, currentPageLang.value))
})
const filteredLanguageOptions = computed(() => searchTerm.value
  ? languageOptions.value.filter(option => contains(option.searchText, searchTerm.value))
  : languageOptions.value)

function languageName(language: string): string {
  return languageOptions.value.find(option => option.value === language)?.label ?? language
}

watch(searchTerm, (search) => {
  if (search)
    open.value = true
})
</script>

<template>
  <div class="translation-settings">
    <SettingsRow
      :title="message.forum.translate.autoTranslate"
      :description="message.forum.translate.autoTranslateDescription"
    >
      <label class="translation-switch">
        <input v-model="autoTranslateEnabled" type="checkbox" role="switch" class="accent-[var(--vp-c-brand-1)] size-4">
        <span class="sr-only">{{ message.forum.translate.autoTranslate }}</span>
      </label>
    </SettingsRow>

    <SettingsRow
      :title="message.settings.language.excludedSourceLanguages"
      :description="message.settings.language.excludedSourceLanguagesDescription"
      align-start
    >
      <Popover v-model:open="open">
        <ListboxRoot v-model="excludedSourceLanguages" multiple highlight-on-hover>
          <PopoverAnchor class="language-tags-anchor">
            <TagsInput v-slot="{ modelValue: tags }" v-model="excludedSourceLanguages" class="language-tags">
              <TagsInputItem v-for="language in tags" :key="language.toString()" :value="language.toString()">
                <TagsInputItemText>{{ languageName(language.toString()) }}</TagsInputItemText>
                <TagsInputItemDelete />
              </TagsInputItem>

              <ListboxFilter v-model="searchTerm" as-child>
                <TagsInputInput
                  :placeholder="excludedSourceLanguages.length === 0 ? message.settings.language.searchLanguages : ''"
                  class="language-search-input"
                  @focus="open = true"
                  @keydown.enter.prevent
                  @keydown.down="open = true"
                />
              </ListboxFilter>

              <PopoverTrigger as-child>
                <Button type="button" variant="ghost" size="icon-sm" class="ml-auto self-start order-last">
                  <ChevronDownIcon data-icon="inline-start" />
                  <span class="sr-only">{{ message.settings.language.chooseLanguages }}</span>
                </Button>
              </PopoverTrigger>
            </TagsInput>
          </PopoverAnchor>

          <PopoverContent class="p-1 w-[--reka-popover-trigger-width]" align="end" @open-auto-focus.prevent>
            <ListboxContent class="language-options-list" tabindex="0">
              <p v-if="filteredLanguageOptions.length === 0" class="language-options-empty" role="status">
                {{ message.settings.language.noLanguagesFound }}
              </p>
              <ListboxItem
                v-for="option in filteredLanguageOptions"
                :key="option.value"
                :value="option.value"
                class="language-option"
                @select="searchTerm = ''"
              >
                <span class="truncate">{{ option.label }}</span>
                <span class="language-code">{{ option.value }}</span>
                <ListboxItemIndicator class="ml-auto inline-flex items-center justify-center">
                  <CheckIcon />
                </ListboxItemIndicator>
              </ListboxItem>
            </ListboxContent>
          </PopoverContent>
        </ListboxRoot>
      </Popover>
    </SettingsRow>
  </div>
</template>

<style scoped>
.translation-settings {
  display: grid;
  gap: 10px;
}

.translation-switch {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.language-tags-anchor {
  display: inline-flex;
  width: 420px;
  max-width: 100%;
  justify-content: flex-end;
}

.language-tags {
  width: 100%;
  min-width: 0;
  min-height: 36px;
}

.language-search-input {
  min-width: 72px;
}

.language-options-list {
  --language-scrollbar: color-mix(in srgb, var(--vp-c-text-3) 44%, transparent);
  --language-scrollbar-hover: color-mix(in srgb, var(--vp-c-text-2) 64%, transparent);

  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: var(--language-scrollbar) transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

.language-options-list::-webkit-scrollbar {
  width: 10px;
}

.language-options-list::-webkit-scrollbar-track {
  background: transparent;
}

.language-options-list::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: var(--language-scrollbar);
  background-clip: padding-box;
}

.language-options-list::-webkit-scrollbar-thumb:hover {
  background: var(--language-scrollbar-hover);
  background-clip: padding-box;
}

.language-options-empty {
  padding: 24px 12px;
  color: var(--muted-foreground);
  font-size: 14px;
  text-align: center;
}

.language-option {
  position: relative;
  display: flex;
  cursor: default;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
  outline: none;
}

.language-option[data-highlighted] {
  color: var(--accent-foreground);
  background: var(--accent);
}

.language-code {
  flex: none;
  color: var(--muted-foreground);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  text-transform: uppercase;
}

@media (max-width: 639px) {
  .translation-switch {
    justify-content: flex-end;
  }

  .language-tags-anchor {
    width: 100%;
  }
}
</style>
