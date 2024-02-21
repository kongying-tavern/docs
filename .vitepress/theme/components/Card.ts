import { withBase } from 'vitepress'
import { isLinkExternal, isRelativeLink } from '../utils'
import { type FunctionalComponent, h } from 'vue'

import '../styles/card.scss'

export interface CardProps {
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

const Card: FunctionalComponent<CardProps> = ({
  title,
  desc = '',
  logo = '',
  color = '',
  link = '',
  cover = '',
  theme = 'normal',
  hoverShadow = true,
  shadow = true,
}) => {
  let icon = ''

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

  if (logo === '' && link !== '') {
    const linkDomain = link.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)\//)
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

  const _Cover = () => {
    return cover
      ? h('div', { class: 'card-cover-contanier' }, [
          h('img', {
            class: 'card-cover-img no-zoomable skeleton-animation',
            onLoad: (e) => {
              e.target!['classList'].remove('skeleton-animation')
            },
            onError: (e) => {
              e.target!['classList'].add('load-error')
              e.target!['src'] =
                'https://assets.yuanshen.site/images/noImage.png'
            },
            src: isRelativeLink(cover) ? withBase(cover) : cover,
          }),
        ])
      : ''
  }

  const logoLink = (i) => {
    if (i === 'self') return withBase('/imgs/logo_128.png')
    if (isRelativeLink(i) && !logo && !icon)
      return withBase('/imgs/logo_128.png')
    return isRelativeLink(i) ? withBase(i) : i
  }

  const children = [
    _Cover(),
    h('div', { class: 'card-footer' }, [
      icon === ''
        ? logo
          ? h('img', { class: 'card-logo no-zoomable', src: logoLink(logo) })
          : ''
        : h('label', { class: `card-icon ${icon}` }),
      h('div', { class: 'card-content' }, [
        h('div', { class: 'card-title', innerHTML: title }),
        h('hr'),
        h('div', {
          class: 'card-desc',
          innerHTML: desc
            ? desc
            : isRelativeLink(link)
              ? `https://yuanshen.site/docs/${link.substring(0, 3).replace(/(\.\/|\/)/g, '') + link.substring(3)}`
              : link,
        }),
      ]),
    ]),
  ]

  const props: Record<string, unknown> = {
    class: `card card-theme-${theme} ${hoverShadow ? 'card-hover' : ''}`,
    title: title,
  }

  if (color) props['style'] = { background: color }
  if (shadow) props['style'] = { 'box-shadow': 'var(--vp-shadow-1)' }

  return h(
    'a',
    {
      href: isLinkExternal(link) ? link : withBase(link),
      target: isLinkExternal(link) ? '_blank' : '_self',
      ...props,
    },
    children,
  )
}

Card.displayName = 'Card'

export default Card
