export namespace ForumAPI {
  export interface Auth {
    accessToken: string
    createdAt: number
    expiresIn: number
    refreshToken: string
    scope: string
    tokenType: string
  }

  export type AccessToken = string | null

  export interface User {
    id: string | number
    login: string
    username: string
    avatar?: string
    homepage?: string
    bio?: string
    email?: string
    createAt?: Date
    updateAt?: Date
  }

  export type TopicType = 'ANN' | 'BUG' | 'FEAT' | 'POST' | null

  export interface ImageInfo {
    src: string
    alt?: string
    title?: string
    thumbHash?: string
    width?: number
    height?: number
    [key: string]: unknown
  }

  export interface Content {
    text: string
    images?: ImageInfo[]
  }

  export interface Topic {
    id: string | number
    title: string
    content: ForumAPI.Content
    contentRaw: string
    link: string
    tags: TopicTags
    commentCount: number
    user: ForumAPI.User
    state: ForumAPI.TopicState
    type: ForumAPI.TopicType
    pinned?: boolean
    relatedComments?: Comment[] | null
    createdAt: string
    updatedAt: string
    language?: string
  }

  export type TopicTags = string[]

  export type TopicState = 'open' | 'closed' | 'progressing'

  export interface Comment {
    id: string | number
    content: ForumAPI.Content
    contentRaw: string
    author: ForumAPI.User
    createdAt: string
    updatedAt: string
    reactions?: ForumAPI.Reactions | null
    replyID?: string | number | null
    // replyCommets?: Omit<ForumAPI.Comment, replyCommets>
  }

  export interface Comments {
    total: number
    totalPage: number
    data: Array<ForumAPI.Comment>
  }

  export interface Reactions {
    like?: number
    unlike?: number
    heart?: number
  }

  export interface Query {
    current: number
    pageSize: number
    sort: string
    filter: string | string[] | null
    creator: string | null
  }

  export type SortMethod = 'created' | 'updated_at'

  type PaginatedResult<T> = PaginationParams & {
    data: T
  }

  interface PaginationParams {
    total: number
    totalPage: number
  }

  interface Image {
    state: boolean
    message: string
    data?: {
      id: string | number
      link: string
      fileSize: number
      originName: string
    }
  }

  interface CreateTopicOption {
    type: Exclude<ForumAPI.TopicType, null>
    title: string
    tags: string[]
    text: string
  }

  type Post = {
    author: ForumAPI.User
    path: string

  } & ForumAPI.Topic

  type Repo = 'Feedback' | 'Blog'

  type FilterBy = 'feat' | 'bug' | 'all' | 'closed'

}

export default ForumAPI
