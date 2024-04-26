<template>
  <a
    :href="isLinkExternal(link) ? link : withBase(link)"
    :target="isLinkExternal(link) ? '_blank' : '_self'"
    :class="`card card-theme-${theme} ${hoverShadow ? 'card-hover' : ''}`"
    :title="title"
    :style="{
      ...(color ? { background: color } : null),
      ...(shadow ? { 'box-shadow': 'var(--vp-shadow-1)' } : null),
    }"
  >
    <div v-if="cover" class="card-cover-contanier">
      <img
        class="card-cover-img no-zoomable skeleton-animation"
        @load="
          (e) => {
            e.target!['classList'].remove('skeleton-animation')
          }
        "
        @error="
          (e) => {
            e.target!['classList'].add('load-error')
            e.target!['src'] = 'https://assets.yuanshen.site/images/noImage.png'
          }
        "
        :src="isRelativeLink(cover) ? withBase(cover) : cover"
      />
    </div>

    <div
      :class="`card-footer ${getLogoLink(logo) === 'no-logo' && !icon ? 'no-logo' : ''}`"
    >
      <template v-if="icon">
        <label :class="`card-icon ${icon}`"></label>
      </template>
      <template v-else>
        <template v-if="getLogoLink(logo) !== 'no-logo'">
          <img class="card-logo no-zoomable" :src="getLogoLink(logo)" />
        </template>
      </template>

      <div class="card-content">
        <div class="card-title">
          {{ title }}
        </div>
        <hr />
        <div class="card-desc">
          {{
            desc
              ? desc
              : isRelativeLink(link)
                ? `https://yuanshen.site/docs/${link.substring(0, 3).replace(/(\.\/|\/)/g, '') + link.substring(3)}`
                : link
          }}
        </div>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { isLinkExternal, isRelativeLink } from '../utils'
import { computed, defineProps, withDefaults } from 'vue'

import '../styles/card.scss'

interface CardProps {
  /**
   * Card title
   *
   * 卡片标题，必填项
   *
   */
  title: string

  /**
   * Card description
   *
   * 卡片描述，为空时默认显示为 link
   */
  desc?: string

  /**
   * Card icon
   *
   * 卡片图标，默认为项目 Logo
   */
  logo?: string

  /**
   * Card link
   *
   * 卡片链接
   */
  link?: string

  /**
   * Card color
   *
   * 卡片链颜色
   */
  color?: string

  /**
   * Card cover
   *
   * 卡片封面，Only NormalTheme
   */
  cover?: string

  /**
   * Card hover shadow
   *
   * 是否启用卡片 hover 时阴影效果，默认启用
   */
  hoverShadow?: boolean

  /**
   * Card shadow
   *
   * 是否启用卡片阴影效果，默认启用
   */
  shadow?: boolean

  /**
   * Card theme
   *
   * 卡片主题，默认 normal
   */
  theme?: 'normal' | 'medium'
}

const props = withDefaults(defineProps<CardProps>(), {
  desc: '',
  logo: '',
  color: '',
  link: '',
  cover: '',
  theme: 'normal',
  hoverShadow: true,
  shadow: true,
})

const iconMap = {
  'bilibili.com': 'i-custom-bilibili',
  'txc.qq.com': 'i-custom-txc',
  'support.qq.com': 'i-custom-txc',
  'youtube.com': 'i-logos-youtube-icon',
  'twitter.com': 'i-logos-twitter',
  'discord': 'i-logos-discord-icon',
  'reddit.com': 'i-logos-reddit-icon',
  'baidu.com': 'i-custom-baidu',
  'qq.com': 'i-custom-qq',
  'weixitianli.com': 'i-custom-wxtl',
}

const iconLink = computed(() => {
  let icon = ''

  if (props.logo === '' && props.link !== '') {
    const linkDomain = props.link.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)\//)
    if (linkDomain && linkDomain[1]) {
      const domain = linkDomain[1]
      for (const key in iconMap) {
        if (new RegExp(key).test(domain)) {
          icon = iconMap[key]
          break
        }
      }
    }
  }

  return icon
})

const getLogoLink = (i) => {
  if (
    i === 'self' ||
    props.link.includes('yuanshen.site') ||
    isRelativeLink(props.link)
  )
    return withBase('/imgs/common/logo/logo_128.png')
  if (i === '') return 'no-logo'
  return isRelativeLink(i) ? withBase(i) : i
}
</script>
