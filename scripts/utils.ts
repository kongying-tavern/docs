import fs from 'node:fs/promises'
import process from 'node:process'
import { URL } from 'node:url'
import { password } from '@/apis/forum/gitee'

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

export async function saveJsonToFile(filename: string, data: unknown) {
  const outputFilePath = new URL(`../src/_data/${filename}.json`, import.meta.url)

  try {
    await fs.writeFile(outputFilePath, JSON.stringify(data, null, 2), 'utf8')
    console.info(`Data successfully overwritten in ${outputFilePath.pathname}`)
  }
  catch (error) {
    console.error('Error saving data:', error)
  }
}
