import path from 'path'
import { writeFileSync } from 'fs'
import { Feed } from 'feed'
import { createContentLoader, type SiteConfig } from 'vitepress'

const baseURL = 'https://yuanshen.site/'
export async function genFeed(config: SiteConfig) {
  const feed = new Feed({
    title: 'Genshin Interactive Map',
    description:
      'A Genshin interactive map by Kongying Tavern for completionists',
    id: baseURL,
    link: baseURL,
    language: 'en',
    image: baseURL + '/imgs/cover.jpg',
    favicon: baseURL + 'imgs/logo_128.png',
    copyright: 'Made by Kongying Tavern Team',
  })

  const posts = await createContentLoader('posts/*.md', {
    excerpt: true,
    render: true,
  }).load()

  posts.sort(
    (a, b) =>
      +new Date(b.frontmatter.date as string) -
      +new Date(a.frontmatter.date as string)
  )

  for (const { url, excerpt, frontmatter, html } of posts) {
    feed.addItem({
      title: frontmatter.title,
      id: `${baseURL}${url}`,
      link: `${baseURL}${url}`,
      description: excerpt,
      content: html,
      author: [
        {
          name: frontmatter.author || 'Kongying Tavern',
          link: frontmatter.web ? frontmatter.web : undefined,
        },
      ],
      date: frontmatter.date,
    })
  }

  writeFileSync(path.join(config.outDir, 'feed.rss'), feed.rss2())
}
