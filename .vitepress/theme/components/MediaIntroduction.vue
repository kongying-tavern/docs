<script lang="ts" setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  media:
    | 'bilibili'
    | 'txc'
    | 'youtube'
    | 'twitter'
    | 'discord'
    | 'self'
    | 'reddit'
  text: String
  link: URL
}>()

const mediaID = computed(() => {
  switch (props.media) {
    case 'bilibili':
      // @ts-ignore
      return props.link.match(/(BV.*?).{10}/)[0]
    case 'youtube':
      return new URL(props.link).searchParams.get('v')
    case 'txc':
      return new URL(props.link).searchParams.get('id')
  }
})
</script>

<template>
  <a :href="link" :title="link" :target="media !== 'self' ? '_black' : '_self'">
    <span class="logo-wrapper">
      <label i-custom-bilibili v-if="media === 'bilibili'"></label>
      <label i-custom-txc v-if="media === 'txc'"></label>
      <label i-logos-youtube-icon v-if="media === 'youtube'"></label>
      <label i-logos-twitter v-if="media === 'twitter'"></label>
      <label i-logos-discord-icon v-if="media === 'discord'"></label>
      <label i-logos-reddit-icon v-if="media === 'reddit'"></label>
      <img h-10 w-10 v-if="media === 'self'" src="/imgs/logo_128.png" />
    </span>
    <span class="description">
      {{ text }}
      <span>
        {{ mediaID && `(${mediaID})` }}
      </span>
    </span>
  </a>
</template>

<style lang="scss" scoped>
a {
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  padding: 8px 16px 8px 8px;
  transition: color 0.5s, background-color 0.5s;
  display: flex;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 10px;
  transition: all 0.5s, box-shadow 0.25s ease, border-color 0.25s ease;
  text-decoration: none !important;

  &:hover {
    transform: translate3d(0, -4px, 0);
    box-shadow: var(--vp-shadow-1);
  }
}

.description {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-1);
  margin: 0 0 0 16px;
  transition: color 0.5s;
}

a:hover {
  text-decoration: none !important;
}

.description span {
  color: var(--vp-c-brand);
}

.logo-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
  display: flex;
  justify-content: center;
  align-items: center;

  label {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 576px) {
  .description {
    font-size: 12px;
    line-height: 18px;
  }

  .logo-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
  }
}
</style>
