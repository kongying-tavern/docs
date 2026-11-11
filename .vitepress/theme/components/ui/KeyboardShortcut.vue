<script setup lang="ts">
import type { ShortcutPlatform, ShortcutPlatformPreference } from '@/lib/keyboard'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { detectShortcutPlatform, resolveShortcutKey } from '@/lib/keyboard'

const props = withDefaults(defineProps<{
  sequence: readonly (readonly string[])[]
  platform?: ShortcutPlatformPreference
}>(), {
  platform: 'auto',
})

const { t } = useI18n({ useScope: 'global' })
// Keep this state per instance: an earlier mount must not change a later hydration.
const detectedPlatform = ref<ShortcutPlatform>('unknown')
onMounted(() => {
  detectedPlatform.value = detectShortcutPlatform(navigator)
})
const platform = computed(() => props.platform === 'auto' ? detectedPlatform.value : props.platform)
const steps = computed(() => props.sequence.map(keys => keys.map(key => resolveShortcutKey(key, platform.value))))
const hasLeadingCombination = computed(() => steps.value.length > 1 && steps.value[0].length > 1)
const description = computed(() => steps.value
  .map(keys => keys.map(key => key.name).join(t('ui.shortcut.plus')))
  .join(t('ui.shortcut.then')))
</script>

<template>
  <span data-slot="keyboard-shortcut" :data-platform="platform" class="keyboard-shortcut">
    <span class="sr-only">{{ description }}</span>
    <span aria-hidden="true" class="keyboard-shortcut-visual">
      <KbdGroup v-for="(keys, step) in steps" :key="step" class="keyboard-shortcut-step">
        <template v-for="(key, index) in keys" :key="index">
          <span v-if="index" class="keyboard-shortcut-separator"> + </span>
          <Kbd :emphasis="hasLeadingCombination ? (step === 0 ? 'strong' : 'subtle') : undefined">
            {{ key.label }}
          </Kbd>
        </template>
      </KbdGroup>
    </span>
  </span>
</template>

<style scoped>
.keyboard-shortcut {
  display: inline;
  vertical-align: baseline;
}

.keyboard-shortcut-visual {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
  max-width: 100%;
  vertical-align: middle;
}

.keyboard-shortcut-step {
  flex-shrink: 0;
  white-space: nowrap;
}

.keyboard-shortcut-separator {
  color: var(--vp-c-text-2);
  font-size: var(--text-ui-11-fontSize);
  line-height: 1;
  font-weight: 400;
}
</style>
