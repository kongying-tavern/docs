import { blog } from '@/apis/forum/gitee'
import fs from 'node:fs/promises'
import teamMemberList from '~/_data/teamMemberList.json'
import { URL } from 'node:url'

import type ForumAPI from '@/apis/forum/api'

export const refreshBlogData = async () => {
  let page = 1
  let posts: ForumAPI.Topic[] = []

  const requestData = async (page: number) => {
    const { data, totalPage } = await blog.getPosts({
      pageSize: 50,
      current: page,
      sort: 'created',
    })

    if (data) {
      posts = [...posts, ...data]
      page++
    } else {
      console.info('No blog data')
    }

    return totalPage
  }

  const isTeamMember = async (id: string | number) => {
    return teamMemberList.findIndex((val) => val === id)
  }

  const totalPage = await requestData(page)

  if (totalPage + 1 === page) return posts

  const pool = <Function[]>[requestData]

  await Promise.all(pool.flatMap((item) => Array(totalPage - 1).fill(item)))

  posts
    .filter((val) => isTeamMember(val.user.id))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

  const outputFilePath = new URL('../src/_data/posts.json', import.meta.url)

  try {
    await fs.writeFile(outputFilePath, JSON.stringify(posts, null, 2), 'utf8')
    console.info(`Data successfully overwritten in ${outputFilePath.pathname}`)
  } catch (error) {
    console.error('Error saving data:', error)
  }

  return posts
}

refreshBlogData()
