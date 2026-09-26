import type { ComputedRef, Ref } from 'vue'
import type { SettingsSectionGroup, SettingsSectionId } from '~/config/settingsOptions'
import { useEventListener } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, onMounted, ref, toValue } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import {
  isSettingsSectionId,
  SETTINGS_SECTION_DEFINITIONS,
} from '~/config/settingsOptions'
import { consumeSettingsReturnUrl } from '~/services/settingsNavigation'

export type { SettingsSectionId } from '~/config/settingsOptions'

export interface SettingsNavigationItem {
  id: SettingsSectionId
  label: string
  icon: string
  group: SettingsSectionGroup
}

const DEFAULT_SECTION: SettingsSectionId = 'appearance'

export function useSettingsNavigation(
  translationSupported: Ref<boolean>,
  options: { hashPrefix?: string, labelManagementEnabled?: Ref<boolean>, updateHash?: boolean } = {},
): {
  sections: ComputedRef<SettingsNavigationItem[]>
  activeSection: Ref<SettingsSectionId>
  activeItem: ComputedRef<SettingsNavigationItem>
  sectionSelected: Ref<boolean>
  selectSection: (section: SettingsSectionId) => void
  showSectionList: () => void
  closeSettings: () => void
} {
  const { localeIndex } = useData()
  const router = useRouter()
  const { message } = useLocalized()
  const activeSection = ref<SettingsSectionId>(DEFAULT_SECTION)
  const sectionSelected = ref(false)

  const sections = computed<SettingsNavigationItem[]>(() => SETTINGS_SECTION_DEFINITIONS
    .filter(section => section.id !== 'language' || toValue(translationSupported))
    .filter(section => section.id !== 'labels' || toValue(options.labelManagementEnabled))
    .map(section => ({
      ...section,
      label: section.id === 'labels'
        ? message.value.forum.labelAdmin.title
        : message.value.settings[section.id].title,
    })))

  const activeItem = computed<SettingsNavigationItem>(() =>
    sections.value.find(item => item.id === activeSection.value) ?? sections.value[0]!,
  )

  function syncFromHash(): void {
    if (options.updateHash === false) {
      activeSection.value = DEFAULT_SECTION
      sectionSelected.value = false
      return
    }

    const rawHash = location.hash.slice(1)
    const hash = options.hashPrefix
      ? rawHash === options.hashPrefix ? '' : rawHash.replace(`${options.hashPrefix}/`, '')
      : rawHash
    const validSection = isSettingsSectionId(hash)
      && sections.value.some(item => item.id === hash)
    activeSection.value = validSection ? hash : DEFAULT_SECTION
    sectionSelected.value = validSection
  }

  function selectSection(section: SettingsSectionId): void {
    if (!sections.value.some(item => item.id === section))
      return

    activeSection.value = section
    sectionSelected.value = true
    if (options.updateHash === false)
      return

    const url = new URL(location.href)
    url.hash = options.hashPrefix ? `${options.hashPrefix}/${section}` : section
    history.replaceState(history.state, '', url)
  }

  function showSectionList(): void {
    sectionSelected.value = false
    if (!options.hashPrefix)
      return

    const url = new URL(location.href)
    url.hash = options.hashPrefix
    history.replaceState(history.state, '', url)
  }

  function fallbackHref(): string {
    return withBase(`${getLangPath(localeIndex.value)}feedback`)
  }

  function closeSettings(): void {
    const saved = consumeSettingsReturnUrl()
    if (options.hashPrefix) {
      const currentUrl = location.href
      const target = saved ? new URL(saved, location.href) : new URL(location.href)
      if (!saved)
        target.hash = ''
      history.replaceState(history.state, '', target)
      window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: currentUrl, newURL: target.href }))
      return
    }

    if (saved && saved !== location.href) {
      void router.go(saved)
      return
    }

    if (document.referrer && document.referrer !== location.href) {
      const referrer = new URL(document.referrer)
      if (referrer.origin === location.origin) {
        history.back()
        return
      }
    }

    void router.go(fallbackHref())
  }

  onMounted(syncFromHash)
  useEventListener('hashchange', syncFromHash)

  return {
    sections,
    activeSection,
    activeItem,
    sectionSelected,
    selectSection,
    showSectionList,
    closeSettings,
  }
}
