<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBackersList } from '../shared'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'

import type { ThemeLocaleData } from '../shared'

const themeLocaleData = useThemeLocaleData<ThemeLocaleData>()
const items = useBackersList()
const index = ref(128)

if (!__SSR__) {
  onMounted(
    () =>
      (index.value =
        window.innerWidth / 10 >= 128 ? 128 : window.innerWidth / 10)
  )
}
</script>

<template>
  <ClientOnly>
    <div :class="$style.backers">
      <div :class="$style.backersContainer">
        <a
          v-for="item in items.slice(0, index)"
          :key="item.name"
          :aria-label="item.name"
          :class="$style.backersItem"
          tabindex="-1"
          href="javascript:void(0)"
        >
          <ElTooltip placement="top">
            <template #content>
              {{ (item?.platform || '其他') + '：' + item.name }}
              <br />
              {{ item?.remark }}
            </template>
            <ElAvatar
              shape="circle"
              :size="40"
              style="background-color: var(--docs-avatar-bg)"
              fit="cover"
              :alt="item.name"
              :src="
                item?.avatarURL === null ? '' : './20210727/' + item.avatarURL
              "
              @error="true"
            >
              {{ item.name.substring(0, 3).toLocaleUpperCase() }}
            </ElAvatar>
          </ElTooltip>
        </a>
      </div>
      <div
        :class="$style.backersPagination"
        v-if="index <= items.length"
        @click="index += 20"
      >
        {{ themeLocaleData.showMore
        }}<i class="el-icon-arrow-down el-icon--right"></i>
      </div>
    </div>
  </ClientOnly>
</template>

<style module lang="scss">
.backers {
  display: grid;
  place-items: center;
  margin-top: 22px;
  min-height: 100%;
  .backersContainer {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: -5px;
    align-items: center;
  }
  .backersPagination {
    cursor: pointer;
    display: inline-block;
    width: 100%;
    appearance: button;
    text-align: left;
    margin-top: 4px;
    font-size: 14px;
    color: #768390;
  }
  .backersItem {
    overflow: hidden;
    opacity: 0.85;
    padding-bottom: 2px;
    margin-right: 4px;
    &:hover {
      opacity: 1;
      text-decoration: none;
      transition: all 0.3s;
    }

    span.el-avatar {
      background-color: var(--docs-avatar-bg);
    }
  }
}
</style>
