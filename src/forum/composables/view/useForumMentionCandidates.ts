import type ForumAPI from '@/src/forum/api/types.d.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import feedbackMembers from '@/src/data/feedbackMemberList.gen.json'
import teamMembers from '@/src/data/teamMemberList.gen.json'
import { collectMentionUsers } from '@/src/forum/services/commentComposer.ts'

export function useForumMentionCandidates(getParticipants: () => readonly ForumAPI.User[] = () => []) {
  const recent = useLocalStorage<ForumAPI.User[]>('RECENT_MENTION', [])
  watchEffect(() => {
    if (!Array.isArray(recent.value))
      recent.value = []
  })
  const users = computed(() => collectMentionUsers(getParticipants(), recent.value, feedbackMembers.data, teamMembers.data))
  const groups = computed(() => {
    const participants = collectMentionUsers(getParticipants())
    const combined = collectMentionUsers(participants, recent.value)
    return {
      participants,
      recent: combined.slice(participants.length),
      team: users.value.slice(combined.length),
    }
  })
  function remember(user: ForumAPI.User): void {
    recent.value = collectMentionUsers([user], recent.value).slice(0, 4)
  }
  return { users, groups, recent, remember }
}
