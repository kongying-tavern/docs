<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Switch } from '@/components/ui/switch'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import SettingsSection from '~/components/settings/SettingsSection.vue'
import { useForumShortcutRecorder } from '~/forum/composables/view/useForumShortcutRecorder'

const { t } = useI18n({ useScope: 'global' })

const { groups, selected, draft, draftKeys, open, error, operationError, recorder, focusRecorder, edit, save, toggle, reset } = useForumShortcutRecorder()
function setRecorderElement(element: unknown) {
  recorder.value = element instanceof HTMLElement ? element : null
}
</script>

<template>
  <div class="shortcut-settings">
    <p v-if="operationError" role="alert" class="text-sm text-destructive">
      {{ operationError }}
    </p>
    <section v-for="group in groups" :key="group.id" :aria-labelledby="`shortcuts-${group.id}`" class="shortcut-group">
      <h3 :id="`shortcuts-${group.id}`" class="shortcut-group-title">
        {{ group.label }}
      </h3>
      <div v-for="action in group.actions" :key="action.id" class="shortcut-row">
        <Switch
          :model-value="action.enabled"
          :disabled="action.unassigned"
          :aria-labelledby="`shortcut-label-${action.id}`"
          @update:model-value="toggle(action.id, Boolean($event))"
        />
        <span :id="`shortcut-label-${action.id}`" class="shortcut-label">{{ action.label }}</span>
        <button type="button" class="shortcut-binding" :aria-label="`${t('settings.shortcuts.edit')}: ${action.label}`" @click="edit(action.id)">
          <KbdGroup v-if="action.keys.length">
            <Kbd v-for="key in action.keys" :key="key">{{ key }}</Kbd>
          </KbdGroup>
          <span v-else>{{ t('settings.shortcuts.unassigned') }}</span>
        </button>
      </div>
    </section>
    <section class="shortcut-group" aria-labelledby="shortcuts-reset">
      <h3 id="shortcuts-reset" class="shortcut-group-title">
        {{ t('settings.shortcuts.resetGroup') }}
      </h3>
      <SettingsSection id="shortcuts-reset-card" :title="t('settings.shortcuts.resetGroup')">
        <SettingsRow :title="t('settings.shortcuts.resetLabel')">
          <Button type="button" variant="outline" size="sm" @click="reset()">
            {{ t('settings.shortcuts.resetAll') }}
          </Button>
        </SettingsRow>
      </SettingsSection>
    </section>
    <Dialog v-model:open="open">
      <DialogContent @escape-key-down.prevent @open-auto-focus="focusRecorder">
        <DialogTitle>{{ t('settings.shortcuts.edit') }} · {{ selected ? t(`settings.shortcuts.actions.${selected}`) : '' }}</DialogTitle>
        <DialogDescription>{{ t('settings.shortcuts.recordDescription') }}</DialogDescription>
        <div :ref="setRecorderElement" data-shortcut-recorder tabindex="0" :aria-label="t('settings.shortcuts.recordDescription')" class="p-4 border rounded-md flex min-h-16 items-center justify-center focus-visible:outline-ring focus-visible:outline" aria-live="polite">
          <KbdGroup v-if="draftKeys.length">
            <Kbd v-for="key in draftKeys" :key="key">{{ key }}</Kbd>
          </KbdGroup>
          <span v-else class="text-muted-foreground">{{ t('settings.shortcuts.unassigned') }}</span>
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">
          {{ error }}
        </p>
        <div class="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="ghost" @click="draft = ''">
            {{ t('settings.shortcuts.clear') }}
          </Button>
          <Button type="button" variant="outline" @click="open = false">
            {{ t('settings.shortcuts.cancel') }}
          </Button>
          <Button type="button" :disabled="!!error" @click="save">
            {{ t('settings.shortcuts.save') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.shortcut-group + .shortcut-group {
  margin-block-start: 28px;
}

.shortcut-group-title {
  margin: 0 0 8px;
  color: var(--vp-c-text-2);
  @apply text-ui-13;
  font-weight: 600;
  line-height: 20px;
}

.shortcut-row {
  display: grid;
  min-height: 52px;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  border-block-end: 1px solid var(--vp-c-divider);
}

.shortcut-row:last-child {
  border-block-end: 0;
}

.shortcut-label {
  color: var(--vp-c-text-1);
  @apply text-ui-14;
  @apply leading-ui-22;
}

.shortcut-binding {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: end;
  border: 0;
  border-radius: 4px;
  padding: 4px 0 4px 8px;
  background: transparent;
  color: var(--vp-c-text-3);
  font: inherit;
  @apply text-ui-12;
  cursor: pointer;
}

.shortcut-binding:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 4px;
}

.shortcut-binding:hover {
  color: var(--vp-c-text-1);
}
</style>
