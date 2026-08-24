<script setup lang="ts">
import type { BlogPost } from '~/utils/createBlogLoader'
import { useMediaQuery } from '@vueuse/core'
import { useData } from 'vitepress'
import { computed } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import Time from '@/components/ui/time/Time.vue'
import { data as allPosts } from '~/_data/posts.data'
import { useMarkdownRenderer } from '~/composables/useMarkdownRenderer'

const { lang, frontmatter } = useData()
const { renderMarkdownPreview } = useMarkdownRenderer()

const posts = computed(() => {
  const currentLang = lang.value || 'zh'
  const baseLang = currentLang.split('-')[0]
  const result = allPosts.filter((post: BlogPost) => post.lang === baseLang)

  if (result.length === 0)
    return allPosts
  return result
})

// 移动端跳过 featured 大卡，全部文章以普通列表展示
const isMediumUp = useMediaQuery('(min-width: 768px)')
const featured = computed(() => posts.value.slice(0, 3))
const restPosts = computed(() => posts.value.slice(3))
const listPosts = computed(() => (isMediumUp.value ? restPosts.value : posts.value))
const showSectionHeader = computed(() => (isMediumUp.value ? restPosts.value.length > 0 : posts.value.length > 0))

function buildPostLink(url: string) {
  return `./posts/${url.slice(url.lastIndexOf('/') + 1)}`
}

const OG_COVER_URL = 'https://genshin.og.interknot.site/apis/v1/og'
const WHITESPACE_RE = /\s+/g

// 文章类型来自 frontmatter（如 `type: hot update`），渲染为全大写、空白转 `-`
function postType(post: BlogPost) {
  const raw = post.frontmatter.type
  if (typeof raw !== 'string' || !raw)
    return ''
  return raw.toUpperCase().replace(WHITESPACE_RE, '-')
}
const CN_BRACKETS_RE = /【|】/g

// 优先使用文章 frontmatter 配置的 cover 链接；未配置时默认 cover=2（标题去掉【】）
function buildPostCover(post: BlogPost) {
  const configured = post.frontmatter.cover
  if (typeof configured === 'string' && configured)
    return configured

  return `${OG_COVER_URL}?cover=2&title=${encodeURIComponent(post.title.replace(CN_BRACKETS_RE, ''))}`
}

function coverProps(post: BlogPost) {
  return {
    src: buildPostCover(post),
    alt: post.title,
    loading: 'lazy',
    decoding: 'async',
  }
}

// 从正文提取最新更新：第一个 timeline 版本的标题 + 首条版本组的前两条条目
const TIMELINE_BLOCK_RE = /^::: timeline (.+)\n([\s\S]*?)^:::[^\n]*$/m
const VERSION_HEADING_RE = /^#{2,3} .+$/m
const LIST_ITEM_RE = /^[-*] (.+)$/gm

function postExcerpt(post: BlogPost): string {
  const match = post.content?.match(TIMELINE_BLOCK_RE)
  if (!match)
    return ''

  // 取第一个版本子标题（##/###）之后的条目组
  const groups = match[2].split(VERSION_HEADING_RE)
  const versionGroup = groups.length > 1 ? groups[1] : match[2]
  const items = [...versionGroup.matchAll(LIST_ITEM_RE)].slice(0, 2).map(item => item[1])

  return renderMarkdownPreview([`**${match[1].trim()}**`, ...items.map(item => `- ${item}`)].join('\n'))
}
</script>

