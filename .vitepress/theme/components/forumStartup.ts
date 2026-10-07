import type { InjectionKey, Ref } from 'vue'

export const forumStartupKey: InjectionKey<Ref<boolean>> = Symbol('forum-startup')
