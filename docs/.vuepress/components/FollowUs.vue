<template>
  <div class="follow-us" role="region" aria-label="社交媒体链接">
    <h4>{{ followUs }}</h4>
    <nav>
      <ul>
        <li class="follow-us-item">
          <a
            href="https://space.bilibili.com/518076785"
            target="_blank"
            title="bilibili"
          >
            <Icon icon="bilibili" />
          </a>
        </li>
        <li class="follow-us-item">
          <a
            href="https://github.com/jiazengp/genshinmap-docs/"
            target="_blank"
            title="GitHub"
          >
            <Icon icon="github" />
          </a>
        </li>
        <li class="follow-us-item">
          <a href="https://gitee.com/KYJGYSDT" target="_blank" title="Gitee">
            <Icon icon="gitee" />
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'

import type { ThemeData } from '@vuepress/plugin-theme-data/lib/client'

type MyThemeData = ThemeData<{
  followUs: string
}>

export default defineComponent({
  name: 'FollowUs',
  setup() {
    const themeLocaleData = useThemeLocaleData<MyThemeData>()
    return {
      followUs: themeLocaleData.value.followUs,
    }
  },
})
</script>

<style lang="scss" scoped>
$follow-us-icon-size: 24px;

.follow-us {
  display: flex;
  border-bottom: 1px solid var(--c-border-dark);
  h3 {
    font-size: 1.16875em;
    margin-right: 8px;
  }
  nav {
    margin: auto 0;
    ul {
      display: flex;
      list-style: none;

      .follow-us-item {
        height: $follow-us-icon-size;
        width: $follow-us-icon-size;
        margin-right: $follow-us-icon-size;
        flex: 0 0 auto;
        a > svg {
          color: #202124;
          filter: grayscale(1);
          margin: 0 5px 0 0;
          height: $follow-us-icon-size;
          width: $follow-us-icon-size;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
          &:hover {
            filter: grayscale(0);
          }
        }
      }
    }
  }
}
</style>
