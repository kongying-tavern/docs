import fs from 'node:fs/promises'
import process from 'node:process'

export async function exportEnvFile() {
  const keyUrlMap: Record<string, string> = {
    BLOG_CHANGELOG_WINCLIENT_JA_ID: '/ja/blog/hotupdatelog-client',
    BLOG_CHANGELOG_WINCLIENT_EN_ID: '/en/blog/hotupdatelog-client',
    BLOG_CHANGELOG_WINCLIENT_ZH_ID: '/blog/hotupdatelog-client',
    BLOG_CHANGELOG_WEB_JA_ID: '/ja/blog/changelog-web',
    BLOG_CHANGELOG_WEB_EN_ID: '/en/blog/changelog-web',
    BLOG_CHANGELOG_WEB_ZH_ID: '/blog/changelog-web',
  }

  // Build JSON file
  const jsonContent = Object.fromEntries(
    Object.entries(keyUrlMap).map(([key, value]) => [process.env[key], value]),
  )
  const jsonFilePath = new URL(
    '../src/_data/blogRewrites.json',
    import.meta.url,
  )

  try {
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonContent), 'utf-8')
    console.info(
      `Env JSON successfully overwritten in ${jsonFilePath.pathname}`,
    )
    console.info(
      `Env JSON generated as:\n${JSON.stringify(jsonContent, null, 2)}`,
    )
  }
  catch (error) {
    console.error('Error export env JSON:', error)
  }

  // Build `.env` file
  const envContent = Object.keys(keyUrlMap)
    .map(key => `VITE_${key}=${process.env[key] ?? ''}`)
    .join('\n')
  const envFilePath = new URL('../src/.env.local', import.meta.url)

  try {
    await fs.writeFile(envFilePath, envContent, 'utf-8')
    console.info(`Env successfully overwritten in ${envFilePath.pathname}`)
    console.info(`Env file generated as:\n${envContent}`)
  }
  catch (error) {
    console.error('Error export env file:', error)
  }
}

exportEnvFile()
