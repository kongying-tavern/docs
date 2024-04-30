import type { DefaultTheme } from 'vitepress'
import { socialList } from '../../theme/composables/socialList'

const socialLinks: DefaultTheme.SocialLink[] = [
  { icon: 'github', link: 'https://github.com/kongying-tavern' },
  {
    icon: {
      svg: socialList.reddit.icon,
    },
    link: 'https://www.reddit.com/user/Kongying_Tavern',
    ariaLabel: 'reddit',
  },
  { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
  { icon: 'x', link: 'https://twitter.com/KongyingTavern' },
]

export default socialLinks
