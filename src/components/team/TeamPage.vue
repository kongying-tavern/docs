<script setup lang="ts">
import type { Member } from './Member'

import { useI18n } from 'vue-i18n'
import membersCoreData from './members-core.json'
import membersEmeritiData from './members-emeriti.json'
import membersPartnerData from './members-partner.json'
import TeamHero from './TeamHero.vue'
import TeamList from './TeamList.vue'

const { t } = useI18n({ useScope: 'global' })

function shuffleMembers(members: Member[], pinTheFirstMember = false): void {
  const offset = pinTheFirstMember ? 2 : 0
  // `i` is between `1` and `length - offset`
  // `j` is between `0` and `length - offset - 1`
  // `offset + i - 1` is between `offset` and `length - 1`
  // `offset + j` is between `offset` and `length - 1`
  let i = members.length - offset

  while (i > 0) {
    const j = Math.floor(Math.random() * i)

    ;[members[offset + i - 1], members[offset + j]] = [
      members[offset + j],
      members[offset + i - 1],
    ]
    i -= 1
  }
}

const membersCore: Member[] = membersCoreData
const membersEmeriti: Member[] = membersEmeritiData
const membersPartner: Member[] = membersPartnerData

shuffleMembers(membersCore, true)
shuffleMembers(membersEmeriti)
shuffleMembers(membersPartner)
</script>

<template>
  <div class="TeamPage">
    <TeamHero>
      <template #title>
        {{ t('team.title') }}
      </template>
      <template #lead>
        <span class="nowrap">{{ t('team.desc') }}</span>
      </template>
      <template #action>
        <VPLink href="https://github.com/orgs/kongying-tavern/teams">
          {{ t('team.heroAction') }}
        </VPLink>
      </template>
    </TeamHero>

    <TeamList :members="membersCore">
      <template #title>
        {{ t('team.coreMember.title') }}
      </template>
      <template #lead>
        {{ t('team.coreMember.desc') }}
      </template>
    </TeamList>

    <TeamList :members="membersEmeriti">
      <template #title>
        {{ t('team.emeritiMember.title') }}
      </template>
      <template #lead>
        {{ t('team.emeritiMember.desc') }}
      </template>
    </TeamList>

    <TeamList :members="membersPartner">
      <template #title>
        {{ t('team.partnerMember.title') }}
      </template>
      <template #lead>
        {{ t('team.partnerMember.desc') }}
      </template>
    </TeamList>
  </div>
</template>

<style scoped>
.TeamPage {
  padding-bottom: 16px;
}

@media (min-width: 768px) {
  .TeamPage {
    padding-bottom: 96px;
  }
}

.TeamList + .TeamList {
  padding-top: 64px;
}
</style>
