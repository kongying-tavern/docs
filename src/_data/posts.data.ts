import type { BlogPost } from '../utils/createBlogLoader'
import { createBlogLoader } from '../utils/createBlogLoader'

export declare const data: BlogPost[]

export type { BlogPost } from '../utils/createBlogLoader'

export default createBlogLoader('*/blog/posts/*.md')
