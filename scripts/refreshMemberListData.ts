import { user } from '@/apis/forum/gitee'
import { GITEE_API_CONFIG } from '@/apis/forum/gitee/config'
import { getAuthToken, saveJsonToFile } from './utils'

export async function refreshMemberListData() {
  const auth = await getAuthToken()

  if (!auth)
    return

  const refreshTeamMemberID = async () => await user.getOrgMembers(auth?.accessToken)
  const refreshRepositoryMemberID = async (
    repo: typeof GITEE_API_CONFIG.FEEDBACK_REPO | typeof GITEE_API_CONFIG.BLOG_REPO,
  ) => await user.getRepoMembers(repo, auth?.accessToken)

  await saveJsonToFile('teamMemberList', await refreshTeamMemberID())
  await saveJsonToFile('feedbackMemberList', await refreshRepositoryMemberID(GITEE_API_CONFIG.FEEDBACK_REPO))
  await saveJsonToFile('blogMemberList', await refreshRepositoryMemberID(GITEE_API_CONFIG.BLOG_REPO))
}

refreshMemberListData()
