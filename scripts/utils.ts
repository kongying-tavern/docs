import fs from 'node:fs/promises'
import process from 'node:process'
import { URL } from 'node:url'
import { password } from '@/src/forum/api/gitee/index.ts'

const USERNAME = process.env.GITEE_USERNAME
const PASSWORD = process.env.GITEE_PASSWORD

export async function getAuthToken() {
  if (!USERNAME || !PASSWORD) {
    console.error('Missing username or password')
    return null
  }

  const [error, auth] = await password.getToken(USERNAME, PASSWORD)

  if (error) {
    console.error('Error getting token:', error)
    return null
  }

  return auth
}

export async function saveMemberDataWithTimestamp(filename: string, memberData: unknown) {
  const outputFilePath = new URL(`../src/data/${filename}.gen.json`, import.meta.url)
  const dataWithTimestamp = {
    data: memberData,
    lastUpdated: Date.now(),
  }

  await fs.writeFile(outputFilePath, JSON.stringify(dataWithTimestamp, null, 2), 'utf8')
  console.info(`Data successfully overwritten in ${outputFilePath.pathname}`)
}
