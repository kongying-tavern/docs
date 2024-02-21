---
title: 下载客户端
description:
titleTemplate: 空荧酒馆
banner: 位置追踪服务器维护中，如需启用位置追踪请前往链接手动下载 <a href="http://a6t.cn/fa565" target="_black">http://a6t.cn/fa565</a>（提取码：KYJG）
bannerExpiryDate: 2024/2/15
comment: true
---

## **Windows 客户端** <Badge type="warning" text="Beta" />

可选择下方任意方式下载

<LinkGrid :items="downloadMethod" />

如果您有兴趣参与地图的开发和维护，欢迎[加入我们](./join.md)参与其中~

## 客户端使用教程

```card
title: Windows 客户端使用手册
logo: self
link: ./manual/client-user-manual
theme: medium
```

```card
title: 观看客户端基础使用教程
link: https://www.bilibili.com/video/BV1uU4y157Te
theme: medium
```

## 网页版地图

```card
title: 网页版地图 V3
logo: self
link: https://v3.yuanshen.site
theme: medium
```

<script setup>
import { useUrlSearchParams } from '@vueuse/core'
import { onMounted } from 'vue'
import { isNumber } from '../.vitepress/theme/utils'

const params = useUrlSearchParams('history')
const downloadMethod = [
  { id:'sq', name: '加入社区', target: '_self', link: './community', icon: '/imgs/logo_256.png' },
  { id:'bd', name: '百度网盘', target: '_blank', link: 'https://pan.baidu.com/s/1mrU_bkqcpcdjeKPUCzMNDQ?pwd=kyjg', icon: '/svg/baidu-drive.svg' 
  },
  { id: 'kk', name: '夸克网盘', target: '_blank', link: 'https://pan.quark.cn/s/fe8bb34c77bc', icon: '/svg/quark-drive.svg' 
  },
  { id: 'ty', name: '天翼云盘', secondary: '访问码：exn0', target: '_blank', link: 'https://cloud.189.cn/t/YF7Fj2zIRVbi', icon: '/svg/tianyi-drive.svg' 
  },
  { id:'gd', name: 'Google Drive', target: '_blank', link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing', icon: 'i-logos-google-drive' }
]

function jump() {
    const target = String(params.q).toLocaleLowerCase()

    downloadMethod.forEach((val) => {
      if (val.id === target) {
        location.href = val.link
      }
    })
}

onMounted(()=> {
  jump()
})
</script>
