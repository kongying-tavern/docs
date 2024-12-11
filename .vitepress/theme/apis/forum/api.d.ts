export namespace ForumAPI {
  export type Auth = {
    accessToken: string
    createdAt: number
    expiresIn: number
    refreshToken: string
    scope: string
    tokenType: string
  }

  export type AccessToken = string | null

  export type User = {
    id: string | number
    login: string
    username: string
    avatar?: string
    homepage?: string
  }

  export type TopicType = 'ANN' | 'SUG' | 'BUG' | 'FEAT' | null

  export interface ImageInfo {
    src: string
    alt?: string
    title?: string
  }

  export type Content = {
    text: string
    images?: ImageInfo[]
  }

  export type Topic = {
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
    importantComments?: Comment[] | null
    createdAt: string
    updatedAt: string
  }

  export type TopicTags = string[]

  export type TopicState = 'open' | 'closed' | 'progressing'

  export type Comment = {
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

  export type Comments = {
    total: number
    totalPage: number
    data: Array<ForumAPI.Comment>
  }

  export type Reactions = {
    like?: number
    unlike?: number
    heart?: number
  }

  export type Query = {
    current: number
    pageSize: number
    sort: string
  }

  type PaginationParams<T> = {
    data: T
    total: number
    totalPage: number
  }
}

export default ForumAPI
