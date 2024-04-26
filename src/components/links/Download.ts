import type { UrlParams } from '@vueuse/core'

const clientMap: Record<string, Record<string, unknown>> = {
  sq: {
    id: 'sq',
    name: '',
    target: '_self',
    link: './community',
    icon: '/imgs/common/logo/logo_256.png',
  },
  bd: {
    id: 'bd',
    name: '',
    target: '_blank',
    link: 'https://pan.baidu.com/s/1mrU_bkqcpcdjeKPUCzMNDQ?pwd=kyjg',
    icon: '/imgs/common/svg/baidu-drive.svg',
  },
  kk: {
    id: 'kk',
    name: '',
    target: '_blank',
    link: 'https://pan.quark.cn/s/fe8bb34c77bc',
    icon: '/imgs/common/svg/quark-drive.svg',
  },
  ty: {
    id: 'ty',
    name: '',
    secondary: '',
    target: '_blank',
    link: 'https://cloud.189.cn/t/YF7Fj2zIRVbi',
    icon: '/imgs/common/svg/tianyi-drive.svg',
  },
  gd: {
    id: 'gd',
    name: '',
    target: '_blank',
    link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing',
    icon: 'i-logos-google-drive',
  },
}

export function clientLink(
  key: string,
  text: string,
  subText?: string,
): Record<string, unknown> {
  const link = clientMap[key]

  link.name = text
  link.secondary = subText

  return link
}

export function downloadJump(
  params: UrlParams,
  downloadMethod: Record<string, unknown>[],
): void {
  const target = String(params.q).toLocaleLowerCase()

  downloadMethod.forEach((val) => {
    if (val.id === target) {
      location.href = val.link as string
    }
  })
}
