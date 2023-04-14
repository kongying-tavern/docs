<script lang="ts">
const shuffleMembers = (members: Member[], pinTheFirstMember = false): void => {
  let offset = pinTheFirstMember ? 1 : 0
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
</script>

<script setup lang="ts">
import membersCoreData from './members-core.json'
// import membersEmeritiData from './members-emeriti.json'
import membersPartnerData from './members-partner.json'
import TeamHero from './TeamHero.vue'
import TeamList from './TeamList.vue'
import type { Member } from './Member'
shuffleMembers(membersCoreData as Member[], true)
// shuffleMembers(membersEmeritiData as Member[])
shuffleMembers(membersPartnerData as Member[])
</script>

<template>
  <div class="TeamPage">
    <TeamHero>
      <template #title>关于团队</template>
      <template #lead>
        <span class="nowrap"
          >地图的背后是一个基本来自中国的团队，以下是部分成员的个人信息。</span
        >
      </template>
      <template #action>
        <Link href="https://github.com/orgs/kongying-tavern/teams"
          >了解更多关于团队</Link
        >
      </template>
    </TeamHero>

    <TeamList :members="membersCoreData as Member[]">
      <template #title>团队成员</template>
      <template #lead></template>
    </TeamList>
    <TeamList :members="membersPartnerData as Member[]">
      <template #title>社区伙伴</template>
      <template #lead></template>
    </TeamList>
    <!--
      <TeamList :members="membersEmeritiData as Member[]">
        <template #title></template>
        <template #lead></template>
      </TeamList>


      -->
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
