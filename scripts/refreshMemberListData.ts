import { user } from '@/src/forum/api/gitee'
import { GITEE_API_CONFIG } from '@/src/forum/api/gitee/gitee-config'
import { getAuthToken, saveMemberDataWithTimestamp } from './utils'

async function fetchMemberLists() {
  const auth = await getAuthToken()
  if (!auth)
    console.warn('登录失败，将尝试以匿名方式刷新成员列表数据')

  const accessToken = auth?.accessToken
  return Promise.all([
    user.getOrgMembers(accessToken),
    user.getRepoMembers(GITEE_API_CONFIG.FEEDBACK_REPO, accessToken),
    user.getRepoMembers(GITEE_API_CONFIG.BLOG_REPO, accessToken),
  ])
}

const members = await fetchMemberLists().catch((error: unknown) => {
  console.warn('无法从 Gitee 刷新成员数据，将使用现有快照', error)
  return undefined
})

if (members) {
  const [teamMembers, feedbackMembers, blogMembers] = members
  await Promise.all([
    saveMemberDataWithTimestamp('teamMemberList', teamMembers),
    saveMemberDataWithTimestamp('feedbackMemberList', feedbackMembers),
    saveMemberDataWithTimestamp('blogMemberList', blogMembers),
  ])
  console.info('所有成员列表数据已更新完成')
}
