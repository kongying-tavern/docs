<template>
  <div v-once class="backers">
    <el-space :size="22" direction="vertical" :wrap="true">
      <a
        v-for="(item, index) in items"
        :key="item.name + index"
        :aria-label="item.name"
        :href="item.link === null ? 'javascript:void(0)' : item.link"
        :title="item.name"
      >
        <el-avatar
          shape="circle"
          size="small"
          src="https://bbs.mihoyo.com/ys/accountCenter/postList?id=1179529"
          :alt="item.name"
        >
          <!-- {{ item.name.substring(0, 3).toLocaleUpperCase() }} -->
        </el-avatar>
        <dev class="backers-name" v-text="item.name.substring(0, 18)"></dev>
      </a>
    </el-space>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'PointContribution',
  setup() {
    const items = ref(
      [
        {
          link: 'https://bbs.mihoyo.com/ys/accountCenter/postList?id=1179529',
          portrait:
            '/20210701/1625129981_C959DD88B74787BFAC2E2AD662FBA8CF.jpeg',
          name: '铃',
          date: '2020-09-13',
        },
        {
          link: 'https://space.bilibili.com/12341623/',
          portrait:
            '/20210701/1625129986_657B530A147B90A84CA752F8B8004D20.jpeg',
          name: 'Minazuki_Chocola',
          date: '	2020-10-12',
        },
        {
          link: null,
          portrait:
            '/20210701/1625129972_3C859C6D641CB7287D9FC2746430377E.jpeg',
          name: '丘丘人保护协会',
          sum: '12',
          date: null,
        },
      ].sort((x, y) => x['name'].localeCompare(y['name']))
    )

    return {
      items,
    }
  },
})
</script>

<style lang="scss" scoped></style>
