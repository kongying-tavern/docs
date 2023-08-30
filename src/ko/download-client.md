---
title: 下载客户端
description: 下载客户端
titleTemplate: 空荧酒馆
layout: doc
aside: false
comment: true
---

# 下载地图客户端

当前提供地图 **`Windows 客户端（Beta）`** 客户端下载

可选择下方任意方式下载

<LinkGrid :items="downloadMethod" />

如果您有兴趣参与地图的开发和维护，欢迎[加入我们](./join.md)参与其中~

## 客户端使用教程

```card
title: 客户端使用手册
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
link: https://v3.yuanshen.site
theme: medium
```

<script setup>
const downloadMethod = [
  { name: '加入社区', target: '_self', link: './community', icon: '/imgs/logo_256.png' },
  { name: '百度网盘', target: '_black', link: 'https://pan.baidu.com/s/1mrU_bkqcpcdjeKPUCzMNDQ?pwd=kyjg', icon: '/svg/baidu-drive.svg' 
  },
  { name: '夸克网盘', target: '_black', link: 'https://pan.quark.cn/s/fe8bb34c77bc', icon: '/svg/quark-drive.svg' 
  },
  { name: '天翼云盘', secondary: '访问码：exn0', target: '_black', link: 'https://cloud.189.cn/t/YF7Fj2zIRVbi', icon: '/svg/tianyi-drive.svg' 
  },
  { name: 'Google Drive', target: '_black', link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing', icon: 'i-logos-google-drive' }
]
</script>
