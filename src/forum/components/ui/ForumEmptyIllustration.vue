<script setup lang="ts">
import { useSitePreferences } from '~/composables/useSitePreferences'

withDefaults(defineProps<{
  variant?: 'feedback' | 'search' | 'filtered' | 'error' | 'rate-limit' | 'locked' | 'comment'
  busy?: boolean
  compact?: boolean
}>(), { variant: 'feedback' })

const { reducedMotion } = useSitePreferences()
</script>

<template>
  <svg
    class="forum-empty-illustration"
    :class="{ 'is-busy': busy, 'is-reduced': reducedMotion, 'is-compact': compact }"
    :data-variant="variant"
    viewBox="0 0 160 112"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path class="illustration-secondary" d="M26 97h108" />

    <template v-if="variant === 'comment'">
      <g class="illustration-secondary">
        <path class="illustration-surface" d="M83 33h38a8 8 0 0 1 8 8v25a8 8 0 0 1-8 8h-5v11l-13-11H83a8 8 0 0 1-8-8V41a8 8 0 0 1 8-8Z" />
        <path d="M91 48h22M91 58h14" />
      </g>
      <g class="illustration-main">
        <path class="illustration-surface" d="M39 23h54a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H60L44 84V71h-5a8 8 0 0 1-8-8V31a8 8 0 0 1 8-8Z" />
        <path class="illustration-accent illustration-writing" d="M47 41h35M47 52h23" />
      </g>
    </template>

    <template v-else>
      <!-- 保留卡片层叠的原有构图，正文密度与前景符号共同区分状态。 -->
      <g class="illustration-secondary">
        <rect class="illustration-surface" x="42" y="20" width="72" height="60" rx="8" transform="rotate(7 78 50)" />
      </g>
      <g class="illustration-main">
        <rect class="illustration-surface" x="31" y="28" width="80" height="60" rx="8" />
        <path class="illustration-secondary" d="M31 44h80" />
        <path class="illustration-accent" d="M43 36h12" />
        <template v-if="variant === 'filtered'">
          <path d="M44 57h26M44 69h17" />
          <path class="illustration-secondary" stroke-dasharray="2 4" d="M76 57h15M67 69h19" />
        </template>
        <template v-else-if="variant === 'search'">
          <path d="M44 57h36" />
          <path class="illustration-secondary" stroke-dasharray="2 4" d="M44 69h27" />
        </template>
        <template v-else-if="variant === 'error'">
          <path d="M44 57h18m7 0h17" />
          <path class="illustration-secondary" d="M44 69h23" />
        </template>
        <template v-else>
          <path d="M44 57h40" />
          <path class="illustration-secondary" d="M44 69h26" />
        </template>
      </g>

      <g v-if="variant === 'search'" class="illustration-accent illustration-lens">
        <circle class="illustration-surface" cx="111" cy="66" r="17" />
        <path d="m124 79 13 13" />
        <path class="illustration-secondary" d="M104 61a8 8 0 0 1 7-3" />
      </g>
      <g v-else-if="variant === 'filtered'" class="illustration-accent illustration-filter">
        <path class="illustration-surface" d="M92 57h38l-13 17v14l-12 7V74L92 57Z" />
        <path class="illustration-secondary" d="M102 57h18" />
      </g>
      <g v-else-if="variant === 'error'" class="illustration-accent">
        <circle class="illustration-surface" cx="113" cy="76" r="20" />
        <g class="illustration-retry-arrow">
          <path d="M123 75a10 10 0 0 0-17-6l-3 3m0-7v7h7M103 77a10 10 0 0 0 17 6l3-3m0 7v-7h-7" />
        </g>
      </g>
      <g v-else-if="variant === 'rate-limit'" class="illustration-accent">
        <circle class="illustration-surface" cx="113" cy="76" r="20" />
        <path class="illustration-clock-hand" d="M113 64v12l8 5" />
        <path class="illustration-secondary" d="M113 59v2m17 15h-2m-15 17v-2m-17-15h2" />
      </g>
      <g v-else-if="variant === 'locked'" class="illustration-accent">
        <path class="illustration-lock-shackle" d="M102 66V56a10 10 0 0 1 20 0v10" />
        <rect class="illustration-surface" x="94" y="66" width="36" height="28" rx="7" />
        <path d="M112 78v5" />
      </g>
      <g v-else class="illustration-accent illustration-create">
        <path class="illustration-surface" d="M95 57h32a7 7 0 0 1 7 7v20a7 7 0 0 1-7 7h-16l-12 9v-9h-4a7 7 0 0 1-7-7V64a7 7 0 0 1 7-7Z" />
        <path d="M111 67v14m-7-7h14" />
      </g>
    </template>
  </svg>
</template>

<style scoped>
.forum-empty-illustration {
  --empty-active: 0;

  display: block;
  width: 160px;
  height: 112px;
  max-width: 100%;
  overflow: visible;
  color: var(--vp-c-text-3);
}

.is-compact {
  width: 120px;
  height: 84px;
}

.illustration-surface {
  fill: var(--vp-c-bg);
}

.illustration-secondary {
  stroke: color-mix(in srgb, var(--vp-c-text-3) 40%, var(--vp-c-bg));
}

.illustration-accent {
  color: var(--vp-c-brand-1);
}

svg g,
svg path {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 240ms cubic-bezier(0.2, 0, 0, 1);
}

.illustration-main {
  transform: translateY(calc(-2px * var(--empty-active)));
}

.illustration-create,
.illustration-filter {
  transform: translateY(calc(-3px * var(--empty-active)));
}

.illustration-lock-shackle {
  transform: translateY(calc(-3px * var(--empty-active)));
}

.illustration-lens {
  transform: translate(calc(-3px * var(--empty-active)), calc(-2px * var(--empty-active)));
}

.illustration-writing {
  transform: translateX(calc(3px * var(--empty-active)));
}

.illustration-clock-hand {
  transform-box: view-box;
  transform-origin: 113px 76px;
  transform: rotate(calc(20deg * var(--empty-active)));
}

.illustration-retry-arrow {
  transform: rotate(calc(45deg * var(--empty-active)));
}

:global(.forum-empty-state:focus-within .forum-empty-illustration),
:global(.forum-comment-surface:focus-within .forum-empty-illustration) {
  --empty-active: 1;
}

@media (hover: hover) and (pointer: fine) {
  :global(.forum-empty-state:hover .forum-empty-illustration) {
    --empty-active: 1;
  }
}

.is-busy .illustration-retry-arrow {
  animation: illustration-reconnect 900ms linear infinite;
}

@keyframes illustration-reconnect {
  to {
    transform: rotate(360deg);
  }
}

/* 同时尊重站内减动效设置和系统偏好。 */
.is-reduced {
  --empty-active: 0 !important;
}

.is-reduced g,
.is-reduced path {
  animation: none !important;
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .forum-empty-illustration {
    --empty-active: 0 !important;
  }

  .forum-empty-illustration g,
  .forum-empty-illustration path {
    animation: none !important;
    transition: none !important;
  }
}
</style>
