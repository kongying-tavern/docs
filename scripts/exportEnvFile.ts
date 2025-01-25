import fs from 'node:fs/promises'

export const exportEnvFile = async () => {
  const keys: string[] = [
    'BLOG_CHANGELOG_WINCLIENT_ZH_ID',
    'BLOG_CHANGELOG_WINCLIENT_EN_ID',
    'BLOG_CHANGELOG_WINCLIENT_JA_ID',
    'BLOG_CHANGELOG_WEB_ZH_ID',
    'BLOG_CHANGELOG_WEB_EN_ID',
    'BLOG_CHANGELOG_WEB_JA_ID',
  ]

  const envContent = keys
    .map((key) => `VITE_${key}=${process.env[key] ?? ''}`)
    .join('\n')
  const envFilePath = new URL('../src/.env.local', import.meta.url)

  try {
    await fs.writeFile(envFilePath, envContent, 'utf-8')
    console.info(`Env successfully overwritten in ${envFilePath.pathname}`)
    console.info(`Env file generated as:\n${envContent}`)
  } catch (error) {
    console.error('Error export env:', error)
  }
}

exportEnvFile()
