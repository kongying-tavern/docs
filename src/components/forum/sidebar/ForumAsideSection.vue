<script setup lang="ts">
withDefaults(defineProps<{
  /** 稳定的标识：用于生成标题 id 与 aria-labelledby */
  sectionId: string
  title: string
  /** 软底卡片外观（如「加入社区」） */
  card?: boolean
}>(), {
  card: false,
})
</script>

<template>
  <section
    class="aside-section"
    :class="{ 'aside-section-card': card }"
    :aria-labelledby="`aside-${sectionId}-title`"
  >
    <header class="aside-section-header">
      <h2 :id="`aside-${sectionId}-title`">
        {{ title }}
      </h2>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>
