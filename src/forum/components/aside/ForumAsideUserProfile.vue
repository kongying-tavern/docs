<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserProfile } from '../user/composables/useUserProfile'
import ForumAsideSection from './ForumAsideSection.vue'

const props = defineProps<{
  username: string
}>()

const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.userProfile)

const { renderedUser, role } = useUserProfile(() => props.username)

interface ProfileRow {
  label: string
  icon: string
  value: string
  /** 跳转到 Gitee 主页的链接，仅 login 一行有 */
  href?: string
}

// 资料行的 label 以图标担当，文案只作 tooltip/无障碍补充
const profileRows = computed<ProfileRow[]>(() => {
  const user = renderedUser.value
  if (!user)
    return []

  const rows: ProfileRow[] = [
    { label: copy.value.userId, icon: 'i-lucide-hash', value: String(user.id) },
  ]
  if (user.createAt) {
    rows.push({
      label: copy.value.joinDate,
      icon: 'i-lucide-calendar-days',
      value: user.createAt.toLocaleDateString(),
    })
  }
  if (user.login) {
    rows.push({
      label: copy.value.loginLabel,
      icon: 'i-lucide-at-sign',
      value: user.login,
      href: `https://gitee.com/${user.login}`,
    })
  }
  return rows
})
</script>

<template>
  <div class="user-profile-sections">
    <ForumAsideSection
      v-if="role === 'official'"
      section-id="user-verification"
      :title="copy.verification"
      card
    >
      <div class="user-verification">
        <i class="i-lucide-badge-check user-verification-icon" aria-hidden="true" />
        <p class="user-verification-desc">
          {{ copy.verifiedMember }}
        </p>
      </div>
    </ForumAsideSection>

    <ForumAsideSection
      v-if="renderedUser"
      section-id="user-profile"
      :title="copy.profile"
      card
    >
      <ul class="user-profile-rows">
        <li v-for="row in profileRows" :key="row.label" class="user-profile-row" :title="row.label">
          <i :class="row.icon" class="user-profile-icon" aria-hidden="true" />
          <a
            v-if="row.href"
            :href="row.href"
            target="_blank"
            rel="noopener noreferrer"
            class="user-profile-value no-icon"
          >
            {{ row.value }}
          </a>
          <span v-else class="user-profile-value">{{ row.value }}</span>
        </li>
      </ul>
    </ForumAsideSection>
  </div>
</template>

<style scoped>
.user-profile-sections {
  display: grid;
  gap: 28px;
}

.user-verification {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-verification-icon {
  flex: 0 0 auto;
  color: var(--vp-c-brand-1);
  @apply text-ui-16;
  line-height: 1;
}

.user-verification-desc {
  margin: 0;
  color: var(--vp-c-text-1);
  @apply text-ui-13;
  @apply leading-ui-19;
}

.user-profile-rows {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.user-profile-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.user-profile-icon {
  flex: 0 0 auto;
  color: var(--vp-c-text-3);
  @apply text-ui-15;
  line-height: 1;
}

.user-profile-value {
  overflow: hidden;
  color: var(--vp-c-text-1);
  @apply text-ui-13;
  @apply leading-ui-19;
  text-overflow: ellipsis;
  white-space: nowrap;
}

a.user-profile-value:hover {
  color: var(--vp-c-brand-1);
}
</style>
