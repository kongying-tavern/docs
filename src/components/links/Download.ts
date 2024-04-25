import type { UrlParams } from '@vueuse/core'

export const clientMap: Record<string, unknown> = {
  sq: {
    id: 'sq',
    name: '加入社区',
    target: '_self',
    link: './community',
    icon: '/imgs/common/logo/logo_256.png',
  },
  bd: {
    id: 'bd',
    name: '百度网盘',
    target: '_blank',
    link: 'https://pan.baidu.com/s/1mrU_bkqcpcdjeKPUCzMNDQ?pwd=kyjg',
    icon: '/imgs/common/svg/baidu-drive.svg',
  },
  kk: {
    id: 'kk',
    name: '夸克网盘',
    target: '_blank',
    link: 'https://pan.quark.cn/s/fe8bb34c77bc',
    icon: '/imgs/common/svg/quark-drive.svg',
  },
  ty: {
    id: 'ty',
    name: '天翼云盘',
    secondary: '访问码：exn0',
    target: '_blank',
    link: 'https://cloud.189.cn/t/YF7Fj2zIRVbi',
    icon: '/imgs/common/svg/tianyi-drive.svg',
  },
  gd: {
    id: 'gd',
    name: 'Google Drive',
    target: '_blank',
    link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing',
    icon: 'i-logos-google-drive',
  },
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
