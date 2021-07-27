<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue'
import { withBase } from '@vuepress/client'
import { useBackersList } from '../shared'
import { useElementSize } from '@vueuse/core'

export default defineComponent({
  name: 'Backers',
  setup() {
    const items = useBackersList()
    const el = ref(null)
    const { width, height } = useElementSize(el)
    onMounted(async () => {
      await nextTick()
      console.log(width.value, height.value)
    })
    console.log(width.value, height.value)
    return {
      el,
      items: items.value,
      withBase,
    }
  },
})
</script>

<template>
  <div ref="el" class="backers">
    <ElSpace :size="6" :wrap="true">
      <a
        v-for="item in items"
        :key="item.name"
        :aria-label="item.name"
        :title="item.name"
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
            :src="withBase('20210727/' + item.avatar)"
          >
            {{ item.name.substring(0, 3).toLocaleUpperCase() }}
          </ElAvatar>
        </ElTooltip>
      </a>
    </ElSpace>
  </div>
</template>

<style lang="scss" scoped>
.backers {
  display: grid;
  place-items: center;
  margin-top: 22px;
  min-height: 100%;
  a {
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
