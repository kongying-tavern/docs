import { useUrlSearchParams } from '@vueuse/core'
import { onMounted } from 'vue'

const joinLinks: Record<string, string> = {
  dd: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=-HGS3II1no-AEcWHYdrhsJCN2IfKQeji&authKey=qbjuuv5VygEdFUAZSCCr2kim3V0lYvLvRjJwM7nv8KplMKjVAO4m2FuDovmcx%2FJP&noverify=0&group_code=522563995 ',
  kf: 'https://qm.qq.com/cgi-bin/qm/qr?k=wXbtoDmXCjlR8iJ-3lRwdNIOWio3quit&jump_from=webapi&authKey=aS/Be7vKSbcu/6zrmYVlpF6DsSnkHVMGT6Arn+RU+IiJf8ItKIFEXnVvfFmOL9We',
}

export function useJoinRedirect(): void {
  const params = useUrlSearchParams('history')

  onMounted(() => {
    const target = String(params.q).toLocaleLowerCase()
    if (Object.hasOwn(joinLinks, target))
      location.href = joinLinks[target]
  })
}
