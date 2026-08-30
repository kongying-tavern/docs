import type { RemovableRef } from '@vueuse/core'
import type { InjectionKey } from 'vue'
import type { FORUM } from './types'

export const emojiRegex = /\[([^[\]]*)\]/g
export const extractEmojiRegex = /<img\s[^>]*data-emoji="\[([^[\]][^/[\]]*\/[^[\]]+)\]"[^>]*>/g

export const FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY = 'FORUM-TOPIC-VIEW-MODE'
export const FORUM_TOPIC_VIEW_MODE_KEY = Symbol('FORUM-TOPIC-VIEW-MODE') as InjectionKey<RemovableRef<FORUM.TopicViewMode>>
