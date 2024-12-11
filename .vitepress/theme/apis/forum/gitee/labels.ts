import { apiCall, GITEE_OWNER, GITEE_REPO } from '.'

export const getAllLabels = async (): Promise<GITEE.IssueLabel[]> => {
  return (
    await apiCall<GITEE.IssueLabel[]>(
      'get',
      `repos/${GITEE_OWNER}/${GITEE_REPO}/labels`,
    )
  ).json()
}

export const getAllLabelsName = async (): Promise<string[]> => {
  const data = await getAllLabels()
  return data.map((val) => val.name)
}
