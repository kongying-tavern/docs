<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, resolveComponent } from 'vue'
import { Button } from '@/components/ui/button'

const { frontmatter } = useData()

const hasButton = computed(() => {
  const buttonConfig = frontmatter.value.button
  if (!buttonConfig)
    return false

  if (buttonConfig.component)
    return true

  if (!buttonConfig.text)
    return false

  return true
})

const buttonComponent = computed(() => {
  if (frontmatter.value.button?.component) {
    try {
      return resolveComponent(frontmatter.value.button.component)
    }
    catch {
      return null
    }
  }
  return null
})

function handleButtonClick() {
  if (frontmatter.value.button?.link) {
    window.location.href = frontmatter.value.button.link
  }
}
</script>

<template>
  <div class="slide-enter Headline">
    <div
      class="pb-6 border-b-[var(--vp-c-divider)] border-b-1px border-b-solid"
    >
      <div class="headline-ader fl-bex items-start justify-between">
        <div class="headline-content">
          <h1
            class="title text-3xl tracking-tight font-bold lg:text-5xl sm:text-4xl"
          >
            {{ frontmatter.title }}
          </h1>
          <p class="lead text-lg mt-4">
            {{ frontmatter.subtext }}
          </p>
          <p v-if="frontmatter.action" class="action">
            <VPLink :href="frontmatter.action.link">
              {{ frontmatter.action.text }}
            </VPLink>
          </p>
        </div>
        <div v-if="hasButton" class="headline-actions">
          <component :is="buttonComponent" v-if="buttonComponent" />
          <Button
            v-else-if="frontmatter.button.text"
            :variant="frontmatter.button.variant || 'default'"
            :size="frontmatter.button.size || 'default'"
            @click="handleButtonClick"
          >
            <span
              v-if="frontmatter.button.icon"
              :class="frontmatter.button.icon"
            />
            {{ frontmatter.button.text }}
          </Button>
        </div>
      </div>
    </div>
    <Content class="Headline" />
  </div>
</template>

<style scoped>
.Headline {
  margin-bottom: 96px;
  max-width: 1152px;
  margin: auto;
}

@media (min-width: 768px) {
  .Headline {
    margin-bottom: 48px;
    padding: 64px 32px 32px;
  }
}

.Headline {
  padding: 48px 24px 24px;
}

.title,
.lead {
  transition: color 0.25s;
}

.lead {
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.action {
  padding-top: 4px;
}

.action :deep(a) {
  display: inline-block;
  line-height: calc(20px * var(--site-ui-scale));
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 500;
  color: var(--vp-c-brand);
  transition: color 0.25s;
}

.action :deep(a:hover) {
  color: var(--vp-c-brand-dark);
}

.headline-header {
  gap: 1rem;
  align-items: center;
}

.headline-content {
  flex: 1;
  min-width: 0;
}

.headline-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .headline-header {
    flex-direction: column;
    gap: 1.5rem;
  }

  .headline-actions {
    align-self: center;
    justify-content: center;
  }
}
</style>
