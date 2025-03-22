<script setup lang="ts">
const props = defineProps<{
  mention: string
}>()
</script>

<template>
  <div>
    <p>
      @ {{ props.mention }}
    </p>
  </div>
</template>
