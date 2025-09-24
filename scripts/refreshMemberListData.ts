import { user } from '@/apis/forum/gitee'
import { GITEE_API_CONFIG } from '@/apis/forum/gitee/config'
import { getAuthToken, saveMemberDataWithTimestamp } from './utils'

export async function refreshMemberListData() {
  const auth = await getAuthToken()

  if (!auth) {
    console.warn('登录失败，将尝试以匿名方式刷新成员列表数据')
  }

  const refreshTeamMemberID = async () => await user.getOrgMembers(auth?.accessToken)
  const refreshRepositoryMemberID = async (
    repo: typeof GITEE_API_CONFIG.FEEDBACK_REPO | typeof GITEE_API_CONFIG.BLOG_REPO,
  ) => await user.getRepoMembers(repo, auth?.accessToken)

  try {
    const [teamMembers, feedbackMembers, blogMembers] = await Promise.all([
      refreshTeamMemberID(),
      refreshRepositoryMemberID(GITEE_API_CONFIG.FEEDBACK_REPO),
      refreshRepositoryMemberID(GITEE_API_CONFIG.BLOG_REPO),
    ])

    await Promise.all([
      saveMemberDataWithTimestamp('teamMemberList', teamMembers),
      saveMemberDataWithTimestamp('feedbackMemberList', feedbackMembers),
      saveMemberDataWithTimestamp('blogMemberList', blogMembers),
    ])

    console.info('所有成员列表数据已更新完成')
  }
  catch (error) {
    console.error('刷新成员数据时出错:', error)
  }
}

refreshMemberListData()
