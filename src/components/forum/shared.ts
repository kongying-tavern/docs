import type ForumAPI from '@/apis/forum/api'
import type { RemovableRef } from '@vueuse/core'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { FORUM } from './types'

export const emojiRegex = /\[([^[\]]*)\]/g
export const extractEmojiRegex = /<img\s[^>]*data-emoji="\[([^[\]][^/[\]]*\/[^[\]]+)\]"[^>]*>/g

export const FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY = 'FORUM-TOPIC-VIEW-MODE'
export const FORUM_TOPIC_VIEW_MODE_KEY = Symbol('FORUM-TOPIC-VIEW-MODE') as InjectionKey<RemovableRef<FORUM.TopicViewMode>>
export const FORUM_TOPIC_SORT_KEY = Symbol('FORUM-TOPIC-SORT') as InjectionKey<Ref<ForumAPI.SortMethod>>
export const FORUM_TOPIC_FILTER_KEY = Symbol('FORUM-TOPIC-FILTER') as InjectionKey<Ref<ForumAPI.FilterBy>>
export const FORUM_TOPIC_LOADING_KEY = Symbol('FORUM-TOPIC-LOADING') as InjectionKey<Ref<boolean>>
export const FORUM_TOPIC_CAN_LOAD_MORE = Symbol('FORUM-TOPIC-CAN-LOAD-MORE') as InjectionKey<ComputedRef<boolean>>
