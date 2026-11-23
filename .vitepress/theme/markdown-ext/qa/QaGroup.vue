<script setup lang="ts">
import { provide } from 'vue'
import { useI18n } from 'vue-i18n'

import { qaGroupKey } from './context.ts'
import { useQaGroup } from './useQaGroup.ts'

import './qa-group.css'

const { t } = useI18n({ useScope: 'global' })

const { register, unregister, expandAll, collapseAll, canExpand, canCollapse } = useQaGroup()

provide(qaGroupKey, { register, unregister })
</script>

<template>
  <div class="qa-group">
    <div class="qa-group-header">
      <button
        type="button"
        class="qa-group-action"
        :disabled="!canExpand"
        @click="expandAll"
      >
        {{ t('qa.button.expandAll') }}
      </button>
      <button
        type="button"
        class="qa-group-action"
        :disabled="!canCollapse"
        @click="collapseAll"
      >
        {{ t('qa.button.collapseAll') }}
      </button>
    </div>
    <div class="qa-group-body">
      <slot />
    </div>
  </div>
</template>
