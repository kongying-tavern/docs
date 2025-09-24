import type ForumAPI from '@/apis/forum/api'
import { blog } from '@/apis/forum/gitee'
import blogMemberList from '~/_data/blogMemberList.json'
import teamMemberList from '~/_data/teamMemberList.json'
import { getAuthToken, saveJsonToFile } from './utils'

export async function refreshBlogData() {
  const auth = await getAuthToken()

  if (!auth) {
    console.warn('登录失败，将尝试以匿名方式刷新博客数据')
  }

  let posts: ForumAPI.Post[] = []
  let currentPage = 1
  let totalPage = 1

  const teamMemberIdList = teamMemberList.map(val => Number(val.id))
  const blogMemberIdList = blogMemberList.map(val => Number(val.id))

  const isGrantedMember = (id: string | number) => {
    return teamMemberIdList.includes(Number(id)) || blogMemberIdList.includes(Number(id))
  }

  do {
    const { data, totalPage: fetchedTotalPage } = await blog.getPosts(
      {
        pageSize: 50,
        current: currentPage,
        sort: 'created',
        filter: null,
        creator: null,
      },
      auth?.accessToken,
    )

    if (data)
      posts.push(...data)

    totalPage = fetchedTotalPage
    currentPage++
  } while (currentPage <= totalPage)

  posts = posts
    .filter(val => isGrantedMember(val.author.id))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  await saveJsonToFile('posts', posts)
}

refreshBlogData()
