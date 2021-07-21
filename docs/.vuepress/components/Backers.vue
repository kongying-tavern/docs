<template>
  <div v-once class="backers">
    <ElSpace :size="8" :wrap="true">
      <a
        v-for="(item, index) in items"
        :key="item.name + index"
        :aria-label="item.name"
        :title="item.name"
        href="javascript:void(0)"
      >
        <ElTooltip
          :content="(item?.platform || '其他') + '：' + item.name"
          placement="top"
        >
          <ElAvatar
            shape="circle"
            size="large"
            :alt="item.name"
            :src="item.avatarUrl"
          >
            {{ item.name.substring(0, 3).toLocaleUpperCase() }}
          </ElAvatar>
        </ElTooltip>
        <!-- <span class="backers-name" v-text=".substring(0, 4)"></span> -->
      </a>
    </ElSpace>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'Backers',
  setup() {
    /**
     * @description: 个人赞助鸣谢名单数组
     * @todo 数据接口
     */
    const items = ref(
      [
        {
          link: null,
          avatarUrl: null,
          name: 'was',
          sum: '98',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: 'Kccly',
          sum: '98',
          date: null,
        },
        {
          link: null,
          avatarUrl: 'https://yuanshen.site/juanzhu/User/XXCF.png',
          name: '**枫',
          sum: '12',
          date: null,
        },
        {
          link: null,
          avatarUrl: 'https://yuanshen.site/juanzhu/User/XXZF.png',
          name: '**锋',
          sum: '11',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: 'sum',
          sum: '10',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: '2333',
          sum: '',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: 'Ciitta',
          sum: '10',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: '*世',
          sum: '10',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: '舟舟哥哥',
          sum: '6',
          date: null,
        },
        {
          link: null,
          avatarUrl: 'https://yuanshen.site/juanzhu/User/XXJP.png',
          name: '**鹏',
          sum: '5',
          date: null,
        },
        {
          link: null,
          avatarUrl: 'https://yuanshen.site/juanzhu/User/XXXQ.png',
          name: '*强',
          sum: '5',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: '**洋',
          sum: '4',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: '*w',
          sum: '2',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: 'Hanxi小毛怪',
          sum: '1',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: '浅念',
          sum: '1',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: 'Aliceshift',
          sum: '1',
          date: null,
        },
        {
          link: null,
          avatarUrl: 'https://yuanshen.site/juanzhu/User/XXMH.png',
          name: '**晗',
          sum: '1',
          date: null,
        },
        {
          link: null,
          avatarUrl: null,
          name: 'kmmmm',
          sum: '1',
          date: null,
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'uukong',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '运输队长常凯申',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '星星的祈愿',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '赛鹿鹿',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'adslgg1716',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '诶嘿',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '黑棉种植真君',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'qwertaswl',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '天蝎',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl:
            'https://pic1.爱赞助cdn.com/user/525b411ccc4a11ebbdd252540025c377/avatar/aa0b39c61cb64e1270e775f9db5f777a_w400_h400_s31.jpg?imageView2/1/w/120/h/120',
          name: '烟雨蒙蒙',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'aqua',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '诶嘿',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'gokoushiro',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'adslgg1716',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '爱发电用户_6Faj',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'jiujiezzz',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '爱发电用户_sqUS',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '爱发电用户_tVSC',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '原神醪',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '赛鹿鹿',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '道易',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'qwertaswl',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '秋东',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '星星的祈愿',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '凛夜',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '爱发电用户_ChqQ',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '运输队长常凯申',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '烟雨蒙蒙',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'revton',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'uukong',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'ZlCr',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '淘淘巷',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl:
            'https://pic1.爱赞助cdn.com/user/da6c907a80f911eba6db52540025c377/avatar/5eee20abfa813344afeb0f2f531a45da_w400_h400_s22.jpeg?imageView2/1/w/120/h/120',
          name: 'XIAOYAO',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '欧皇面',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'eleven',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '爱发电用户_FknQ',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: 'momocoo',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '墨大喵',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '背石头的猫',
          sum: 'unknown',
          date: 'unknown',
        },
        {
          platform: '爱赞助',
          link: null,
          avatarUrl: null,
          name: '黑棉种植真君',
          sum: 'unknown',
          date: 'unknown',
        },
      ].sort((x, y) => x.name.localeCompare(y.name))
    )

    return {
      items,
    }
  },
})
</script>

<style lang="scss" scoped>
.backers {
  margin-top: 22px;
  min-height: 100%;
  max-height: 750px;
  overflow-y: auto;
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
