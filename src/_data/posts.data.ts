import type { BlogPost } from '../utils/createBlogLoader'
import { createBlogLoader } from '../utils/createBlogLoader'

export type { BlogPost } from '../utils/createBlogLoader'
export declare const data: BlogPost[]

export default createBlogLoader('*/blog/posts/*.md')
