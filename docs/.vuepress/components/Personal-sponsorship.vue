<template>
  <div class="personal-sponsorship">
    <el-space :size="medium" wrap>
      <a
        v-for="(item, index) in items"
        :aria-label="item.name"
        :href="item?.link === null ? 'javascript:void(0)' : item.link"
        :key="item.name + index"
        :title="item.name"
      >
        <el-avatar
          shape="circle"
          :alt="item.name"
          :size="medium"
          :src="item.portrait"
        >
          {{ item.name.substring(0, 3).toLocaleUpperCase() }}
        </el-avatar>
        <span
          v-text="item.name.substring(0, 4)"
          class="personal-sponsorship-name"
        ></span>
      </a>
    </el-space>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
export default defineComponent({
  name: "Personal-sponsorship",
  setup() {
    const items = ref([
      {
        link: null,
        portrait: null,
        name: "was",
        sum: "98",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "Kccly",
        sum: "98",
        date: null,
      },
      {
        link: null,
        portrait: "https://yuanshen.site/juanzhu/User/XXCF.png",
        name: "**枫",
        sum: "12",
        date: null,
      },
      {
        link: null,
        portrait: "https://yuanshen.site/juanzhu/User/XXZF.png",
        name: "**锋",
        sum: "11",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "sum",
        sum: "10",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "2333",
        sum: "",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "Ciitta",
        sum: "10",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "*世",
        sum: "10",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "舟舟哥哥",
        sum: "6",
        date: null,
      },
      {
        link: null,
        portrait: "https://yuanshen.site/juanzhu/User/XXJP.png",
        name: "**鹏",
        sum: "5",
        date: null,
      },
      {
        link: null,
        portrait: "https://yuanshen.site/juanzhu/User/XXXQ.png",
        name: "*强",
        sum: "5",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "**洋",
        sum: "4",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "*w",
        sum: "2",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "Hanxi小毛怪",
        sum: "1",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "浅念",
        sum: "1",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "Aliceshift",
        sum: "1",
        date: null,
      },
      {
        link: null,
        portrait: "https://yuanshen.site/juanzhu/User/XXMH.png",
        name: "**晗",
        sum: "1",
        date: null,
      },
      {
        link: null,
        portrait: null,
        name: "kmmmm",
        sum: "1",
        date: null,
      },
    ]);
    return {
      items,
    };
  },
});
</script>

<style lang="scss" scoped>
.personal-sponsorship {
  margin-top: 22px;
  a {
    overflow: hidden;
    span.el-avatar {
      background-color: var(--avatar-bg);
    }
  }
}
.personal-sponsorship-name {
  display: flex;
  justify-content: center;
  text-align: center;
  color: var(--c-text);
}
</style>
