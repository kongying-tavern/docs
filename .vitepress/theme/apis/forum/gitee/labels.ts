import { apiCall } from '.'
import { GITEE_API_CONFIG } from './config'
import { excludeStateTags } from './utils'

export const getAllLabels = async (
  useCache = true,
): Promise<GITEE.IssueLabel[]> => {
  return (
    await apiCall<GITEE.IssueLabel[]>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/labels`,
      {
        useCache,
      },
    )
  )[0]
}

export const getAllLabelsName = async (): Promise<string[]> => {
  const data = await getAllLabels()
  return excludeStateTags(data)
}
