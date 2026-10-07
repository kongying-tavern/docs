import { createBlogLoader } from '../utils/createBlogLoader.ts'

export declare const data: Awaited<ReturnType<typeof loader.load>>

export type { BlogPost } from '../utils/createBlogLoader.ts'

const source = createBlogLoader('*/blog/posts/*.md')

const loader = {
  watch: source.watch,
  async load() {
    const posts = await source.load()
    // Listing cards use pre-rendered excerpts, not the full update history.
    return posts.map(({ content: _content, ...post }) => post)
  },
}

export default loader
