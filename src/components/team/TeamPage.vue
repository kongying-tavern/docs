<script lang="ts"></script>

<script setup lang="ts">
import type { Member } from './Member'
import { useData } from 'vitepress'
import membersCoreData from './members-core.json'
import membersEmeritiData from './members-emeriti.json'
import membersPartnerData from './members-partner.json'
import TeamHero from './TeamHero.vue'
import TeamList from './TeamList.vue'

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
    i--
  }
}

const { theme } = useData()

shuffleMembers(membersCoreData as Member[], true)
shuffleMembers(membersEmeritiData as Member[])
shuffleMembers(membersPartnerData as Member[])
</script>

<template>
  <div class="TeamPage">
    <TeamHero>
      <template #title>
        {{ theme.team.title }}
      </template>
      <template #lead>
        <span class="nowrap">{{ theme.team.desc }}</span>
      </template>
      <template #action>
        <VPLink href="https://github.com/orgs/kongying-tavern/teams">
          了解更多关于团队
        </VPLink>
      </template>
    </TeamHero>

    <TeamList :members="membersCoreData as Member[]">
      <template #title>
        {{ theme.team.coreMember.title }}
      </template>
      <template #lead>
        {{ theme.team.coreMember.desc }}
      </template>
    </TeamList>

    <TeamList :members="membersEmeritiData as Member[]">
      <template #title>
        {{ theme.team.emeritiMember.title }}
      </template>
      <template #lead>
        {{ theme.team.emeritiMember.desc }}
      </template>
    </TeamList>

    <TeamList :members="membersPartnerData as Member[]">
      <template #title>
        {{ theme.team.partnerMember.title }}
      </template>
      <template #lead>
        {{ theme.team.partnerMember.desc }}
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
