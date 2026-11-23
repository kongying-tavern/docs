---
title: 下载客户端
layout: doc
comment: true
---

## **Windows 客户端** <VPBadge type="tip" text="Rc" />

可选择下方任意方式下载

<LinkGrid :items="downloadMethod" />

如果您有兴趣参与地图的开发和维护，欢迎[加入我们](./join.md)参与其中~

::: details 客户端使用教程

::Card
---
title: Windows 客户端使用手册
logo: self
link: /manual/client/
theme: medium
---
::

::Card
---
title: 观看客户端基础使用教程
link: https://www.bilibili.com/video/BV1uU4y157Te
theme: medium
---
::

:::

## 网页地图

::Card
---
title: 网页地图 V3
logo: self
link: https://v3.yuanshen.site
theme: medium
---
::

<script setup lang="ts">
import { clientLink, useDownloadRedirect } from '@/src/features/links/Download.ts'

const downloadMethod = [
  clientLink('online', '在线安装器'),
  clientLink('sq', '加入社区'),
  clientLink('bd', '百度网盘'),
  clientLink('kk', '夸克网盘'),
  clientLink('ty', '天翼云盘', '访问码：exn0'),
  clientLink('gd', 'Google Drive'),
]

useDownloadRedirect(downloadMethod)
</script>
