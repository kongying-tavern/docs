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
  <span v-if="inline" class="doc-placeholder doc-placeholder-inline">{{ hint }}</span>
  <div v-else class="doc-placeholder doc-placeholder-block">
    <p class="doc-placeholder-hint">
      {{ hint }}
    </p>
  </div>
</template>
