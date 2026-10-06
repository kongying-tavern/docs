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
    blog?: string
    weibo?: string
    email?: string
    createAt?: Date
    updateAt?: Date
  }

  export interface UserProfileUpdate {
    username?: string
    blog?: string
    weibo?: string
    bio?: string
  }

  export type FeedbackTopicType = 'ANN' | 'BUG' | 'FEAT'
  export type TopicKind = FeedbackTopicType | 'POST'
  export type TopicType = TopicKind | null
  export type TopicStatus
    = | 'roadmap'
      | 'rfc'
      | 'not-planned'
      | 'wontfix'
      | 'fixed'
      | 'not-reproducible'
      | 'confirmed'
      | 'needs-triage'
      | 'blocked'
      | 'needs-more-info'
      | 'stale'
      | 'duplicate'
      | 'invalid'
  export type TopicDisplayStatus = TopicStatus | 'closed'

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

  export interface QuotedTopicReference {
    id: string
    type: FeedbackTopicType
  }

  export interface ForumItemBase {
    id: string
    title: string
    content: ForumAPI.Content
    contentRaw: string
    link: string
    labels: string[]
    tags: TopicTags
    status?: TopicStatus
    goodIssue: boolean
    commentCount: number
    user: ForumAPI.User
    state: ForumAPI.TopicState
    pinned?: boolean
    relatedComments?: Comment[] | null
    createdAt: string
    updatedAt: string
    closedAt?: string
    language?: string
    quotedTopic?: QuotedTopicReference
  }

  export interface Topic extends ForumItemBase {
    isPrivate?: boolean
    type: FeedbackTopicType
    /** 服务端内部标识，供关联评论匹配；路由仍使用公开话题编号。 */
    providerId?: number
  }

  export interface Post extends ForumItemBase {
    type: 'POST'
    author: ForumAPI.User
    path: string
  }

  export type TopicTags = string[]

  export type TopicState = 'open' | 'closed' | 'progressing'

  /** 时间线只承载状态语义：创建锚点、状态标签变更、状态流转 */
  export type TopicTimelineEventKind = 'created' | 'status' | 'state'

  export interface TopicTimelineEvent {
    id: string
    kind: TopicTimelineEventKind
    /** 事件发生时间，保持 provider 原始时间串 */
    at: string
    actor?: ForumAPI.User
    /** kind = 'status'：变更前状态；缺失表示此前无状态 */
    from?: TopicStatus
    /** kind = 'status'：变更后状态；缺失表示状态被清除 */
    to?: TopicStatus
    /** kind = 'state'：已识别的目标状态 */
    state?: TopicState
    /** kind = 'state'：无法识别时的原始状态名（如企业自定义状态） */
    stateLabel?: string
  }

  export interface Comment {
    id: string | number
    content: ForumAPI.Content
    contentRaw: string
    author: ForumAPI.User
    createdAt: string
    updatedAt: string
    reactions?: ForumAPI.Reactions | null
    replyID?: string | number | null
    tags?: string[] // Tags extracted from rich text data
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

  export type SortMethod = 'created' | 'updated'

  export type FilterBy = 'feat' | 'bug' | 'all' | 'closed' | 'archived' | 'everything'

  export interface ApiError extends Error {
    status?: number
    statusText?: string
    data?: unknown
  }

  /** 响应可能缺失分页头，故分页字段可选；消费方以 `?? 0` 兜底 */
  export type PaginatedResult<T> = Partial<PaginationParams> & {
    data: T
  }

  export interface PaginationParams {
    total: number
    totalPage: number
  }

  export interface Image {
    state: boolean
    message: string
    data?: {
      id: string | number
      link: string
      fileSize: number
      originName: string
    }
  }

  export interface CreateTopicOption {
    type: ForumAPI.FeedbackTopicType
    title: string
    tags: string[]
    text: string
    quotedTopic?: ForumAPI.QuotedTopicReference
    isPrivate?: boolean
  }

  export interface FormSubmitData {
    body: string
    title: string
    labels?: string
    security_hole?: boolean
  }

  export type Repo = 'Feedback' | 'Blog'

}

export default ForumAPI
