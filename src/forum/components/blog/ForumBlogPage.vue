<script setup lang="ts">
import type { BlogPost } from '~/utils/createBlogLoader'
import { useData } from 'vitepress'
import { computed } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { FluidHoverList } from '@/components/ui/fluid-hover'
import Time from '@/components/ui/Time/Time.vue'
import { data as allPosts } from '~/_data/posts.data'

const { lang, frontmatter } = useData()

const posts = computed(() => {
  const currentLang = lang.value || 'zh'
  const baseLang = currentLang.split('-')[0]
  const result = allPosts.filter((post: BlogPost) => post.lang === baseLang)

  if (result.length === 0)
    return allPosts
  return result
})

// Keep SSR and client markup identical; CSS selects the responsive layout.
const featured = computed(() => posts.value.slice(0, 3))

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
</script>

<template>
  <section
    v-if="featured.length"
    class="blog-featured border-b-[var(--vp-c-divider)] border-b-1px border-b-solid md:grid md:grid-cols-3"
  >
    <a
      class="blog-primary group px-4 pt-4 rounded-xl flex flex-col transition-colors duration-200 md:px-6 md:pt-5 hover:bg-[var(--vp-c-bg-soft)] md:col-span-2"
      :href="buildPostLink(featured[0].url)"
    >
      <div class="blog-cover rounded-xl bg-[var(--vp-c-bg-soft)] overflow-hidden">
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
          v-if="featured[0].excerpt"
          class="blog-excerpt c-[var(--vp-c-text-2)] leading-relaxed max-w-none line-clamp-3 prose prose-sm dark:prose-invert"
          v-html="featured[0].excerpt"
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

    <FluidHoverList indicator-class="rounded-xl bg-[var(--vp-c-bg-soft)]">
      <div class="flex flex-col divide-[var(--vp-c-divider)] divide-y">
        <a
          v-for="post in featured.slice(1)"
          :key="post.url"
          data-fluid-hover-item
          class="blog-secondary group py-5 rounded-xl flex flex-col transition-colors duration-200 md:px-6"
          :href="buildPostLink(post.url)"
        >
          <div class="blog-cover rounded-xl bg-[var(--vp-c-bg-soft)] overflow-hidden">
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
    </FluidHoverList>
  </section>

  <header
    v-if="posts.length"
    class="blog-section-header pb-10 pt-6 md:px-6 md:pb-12 md:pt-16"
  >
    <h1 class="text-3xl leading-[1.25] tracking-tight font-bold md:text-4xl">
      {{ frontmatter.title }}
    </h1>
  </header>

  <FluidHoverList indicator-class="rounded-xl bg-[var(--vp-c-bg-soft)]">
    <ul class="blog-posts c-[var(--vp-c-text-1)]">
      <li
        v-for="post in posts"
        :key="post.url"
        data-fluid-hover-item
        class="pr-4 rounded-xl transition-colors duration-200 relative md:ml-6 md:pr-6"
      >
        <a
          class="blog-post-link group flex"
          :href="buildPostLink(post.url)"
        >
          <div class="blog-cover rounded-xl bg-[var(--vp-c-bg-soft)] shrink-0 w-full overflow-hidden md:w-[350px] md:self-start">
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

          <div class="blog-post-copy pb-5 pr-5 pt-5 flex grow flex-col gap-2.5 min-w-0 md:p-6">
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
              v-if="post.excerpt"
              class="blog-excerpt c-[var(--vp-c-text-2)] leading-relaxed max-w-none line-clamp-2 prose prose-sm dark:prose-invert"
              v-html="post.excerpt"
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
  </FluidHoverList>
</template>

<style scoped>
.blog-featured {
  display: none;
}

.blog-post-link {
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.blog-cover {
  outline: 1px solid oklch(0 0 0 / 0.1);
  outline-offset: -1px;
}

:global(.dark) .blog-cover {
  outline-color: oklch(1 0 0 / 0.1);
}

.blog-section-header {
  padding: 8px 16px 24px;
}

.blog-posts > li {
  margin: 0;
  padding: 0;
}

.blog-posts > li + li {
  margin-top: 16px;
}

.blog-post-copy {
  gap: 10px;
  padding: 0;
}

.blog-post-copy > h2,
.blog-secondary h3 {
  font-size: 22px;
  line-height: 1.4;
  text-wrap: balance;
}

.blog-primary h2 {
  line-height: 1.35;
  text-wrap: balance;
}

.blog-post-copy > span,
.blog-featured span {
  font-size: 12px;
  letter-spacing: 0.06em;
}

.blog-excerpt {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--text-ui-14-fontSize);
  line-height: 1.75;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.blog-primary .blog-excerpt {
  font-size: var(--text-ui-15-fontSize);
  -webkit-line-clamp: 4;
}

.blog-post-copy > div:last-child {
  padding-top: 6px;
}

.blog-post-link:focus-visible,
.blog-featured a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

.blog-excerpt :deep(p),
.blog-excerpt :deep(ul) {
  margin: 0;
}

.blog-excerpt :deep(p + ul) {
  margin-top: 4px;
}

.blog-excerpt :deep(ul) {
  padding-left: 1.2em;
  list-style: disc;
}

.blog-excerpt :deep(li) {
  margin: 0;
  padding-left: 2px;
}

.blog-excerpt :deep(li::marker) {
  color: var(--vp-c-text-3);
}

.blog-excerpt :deep(strong) {
  font-weight: 500;
}

@media (min-width: 768px) {
  .blog-featured {
    display: grid;
  }

  .blog-posts > li:nth-child(-n + 3) {
    display: none;
  }

  .blog-featured + .blog-section-header:has(+ .blog-posts > li:last-child:nth-child(-n + 3)) {
    display: none;
  }

  .blog-post-link {
    flex-direction: row;
    align-items: flex-start;
    gap: 24px;
    padding: 20px;
  }

  .blog-post-link > .blog-cover {
    width: clamp(240px, 32%, 340px);
  }

  .blog-section-header {
    padding: 40px 20px 24px;
  }

  .blog-primary,
  .blog-secondary {
    padding: 20px;
  }

  .blog-primary {
    padding-bottom: 0;
  }

  .blog-secondary h3 {
    font-size: 20px;
  }

  .blog-post-copy {
    flex: 1;
  }
}

html[data-reduced-motion='true'] .blog-cover img {
  transition: none;
  transform: none;
}
</style>
