<template>
  <a
    class="npm-badge"
    :href="badgeLink"
    :title="_package"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img :src="badgeImg" :alt="_package" />
  </a>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'

const props = defineProps({
  _package: {
    type: String,
    required: true,
  },
  distTag: {
    type: String,
    required: false,
    default: 'next',
  },
})

const badgeLink = computed(
  () => `https://www.npmjs.com/package/${props._package}`
)
const badgeLabel = computed(() => {
  if (props.distTag) {
    return `${props._package}@${props.distTag}`
  }

  return props._package
})
const badgeImg = computed(
  () =>
    `https://badgen.net/npm/v/${props._package}/${
      props.distTag
    }?label=${encodeURIComponent(badgeLabel.value)}`
)
</script>

<style scoped>
.npm-badge {
  margin-right: 0.5rem;
}
</style>
