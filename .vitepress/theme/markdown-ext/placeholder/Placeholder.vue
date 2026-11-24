<script setup lang="ts">
import './placeholder.css'

interface PlaceholderProps {
  inline?: boolean
  hint?: string
}

withDefaults(defineProps<PlaceholderProps>(), {
  inline: false,
  hint: '',
})
</script>

<template>
  <span v-if="inline" class="doc-placeholder doc-placeholder-inline"><slot>{{ hint }}</slot></span>
  <div v-else class="doc-placeholder doc-placeholder-block">
    <div class="doc-placeholder-hint">
      <slot>{{ hint }}</slot>
    </div>
  </div>
</template>
