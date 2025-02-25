import { apiCall } from '.'
import { GITEE_API_CONFIG } from './config'
import { filterWhitelistTags } from './utils'

export async function getAllLabels(
  useCache = true,
): Promise<GITEE.IssueLabel[]> {
  return (
    await apiCall<GITEE.IssueLabel[]>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/labels`,
      {
        useCache,
      },
    )
  )[0]
}

export async function getAllLabelsName(): Promise<string[]> {
  const data = await getAllLabels()
  return filterWhitelistTags(data)
}
