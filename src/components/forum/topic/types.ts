import type ForumAPI from '@/apis/forum/api'

export interface TopicContentProps {
  topic: ForumAPI.Topic | ForumAPI.Post
  viewMode?: 'full' | 'excerpt'
  showMedia?: boolean
  mediaGridSize?: number
}

export interface TopicImageGridProps {
  images: ForumAPI.ImageInfo[]
  maxImages?: number
  aspectRatio?: string
}

export interface TopicHeaderProps {
  topic: ForumAPI.Topic | ForumAPI.Post
  showMeta?: boolean
  showActions?: boolean
}

export interface TopicPageState {
  isLoading: boolean
  error: Error | null
  topic: ForumAPI.Topic | null
}

export type TopicViewMode = 'card' | 'compact' | 'detail'

export interface TopicInteractionState {
  isExpanded: boolean
  isBookmarked: boolean
  isFollowing: boolean
  reactionCounts: ForumAPI.Reactions
}
