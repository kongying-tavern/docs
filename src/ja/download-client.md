---
title: ダウンロード
description: ダウンロード
titleTemplate: 空蛍酒場
layout: doc
banner: 位置追踪服务器维护中，如需启用位置追踪请前往链接手动下载 <a href="http://a6t.cn/fa565" target="_black">http://a6t.cn/fa565</a>（提取码：KYJG）
bannerExpiryDate: 2024/2/15
aside: false
comment: true
---

# download-client

当前提供地图 **Windows 客户端（Beta）** 客户端下载

可选择下方任意方式下载

<LinkGrid :items="downloadMethod" />

原神マップ開発に興味がある方は是非[ご参加ください(^\_^)](./join.md)
:::

## 客户端使用教程

```card
title: 客户端使用手册
link: ./manual/client-user-manual
theme: medium
```

```card
title: マニュアル
link: /ja/manual/client-user-manual
theme: medium
```

## 网页版地图

```card
title: Web版マップ
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
