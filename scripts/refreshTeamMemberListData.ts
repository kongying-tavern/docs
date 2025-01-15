import { user } from '@/apis/forum/gitee'
import fs from 'node:fs/promises'
import { URL } from 'node:url'

export const refreshTeamMemberListData = async () => {
  const refreshTeamMemberID = async () =>
    (await user.getOrgMembers()).map((val) => Number(val.id))

  const outputFilePath = new URL(
    '../src/_data/teamMemberList.json',
    import.meta.url,
  )

  try {
    await fs.writeFile(
      outputFilePath,
      JSON.stringify(await refreshTeamMemberID(), null, 2),
      'utf8',
    )
    console.info(`Data successfully overwritten in ${outputFilePath.pathname}`)
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

refreshTeamMemberListData()
