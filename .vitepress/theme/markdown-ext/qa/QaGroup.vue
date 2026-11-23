<script setup lang="ts">
import { provide } from 'vue'
import { useI18n } from 'vue-i18n'

import { qaGroupKey } from './context.ts'
import { useQaGroup } from './useQaGroup.ts'

import './qa-group.css'

const { t } = useI18n({ useScope: 'global' })

const { register, unregister, setAll } = useQaGroup()

provide(qaGroupKey, { register, unregister })
</script>

<template>
  <div class="qa-group">
    <div class="qa-group-header">
      <button type="button" class="qa-group-action" @click="setAll(true)">
        {{ t('qa.button.expandAll') }}
      </button>
      <button type="button" class="qa-group-action" @click="setAll(false)">
        {{ t('qa.button.collapseAll') }}
      </button>
    </div>
    <div class="qa-group-body">
      <slot />
    </div>
  </div>
</template>
