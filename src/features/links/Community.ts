const serverMap: Record<string, Record<string, unknown>> = {
  discord: {
    id: 'discord',
    name: '',
    target: '_blank',
    link: 'https://discord.com/invite/aFe57AKZUF',
    secondary: 'aFe57AKZUF',
    icon: 'i-logos-discord-icon',
  },
  qq: {
    id: 'qq',
    name: '',
    target: '_blank',
    secondary: 'f006fek0f',
    link: 'https://pd.qq.com/s/f006fek0f',
    icon: '/imgs/common/svg/qq-channel.svg',
  },
}

export function serverLink(key: string, text: string): Record<string, unknown> {
  const link = serverMap[key]

  link.name = text

  return link
}
