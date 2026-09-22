<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'

const { localeIndex } = useData()
const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.meta)

// 站内链接需按当前 locale 前缀拼（默认语言挂在根路径下），外链原样保留
function resolveLink(link: string): string {
  return link.startsWith('http') ? link : `${getLangPath(localeIndex.value)}${link.slice(1)}`
}

const year = String(new Date().getFullYear())
</script>

<template>
  <ul class="aside-meta">
    <li v-for="item in copy.links" :key="item.link">
      <!-- no-icon 关掉 VitePress 给外链加的箭头 -->
      <VPLink class="aside-meta-link no-icon" :href="resolveLink(item.link)">
        {{ item.text }}
      </VPLink>
    </li>
    <li>
      <VPLink class="aside-meta-link no-icon" :href="copy.poweredBy.link">
        {{ copy.poweredBy.text }}
      </VPLink>
    </li>
    <li>
      <span>{{ copy.copyright.replace('{year}', year) }}</span>
    </li>
  </ul>
</template>

<style scoped>
/* 左右内边距与上面卡片的内容左缘一致 */
.aside-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 6px;
  row-gap: 2px;
  /* 右栏小节间距统一 28px，这里收回一半，让版权行贴着上面的卡片 */
  margin: -14px 0 0;
  padding: 0 16px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 18px;
  list-style: none;
}

/* 分隔点粘在前一项尾部：flex 换行只发生在项之间，圆点不会落到行首 */
.aside-meta li:not(:last-child)::after {
  content: '·';
  margin-left: 6px;
}

.aside-meta-link {
  color: inherit;
}

.aside-meta-link:hover {
  color: var(--vp-c-text-2);
}
</style>
