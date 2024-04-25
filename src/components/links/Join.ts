import type { UrlParams } from '@vueuse/core'

export const linkMap: Record<string, unknown> = {
  dd: {
    id: 'dd',
    link: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=-HGS3II1no-AEcWHYdrhsJCN2IfKQeji&authKey=qbjuuv5VygEdFUAZSCCr2kim3V0lYvLvRjJwM7nv8KplMKjVAO4m2FuDovmcx%2FJP&noverify=0&group_code=522563995 ',
  },
  kf: {
    id: 'kf',
    link: 'https://qm.qq.com/cgi-bin/qm/qr?k=wXbtoDmXCjlR8iJ-3lRwdNIOWio3quit&jump_from=webapi&authKey=aS/Be7vKSbcu/6zrmYVlpF6DsSnkHVMGT6Arn+RU+IiJf8ItKIFEXnVvfFmOL9We',
  },
}

export function linkJump(
  params: UrlParams,
  links: Record<string, unknown>[],
): void {
  const target = String(params.q).toLocaleLowerCase()

  links.forEach((val) => {
    if (val.id === target) {
      location.href = val.link as string
    }
  })
}