<template>
  <section
    v-if="featured.length && isMediumUp"
    class="border-b-1px border-b-[var(--vp-c-divider)] border-b-solid md:grid md:grid-cols-3"
  >
    <!-- 主 featured：大卡（2/3 宽） -->
    <a
      class="group px-4 pt-4 rounded-xl flex flex-col transition-colors duration-200 md:px-6 md:pt-5 hover:bg-[var(--vp-c-bg-soft)] md:col-span-2"
      :href="buildPostLink(featured[0].url)"
    >
      <div class="rounded-xl bg-[var(--vp-c-bg-soft)] overflow-hidden">
        <img
          class="w-full aspect-[1200/630] transition-transform duration-300 object-cover group-hover:scale-103"
          :src="coverProps(featured[0]).src"
          :alt="coverProps(featured[0]).alt"
          width="1200"
          height="630"
          loading="lazy"
          decoding="async"
        >
      </div>
      <div class="pt-5 flex grow flex-col gap-2.5">
        <span
          v-if="postType(featured[0])"
          class="text-sm c-[var(--vp-c-text-3)] tracking-wide font-[var(--vp-font-family-subtitle)]"
        >
          <span class="mr-1">#</span>{{ postType(featured[0]) }}
        </span>
        <h2 class="text-2xl leading-tight font-medium md:text-3xl">
          {{ featured[0].title }}
        </h2>
        <div
          v-if="postExcerpt(featured[0])"
          class="prose c-[var(--vp-c-text-2)] leading-relaxed max-w-none line-clamp-3"
          v-html="postExcerpt(featured[0])"
        />
      </div>
      <div class="mt-5 pb-4 flex gap-4 items-center justify-between">
        <div class="flex -space-x-2">
          <Avatar
            v-for="author in featured[0].authors"
            :key="author.id"
            size="sm"
            class="ring-2 ring-[var(--vp-c-bg)]"
            :src="author.avatar"
            :alt="author.username"
          />
        </div>
        <div class="flex gap-4 items-center">
          <Time
            class="text-xs c-[var(--vp-c-text-2)] tracking-wider font-[var(--vp-font-family-subtitle)] list-none"
            :datetime="featured[0].date"
            :locale="lang"
            date-style="medium"
          />
        </div>
      </div>
    </a>

    <!-- 次 featured：右侧两小卡（1/3 宽） -->
    <div class="flex flex-col divide-[var(--vp-c-divider)] divide-y">
      <a
        v-for="post in featured.slice(1)"
        :key="post.url"
        class="group py-5 rounded-xl flex flex-col transition-colors duration-200 md:px-6 hover:bg-[var(--vp-c-bg-soft)]"
        :href="buildPostLink(post.url)"
      >
        <div class="rounded-xl bg-[var(--vp-c-bg-soft)] overflow-hidden">
          <img
            class="w-full aspect-[1200/630] transition-transform duration-300 object-cover group-hover:scale-103"
            :src="coverProps(post).src"
            :alt="coverProps(post).alt"
            width="1200"
            height="630"
            loading="lazy"
            decoding="async"
          >
        </div>
        <div class="pt-4 flex grow flex-col gap-2.5">
          <span
            v-if="postType(post)"
            class="text-sm c-[var(--vp-c-text-3)] tracking-wide font-[var(--vp-font-family-subtitle)]"
          >
            <span class="mr-1">#</span>{{ postType(post) }}
          </span>
          <h3 class="text-xl leading-snug font-medium">
            {{ post.title }}
          </h3>
          <Time
            class="text-xs c-[var(--vp-c-text-2)] tracking-wider font-[var(--vp-font-family-subtitle)] mt-auto list-none"
            :datetime="post.date"
            :locale="lang"
            date-style="medium"
          />
        </div>
      </a>
    </div>
  </section>

  <header
    v-if="showSectionHeader"
    class="pb-10 pt-6 md:px-6 md:pb-12 md:pt-16"
  >
    <h1 class="text-3xl leading-[1.25] tracking-tight font-bold md:text-4xl">
      {{ frontmatter.title }}
    </h1>
  </header>

  <ul class="c-[var(--vp-c-text-1)]">
    <li
      v-for="post in listPosts"
      :key="post.url"
      class="mb-3 pr-4 rounded-xl transition-colors duration-200 relative last:mb-0 md:mb-4 md:ml-6 md:pr-6 hover:bg-[var(--vp-c-bg-soft)] md:max-h-52 md:overflow-hidden"
    >
      <a
        class="group flex flex-col md:flex-row"
        :href="buildPostLink(post.url)"
      >
        <div class="rounded-xl bg-[var(--vp-c-bg-soft)] shrink-0 w-full overflow-hidden md:w-[350px] md:self-start">
          <img
            class="w-full aspect-[1200/630] transition-transform duration-300 object-cover group-hover:scale-103"
            :src="coverProps(post).src"
            :alt="coverProps(post).alt"
            width="1200"
            height="630"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="pb-5 pr-5 pt-5 flex grow flex-col gap-2.5 md:p-6">
          <span
            v-if="postType(post)"
            class="text-sm c-[var(--vp-c-text-3)] tracking-wide font-[var(--vp-font-family-subtitle)]"
          >
            <span class="mr-1">#</span>{{ postType(post) }}
          </span>
          <h2 class="text-2xl leading-8 font-medium">
            {{ post.title }}
          </h2>
          <div
            v-if="postExcerpt(post)"
            class="prose c-[var(--vp-c-text-2)] leading-relaxed max-w-none hidden line-clamp-2 md:block md:line-clamp-1"
            v-html="postExcerpt(post)"
          />
          <div class="mt-auto flex gap-4 items-center justify-between">
            <div class="flex -space-x-2">
              <Avatar
                v-for="author in post.authors"
                :key="author.id"
                size="sm"
                class="ring-2 ring-[var(--vp-c-bg)]"
                :src="author.avatar"
                :alt="author.username"
              />
            </div>
            <Time
              class="text-xs c-[var(--vp-c-text-2)] tracking-wider font-[var(--vp-font-family-subtitle)] list-none"
              :datetime="post.date"
              :locale="lang"
              date-style="medium"
            />
          </div>
        </div>
      </a>
      <div class="bg-[var(--vp-c-divider)] h-px bottom-0 left-0 right-0 absolute" />
    </li>
  </ul>
</template>
