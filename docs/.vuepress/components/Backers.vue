<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue'
import { withBase } from '@vuepress/client'
import { useBackersList } from '../shared'

export default defineComponent({
  name: 'Backers',
  setup() {
    const items = useBackersList()
    const el = ref(null)
    const errorHandler = () => true

    if (!__SSR__) {
      console.table(items.value)
    }
    return {
      el,
      items: items.value,
      withBase,
      errorHandler,
    }
  },
})
</script>

<template>
  <ClientOnly>
    <div ref="el" class="backers">
      <ElSpace v-once :size="5" :wrap="true">
        <a
          v-for="item in items"
          :key="item.name"
          :aria-label="item.name"
          :title="item.name"
          class="backers-item"
          tabindex="-1"
          href="javascript:void(0)"
        >
          <ElTooltip placement="top">
            <template #content>
              {{ (item?.platform || '其他') + '：' + item.name }}
            </template>
            <ElAvatar
              shape="circle"
              size="large"
              fit="cover"
              :alt="item.name"
              :src="
                item?.avatar === null ? '' : withBase('20210727/' + item.avatar)
              "
              @error="errorHandler"
            >
              {{ item.name.substring(0, 3).toLocaleUpperCase() }}
            </ElAvatar>
          </ElTooltip>
        </a>
      </ElSpace>
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.backers {
  display: grid;
  place-items: center;
  margin-top: 22px;
  min-height: 100%;
  .backers-item {
    overflow: hidden;
    opacity: 0.85;
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
.backers-name {
  display: flex;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: var(--c-text);
}
</style>
