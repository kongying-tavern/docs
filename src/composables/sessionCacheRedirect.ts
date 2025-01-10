import { withBase } from 'vitepress'
import { useSharedTopicInfo } from './sharedTopicInfo'
import type ForumAPI from '@/apis/forum/api'

export const sessionCacheRedirect = (
  cacheData: ForumAPI.Topic,
  hash?: string | number,
) => {
  if (cacheData.type === 'ANN') return

  useSharedTopicInfo(cacheData)

  window.open(getRedirectUrlText(cacheData.id, hash), hash ? String(hash) : '')
}

export const getRedirectUrlText = (
  id: string | number,
  hash?: string | number,
  relativeLink = true,
) => {
  const rl = withBase(`./topic?number=${id}${hash ? `#${hash}` : ''}`)
  if (relativeLink) return rl
  return (
    location.protocol +
    '//' +
    location.host +
    location.pathname +
    rl.substring(1)
  )
}
