import { createBlogLoader } from '../utils/createBlogLoader'

export type { BlogPost } from '../utils/createBlogLoader'

export default createBlogLoader('*/blog/posts/*.md')
