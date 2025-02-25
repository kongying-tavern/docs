import fs from 'node:fs/promises'
import process from 'node:process'
import { URL } from 'node:url'

import { password, user } from '@/apis/forum/gitee'
import { GITEE_API_CONFIG } from '@/apis/forum/gitee/config'

const USERNAME = process.env.GITEE_USERNAME
const PASSWORD = process.env.GITEE_PASSWORD

export async function refreshMemberListData() {
  if (!USERNAME || !PASSWORD)
    return console.error('Missing username or password')

  const [error, auth] = await password.getToken(USERNAME, PASSWORD)

  if (error)
    console.error('Error getting token:', error)

  const refreshTeamMemberID = async () =>
    (await user.getOrgMembers(auth?.accessToken)).map(val => Number(val.id))

  const refreshRepositoryMemberID = async (
    repo:
      | typeof GITEE_API_CONFIG.FEEDBACK_REPO
      | typeof GITEE_API_CONFIG.BLOG_REPO,
  ) =>
    (await user.getRepoMembers(repo, auth?.accessToken)).map(val =>
      Number(val.id),
    )

  const generateFile = async (
    filename: string,
    getter: () => Promise<number[]>,
  ) => {
    const outputFilePath = new URL(
      `../src/_data/${filename}.json`,
      import.meta.url,
    )

    try {
      await fs.writeFile(
        outputFilePath,
        JSON.stringify(await getter(), null, 2),
        'utf8',
      )
      console.info(
        `Data successfully overwritten in ${outputFilePath.pathname}`,
      )
    }
    catch (error) {
      console.error('Error saving data:', error)
    }
  }

  await generateFile('teamMemberList', async () => await refreshTeamMemberID())
  await generateFile(
    'feedbackMemberList',
    async () => await refreshRepositoryMemberID(GITEE_API_CONFIG.FEEDBACK_REPO),
  )
  await generateFile(
    'blogMemberList',
    async () => await refreshRepositoryMemberID(GITEE_API_CONFIG.BLOG_REPO),
  )
}

refreshMemberListData()
