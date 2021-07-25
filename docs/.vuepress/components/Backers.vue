<template>
  <div v-once class="backers">
    <ElSpace :size="6" :wrap="true">
      <a
        v-for="item in items"
        :key="item.name"
        :aria-label="item.name"
        :title="item.name"
        href="javascript:void(0)"
      >
        <ElTooltip
          :content="(item?.platform || '其他') + '：' + item.name"
          placement="top"
        >
          <ElAvatar shape="circle" size="large" :alt="item.name" :src="item.avatar">
            {{ item.name.substring(0, 3).toLocaleUpperCase() }}
          </ElAvatar>
        </ElTooltip>
      </a>
    </ElSpace>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import { withBase } from "@vuepress/client";

export default defineComponent({
  name: "Backers",
  setup() {
    const items = reactive(
      [
        {
          avatar: null,
          name: "was",
          sum: "98",
          date: null,
        },
        {
          avatar: null,
          name: "Kccly",
          sum: "98",
          date: null,
        },
        {
          avatar: "https://yuanshen.site/juanzhu/User/XXCF.png",
          name: "**枫",
          sum: "12",
          date: null,
        },
        {
          avatar: "https://yuanshen.site/juanzhu/User/XXZF.png",
          name: "**锋",
          sum: "11",
          date: null,
        },
        {
          avatar: null,
          name: "sum",
          sum: "10",
          date: null,
        },
        {
          avatar: null,
          name: "2333",
          sum: "",
          date: null,
        },
        {
          avatar: null,
          name: "Ciitta",
          sum: "10",
          date: null,
        },
        {
          avatar: null,
          name: "*世",
          sum: "10",
          date: null,
        },
        {
          avatar: null,
          name: "舟舟哥哥",
          sum: "6",
          date: null,
        },
        {
          avatar: "https://yuanshen.site/juanzhu/User/XXJP.png",
          name: "**鹏",
          sum: "5",
          date: null,
        },
        {
          avatar: "https://yuanshen.site/juanzhu/User/XXXQ.png",
          name: "*强",
          sum: "5",
          date: null,
        },
        {
          avatar: null,
          name: "**洋",
          sum: "4",
          date: null,
        },
        {
          avatar: null,
          name: "*w",
          sum: "2",
          date: null,
        },
        {
          avatar: null,
          name: "Hanxi小毛怪",
          sum: "1",
          date: null,
        },
        {
          avatar: null,
          name: "浅念",
          sum: "1",
          date: null,
        },
        {
          avatar: null,
          name: "Aliceshift",
          sum: "1",
          date: null,
        },
        {
          avatar: "https://yuanshen.site/juanzhu/User/XXMH.png",
          name: "**晗",
          sum: "1",
          date: null,
        },
        {
          avatar: null,
          name: "kmmmm",
          sum: "1",
          date: null,
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "uukong",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "运输队长常凯申",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "星星的祈愿",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "赛鹿鹿",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "adslgg1716",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "诶嘿",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "黑棉种植真君",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "qwertaswl",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "天蝎",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar:
            "https://pic1.爱赞助cdn.com/user/525b411ccc4a11ebbdd252540025c377/avatar/aa0b39c61cb64e1270e775f9db5f777a_w400_h400_s31.jpg?imageView2/1/w/120/h/120",
          name: "烟雨蒙蒙",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "aqua",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "诶嘿",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "gokoushiro",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "adslgg1716",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "爱发电用户_6Faj",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "jiujiezzz",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "爱发电用户_sqUS",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "爱发电用户_tVSC",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "原神醪",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "赛鹿鹿",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "道易",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "qwertaswl",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "秋东",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "星星的祈愿",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "凛夜",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "爱发电用户_ChqQ",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "运输队长常凯申",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "烟雨蒙蒙",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "revton",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "uukong",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "ZlCr",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "淘淘巷",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar:
            "https://pic1.爱赞助cdn.com/user/da6c907a80f911eba6db52540025c377/avatar/5eee20abfa813344afeb0f2f531a45da_w400_h400_s22.jpeg?imageView2/1/w/120/h/120",
          name: "XIAOYAO",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",

          avatar: null,
          name: "欧皇面",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "eleven",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "爱发电用户_FknQ",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "momocoo",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "墨大喵",
          sum: "unknown",
          date: "unknown",
        },
        {
          platform: "爱赞助",
          avatar: null,
          name: "背石头的猫",
          sum: "unknown",
          date: "unknown",
        },
        {
          avatar: null,
          sum: "100",
          name: "**和",
          date: "2021年06月13日",
        },
        {
          avatar: null,
          sum: "20",
          name: "**平",
          date: "2021年06月26日",
        },
        {
          avatar: null,
          sum: "88",
          name: "*真",
          date: "2021年07月01日",
        },
        {
          avatar: null,
          sum: "100",
          name: "*🍉",
          date: "2021年07月04日",
        },
        {
          avatar: null,
          sum: "6",
          name: "-*-",
          date: "2021年07月07日",
        },
        {
          avatar: null,
          sum: "2",
          name: "**孝",
          date: "2021年07月07日",
        },
        {
          avatar: null,
          sum: "20",
          name: "**樑",
          date: "2021年07月09日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*硕",
          date: "2021年07月11日",
        },
        {
          avatar: null,
          sum: "1000",
          name: "**杰",
          date: "2021年07月13日",
        },
        {
          avatar: null,
          sum: "5",
          name: "L*G",
          date: "2021年07月15日",
        },
        {
          avatar: null,
          sum: "1",
          name: "*L",
          date: "2021年07月15日",
        },
        {
          avatar: null,
          sum: "100",
          name: "*样",
          date: "2021年07月17日",
        },
        {
          avatar: null,
          sum: "10",
          name: "4*D",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "1",
          name: "*逸",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*叶",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "1.16",
          name: "w*w",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "10",
          name: "T*y",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "1",
          name: "*玖",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*草",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*人",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "1",
          name: "*丘",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*径",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*下",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*.",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*琦",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "20",
          name: "*月",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "30",
          name: "*🐾",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*🍌",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "6",
          name: "**宏",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "20",
          name: "**煊",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "1",
          name: "**清",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "6",
          name: "**峰",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "1",
          name: "**杰",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "6",
          name: "*璐",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "6",
          name: "**凯",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*刚",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*翔",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "6.15",
          name: "Accelerator",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "2",
          name: "澪依/LingYi",
          date: "2021年07月21日",
        },
        {
          avatar: null,
          sum: "2.88",
          name: "跟*i",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "1000",
          name: "**杰",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*子",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "30",
          name: "T*t",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*诚",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "20",
          name: "**娟",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "1",
          name: "*辉",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "3",
          name: "*扶",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "30",
          name: "*宇",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "1",
          name: "**翔",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "5",
          name: "**治",
          date: "2021年07月22日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*江",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "30",
          name: "*丸",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "83.46",
          name: "C*h",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*聚",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "10",
          name: "**毅",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "5",
          name: "**宇",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "1",
          name: "h*n",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "8.88",
          name: "k*.",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "20",
          name: "*晗",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "100",
          name: "**谣",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "100",
          name: "**园",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*花",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*。",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "0.01",
          name: "*。",
          date: "2021年07月23日",
        },
        {
          avatar: null,
          sum: "2",
          name: "*下",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*。",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "2",
          name: "*ウ",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*离",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*朱",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*家",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*辉",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "5",
          name: "P*e",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "5",
          name: "*涛",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "38",
          name: "**泉",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "20",
          name: "**皓",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "10",
          name: "**杰",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "10",
          name: "*意",
          date: "2021年07月24日",
        },
        {
          avatar: null,
          sum: "100",
          name: "*🌚",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "20",
          name: "*k",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "20",
          name: "u*l",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "10",
          name: "p*n",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "2",
          name: "**言",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "15",
          name: "*硕",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "68",
          name: "*天",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "10",
          name: "S*i",
          date: "2021年07月25日",
        },
        {
          avatar: null,
          sum: "1",
          name: "*呐",
          date: "2021年07月26日",
        },
      ].sort((x, y) => x.name.localeCompare(y.name))
    );
    console.table(items)
    return {
      items,
    };
  },
});
</script>

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
