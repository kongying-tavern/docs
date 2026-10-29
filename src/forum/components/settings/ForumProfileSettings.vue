<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import { getGiteeSettingsHref } from '~/constants/site'
import { USER_PROFILE_READONLY_FIELDS } from '~/forum/config/userProfile'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import ForumProfileForm from '../user/ForumProfileForm.vue'

const { t } = useI18n({ useScope: 'global' })
const userInfo = useUserInfoStore()
const auth = useUserAuthStore()
</script>

<template>
  <div v-if="auth.isLoggedIn && userInfo.info">
    <ForumProfileForm
      :key="userInfo.info.login"
      :user="userInfo.info"
    >
      <template #before-rows>
        <SettingsRow :title="t('settings.profile.avatar')">
          <div class="avatar-control ml-auto inline-flex relative">
            <Avatar :src="userInfo.info.avatar" :alt="userInfo.info.username" />
            <Button variant="secondary" size="icon" class="avatar-edit rounded-full inset-0 absolute" as-child>
              <a
                :href="getGiteeSettingsHref('avatar')"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`${t('settings.profile.editOnGitee')} · ${t('settings.profile.avatar')}`"
                :title="t('settings.profile.editOnGitee')"
              >
                <span class="i-lucide-pencil size-3" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </SettingsRow>
      </template>
      <template #rows>
        <SettingsRow
          v-for="field in USER_PROFILE_READONLY_FIELDS.filter(field => field.control !== 'avatar')"
          :key="field.key"
          :title="t(`settings.profile.${field.key}`)"
          :label-for="field.control === 'input' ? `profile-settings-${field.key}` : undefined"
        >
          <div class="flex gap-3 min-w-0 w-full items-center justify-end">
            <Input
              :id="`profile-settings-${field.key}`"
              :model-value="userInfo.info[field.key] || t('settings.profile.unset')"
              class="text-right"
              disabled
            />
            <Button variant="secondary" size="icon-xs" class="rounded-full" as-child>
              <a
                :href="getGiteeSettingsHref(field.section)"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`${t('settings.profile.editOnGitee')} · ${t(`settings.profile.${field.key}`)}`"
                :title="t('settings.profile.editOnGitee')"
              >
                <span class="i-lucide-pencil size-3" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </SettingsRow>
      </template>
    </ForumProfileForm>
  </div>
</template>

<style scoped>
.avatar-edit {
  width: 100%;
  height: 100%;
  opacity: 0;
}

.avatar-control:hover .avatar-edit,
.avatar-control:focus-within .avatar-edit {
  opacity: 1;
}

@media (hover: none) {
  .avatar-edit {
    opacity: 1;
  }
}
</style>
