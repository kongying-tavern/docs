import { GITEE_OWNER, GITEE_REPO, apiCall } from '.'
import { excludeStateTags } from './utils'

export const getAllLabels = async (
  useCache = true,
): Promise<GITEE.IssueLabel[]> => {
  return (
    await apiCall<GITEE.IssueLabel[]>(
      'get',
      `repos/${GITEE_OWNER}/${GITEE_REPO}/labels`,
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
