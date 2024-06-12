---
title: 下载客户端
layout: doc
comment: true
---

## **Windows 客户端** <Badge type="warning" text="Beta" />

可选择下方任意方式下载

<LinkGrid :items="downloadMethod" />

如果您有兴趣参与地图的开发和维护，欢迎[加入我们](./join.md)参与其中~

> 温馨提示：目前地图 <span class="color-[var(--vp-badge-tip-text)]">移动端App</span> 仍在内部开发中，未以任何形式对外开放和授权下载或使用。
> 目前网络上任何所谓的地图移动端App均为第三方通过<span class="color-[var(--vp-c-red-3)]">盗用网页端进行套壳冒充</span>，安全性无法保证。欢迎各位小伙伴在社区联系管理员举报此类行为~

## 客户端使用教程

```card
title: Windows 客户端使用手册
logo: self
link: /manual/client/
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
import { clientLink, downloadJump } from '../components/links/Download.ts'

const params = useUrlSearchParams('history')
const downloadMethod = [
  clientLink('sq', '加入社区'),
  clientLink('bd', '百度网盘'),
  clientLink('kk', '夸克网盘'),
  clientLink('ty', '天翼云盘', '访问码：exn0'),
  clientLink('gd', 'Google Drive'),
]

onMounted(()=> {
  downloadJump(params, downloadMethod)
})
</script>
