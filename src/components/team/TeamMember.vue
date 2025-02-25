<script setup lang="ts">
import type { Member } from './Member'
import { computed } from 'vue'

const props = defineProps<{
  member: Member
}>()

const avatarUrl = computed(() => {
  return (
    props.member.avatarPic
    ?? `https://q1.qlogo.cn/g?b=qq&nk=${props.member.qq}&s=640`
  )
})
</script>

<template>
  <article class="view-fade-y TeamMember">
    <VPLink
      v-if="member.sponsor"
      class="sponsor"
      :href="`https://github.com/sponsors/${member.socials?.github}`"
      no-icon
    >
      <svg i-ic-sharp-favorite class="sponsor-icon" /> 赞助
    </VPLink>

    <figure class="avatar">
      <img
        class="avatar-img skeleton"
        onload="this.classList.toggle('skeleton')"
        :src="avatarUrl"
        :alt="`${member.name}'s Profile Picture`"
      >
    </figure>

    <div class="data">
      <h1 class="name">
        {{ member.name }}
      </h1>
      <p class="org">
        {{ member.title }}
        <span v-if="member.company" class="nowrap">
          @
          <VPLink
            v-if="member.companyLink"
            class="company link"
            :href="member.companyLink"
            :no-icon="true"
          >
            {{ member.company }}
          </VPLink>
          <span v-else class="company">
            {{ member.company }}
          </span>
        </span>
      </p>

      <div class="profiles">
        <section v-if="member.projects" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">
              Projects
            </h2>
            <svg i-ph-code-bold class="code desc-icon" />
          </div>
          <ul class="desc-list">
            <li
              v-for="project in member.projects"
              :key="project.label"
              class="desc-item"
            >
              <VPLink class="desc-link" :href="project.url" :no-icon="true">
                {{ project.label }}
              </VPLink>
            </li>
          </ul>
        </section>

        <section v-if="member.location" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">
              Location
            </h2>
            <svg i-ic-sharp-location-on class="desc-icon" />
          </div>
          <p class="desc-text">
            {{ member.location }}
          </p>
        </section>

        <section v-if="member.languages" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">
              Languages
            </h2>
            <svg i-ic-round-language class="desc-icon" />
          </div>
          <ul class="desc-list">
            <li
              v-for="language in member.languages"
              :key="language"
              class="desc-item"
            >
              {{ language }}
            </li>
          </ul>
        </section>

        <section v-if="member.website" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">
              Website
            </h2>
            <svg
              i-ic-baseline-attachment
              class="desc-icon"
              style="transform: rotate(135deg)"
            />
          </div>
          <p class="desc-text">
            <VPLink
              class="desc-link"
              :href="member.website.url"
              :no-icon="true"
            >
              {{ member.website.label }}
            </VPLink>
          </p>
        </section>

        <ul class="social-list">
          <li v-if="member.socials?.github" class="social-item">
            <VPLink
              class="social-link"
              :href="`https://github.com/${member.socials?.github}`"
              :no-icon="true"
            >
              <svg
                class="social-icon"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>GitHub</title>
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                />
              </svg>
            </VPLink>
          </li>
          <li v-if="member.socials?.twitter" class="social-item">
            <VPLink
              class="social-link"
              :href="`https://twitter.com/${member.socials?.twitter}`"
              :no-icon="true"
            >
              <svg
                class="social-icon"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Twitter</title>
                <path
                  d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                />
              </svg>
            </VPLink>
          </li>
          <li v-if="member.socials?.bilibili" class="social-item">
            <VPLink
              class="social-link"
              :href="`https://space.bilibili.com/${member.socials?.bilibili}`"
              :no-icon="true"
            >
              <svg
                class="social-icon"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Bilibili</title>
                <path
                  d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z"
                />
              </svg>
            </VPLink>
          </li>
          <li v-if="member.socials?.gitee" class="social-item">
            <VPLink
              class="social-link"
              :href="`https://gitee.com/${member.socials?.gitee}`"
              :no-icon="true"
            >
              <svg
                class="social-icon"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Gitee</title>
                <path
                  d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"
                />
              </svg>
            </VPLink>
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
.TeamMember {
  position: relative;
  background-color: var(--vp-c-bg-soft);
  transition:
    all 0.5s,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.TeamMember:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: var(--vp-shadow-1);
}

@media (min-width: 512px) {
  .TeamMember {
    display: flex;
  }
}

@media (min-width: 640px) {
  .TeamMember {
    border-radius: 8px;
  }
}

.sponsor {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  border: 1px solid #fd1d7c;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #fd1d7c;
  transition:
    color 0.25s,
    background-color 0.25s;
}

.sponsor:hover {
  color: var(--vp-c-white);
  background-color: #fd1d7c;
}

.sponsor-icon {
  margin-right: 6px;
  width: 14px;
  height: 14px;
  fill: currentColor;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}

.avatar {
  flex-shrink: 0;
  padding: 32px 32px 0;
}

@media (min-width: 512px) {
  .avatar {
    padding: 32px 0 0 32px;
  }
}

.avatar-img {
  border-radius: 50%;
  width: 96px;
  height: 96px;
  background-color: var(--vp-c-mute-dark);
  transform: translateX(-8px);
}

.avatar-img .skeleton {
  animation: skeleton-flashed 2s linear 2s infinite;
}

@media (min-width: 512px) {
  .avatar-img {
    width: 80px;
    height: 80px;
    transform: translateX(0);
  }
}

.data {
  padding: 20px 32px 32px;
}

@media (min-width: 512px) {
  .data {
    padding: 40px 32px 32px 32px;
  }
}

.name {
  font-size: 20px;
  font-weight: 500;
}

.org {
  padding-top: 4px;
  line-height: 20px;
  max-width: 320px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}

.company {
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.company.link:hover {
  color: var(--vp-c-brand);
  transition: color 0.5s;
}

.profiles {
  padding-top: 16px;
}

.desc {
  display: flex;
}

.desc + .desc {
  padding-top: 12px;
}

.desc-title {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  padding-right: 12px;
  height: 20px;
}

.desc-icon {
  width: 16px;
  height: 16px;
  fill: var(--vp-c-text-2);
  transition: fill 0.25s;
}

.desc-icon.code {
  transform: translateY(1px);
}

.desc-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -4px;
}

.desc-item {
  padding: 0 4px;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition: color 0.5s;
}

.desc-item::after {
  margin-left: 8px;
  content: '•';
  color: var(--vp-c-text-3);
  transition: color 0.25s;
}

.desc-item:last-child::after {
  display: none;
}

.desc-text {
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.desc-link {
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand);
  transition: color 0.25s;
}

.desc-link:hover {
  color: var(--vp-c-brand-dark);
}

.social-list {
  display: flex;
  flex-wrap: wrap;
  margin-left: -6px;
  padding-top: 16px;
}

.social-item + .social-item {
  padding-left: 8px;
}

.social-link {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  color: var(--vp-c-text-2);
  transition: color 0.25s;
}

.social-link:hover {
  color: var(--vp-c-text-1);
}

.social-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}
</style>
