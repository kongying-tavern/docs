<script setup lang="ts">
import type { Member } from './Member'
import Link from './Link.vue'

const props = defineProps<{
  member: Member
}>()

const avatarUrl = computed(() => {
  return (
    props.member.avatarPic ??
    `https://www.github.com/${props.member.socials?.github}.png`
  )
})
</script>

<template>
  <article class="TeamMember">
    <Link
      v-if="member.sponsor"
      class="sponsor"
      :href="`https://github.com/sponsors/${member.socials?.github}`"
      no-icon
    >
      <label i-ic-sharp-favorite class="sponsor-icon" /> 赞助
    </Link>

    <figure class="avatar">
      <img
        class="avatar-img skeleton"
        onload="this.classList.toggle('skeleton')"
        :src="avatarUrl"
        :alt="`${member.name}'s Profile Picture`"
      />
    </figure>

    <div class="data">
      <h1 class="name">{{ member.name }}</h1>
      <p class="org">
        {{ member.title }}
        <span v-if="member.company" class="nowrap">
          @
          <Link
            v-if="member.companyLink"
            class="company link"
            :href="member.companyLink"
            :no-icon="true"
          >
            {{ member.company }}
          </Link>
          <span v-else class="company">
            {{ member.company }}
          </span>
        </span>
      </p>

      <div class="profiles">
        <section v-if="member.projects" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">Projects</h2>
            <label i-ph-code-bold class="desc-icon code" />
          </div>
          <ul class="desc-list">
            <li
              v-for="project in member.projects"
              :key="project.label"
              class="desc-item"
            >
              <Link class="desc-link" :href="project.url" :no-icon="true">
                {{ project.label }}
              </Link>
            </li>
          </ul>
        </section>

        <section v-if="member.location" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">Location</h2>
            <label i-ic-sharp-location-on class="desc-icon" />
          </div>
          <p class="desc-text">
            {{ member.location }}
          </p>
        </section>

        <section v-if="member.languages" class="desc">
          <div class="desc-title">
            <h2 class="sr-only">Languages</h2>
            <label i-ic-round-language class="desc-icon" />
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
            <h2 class="sr-only">Website</h2>
            <label
              i-ic-baseline-attachment
              class="desc-icon"
              style="transform: rotate(135deg)"
            />
          </div>
          <p class="desc-text">
            <Link class="desc-link" :href="member.website.url" :no-icon="true">
              {{ member.website.label }}
            </Link>
          </p>
        </section>

        <ul class="social-list">
          <li v-if="member.socials?.github" class="social-item">
            <Link
              class="social-link"
              :href="`https://github.com/${member.socials?.github}`"
              :no-icon="true"
            >
              <label i-logos-github-icon class="social-icon" />
            </Link>
          </li>
          <li v-if="member.socials?.twitter" class="social-item">
            <Link
              class="social-link"
              :href="`https://twitter.com/${member.socials?.twitter}`"
              :no-icon="true"
            >
              <label i-logos-twitter class="social-icon" />
            </Link>
          </li>
          <li v-if="member.socials?.linkedin" class="social-item">
            <Link
              class="social-link"
              :href="`https://www.linkedin.com/in/${member.socials?.linkedin}`"
              :no-icon="true"
            >
              <label i-logos-linkedin-icon class="social-icon" />
            </Link>
          </li>
          <li v-if="member.socials?.codepen" class="social-item">
            <Link
              class="social-link"
              :href="`https://codepen.io/${member.socials?.codepen}`"
              :no-icon="true"
            >
              <label i-custom-bilibili class="social-icon" />
            </Link>
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
  transition: background-color 0.5s;
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
  align-items: center;
  border: 1px solid #fd1d7c;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #fd1d7c;
  transition: color 0.25s, background-color 0.25s;
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
  animation: skeleton--flashed 2s linear 2s infinite;
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
  align-items: center;
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

@keyframes skeleton--gradient {
  0% {
    transform: translate(-100%) skew(-15deg);
  }

  to {
    transform: translate(100%) skew(-15deg);
  }
}

@keyframes skeleton--flashed {
  0% {
    opacity: 1;
  }

  50% {
    background-color: #e6e6e64d;
    opacity: 0.3;
  }

  to {
    opacity: 1;
  }
}
</style>
