import { parseLatestUpdateEntry } from '../forum/services/blogUpdateFeed'
import { createBlogLoader } from '../utils/createBlogLoader'

const source = createBlogLoader('*/blog/posts/*.md')

export declare const data: Awaited<ReturnType<typeof loader.load>>

// 论坛边栏只消费更新时间、作者与最新一条摘要，不发送整篇博客正文。
const loader = {
  watch: source.watch,
  async load() {
    return (await source.load()).map(post => ({
      title: post.title,
      url: post.url,
      date: post.date,
      lang: post.lang,
      authors: post.authors.map(({ username, login }) => ({ username, login })),
      gitInfo: post.gitInfo ? { lastModified: { date: post.gitInfo.lastModified.date } } : undefined,
      latestUpdate: parseLatestUpdateEntry(post.content),
    }))
  },
}

export default loader
