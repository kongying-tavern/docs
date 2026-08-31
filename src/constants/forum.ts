import type ForumAPI from '@/apis/forum/api'
import { getSiteHref } from '~/constants/site'

export const fallbackUser = {
  id: 'kongying Tavern',
  username: 'KYJGYSDT',
  avatar: getSiteHref('/imgs/common/logo/logo_256.png'),
} as ForumAPI.User
