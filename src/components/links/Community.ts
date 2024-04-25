import type { UrlParams } from '@vueuse/core'

export const serverMap: Record<string, unknown> = {
  discord: {
    id: 'discord',
    name: 'Discord',
    target: '_blank',
    link: 'https://discord.com/invite/aFe57AKZUF',
    secondary: 'aFe57AKZUF',
    icon: 'i-logos-discord-icon',
  },
  qq: {
    id: 'qq',
    name: 'QQ 频道',
    target: '_blank',
    secondary: 'f006fek0f',
    link: 'https://pd.qq.com/s/f006fek0f',
    icon: '/imgs/common/svg/qq-channel.svg',
  },
}

export function serverJump(
  params: UrlParams,
  server: Record<string, unknown>[],
): void {
  if (
    Number(params.q) <=
    document.querySelectorAll(
      '#VPContent > div > div > div.content > div > main > div > div > details:nth-child(6) > ol > li',
    ).length
  ) {
    const link = (
      document?.querySelector(
        `#VPContent > div > div > div.content > div > main > div > div > details:nth-child(6) > ol > li:nth-child(${Number(params.q)}) > a`,
      ) as HTMLAnchorElement
    ).href

    if (link.includes(location.host)) return
    location.href = link
  } else {
    const target = String(params.q).toLocaleLowerCase()

    server.forEach((val) => {
      if (val.id === target) {
        location.href = val.link as string
      }
    })
  }
}
