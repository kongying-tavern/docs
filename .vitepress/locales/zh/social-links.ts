import type { DefaultTheme } from 'vitepress'
import { socialList } from '../../theme/composables/socialList'

const socialLinks: DefaultTheme.SocialLink[] = [
  { icon: 'github', link: 'https://github.com/kongying-tavern/' },
  { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
  { icon: 'x', link: 'https://twitter.com/KongyingTavern' },
  {
    icon: {
      svg: socialList.bilibili.icon,
    },
    link: 'https://space.bilibili.com/518076785',
    ariaLabel: 'bilibili',
  },
]

export default socialLinks
