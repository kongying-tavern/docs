---
title: ダウンロード
layout: doc
aside: false
comment: true
pageClass: download-client
---

## **Windows クライアント** <VPBadge type="warning" text="Beta" />

以下のいずれかの方法でダウンロードできます

<LinkGrid :items="downloadMethod" />

原神マップ開発に興味がある方は是非[ご参加ください(^_^)](./join.md)

::: details クライアントの使い方

```card
title: Windows クライアントマニュアル
logo: self
link: /ja/manual/client/
theme: medium
```

```card
title: クライアントの基本的な使い方チュートリアル
link: https://www.bilibili.com/video/BV1uU4y157Te
theme: medium
```

:::

## Web 版

```card
title: Web版マップ V3
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
  clientLink('sq', 'Community'),
  clientLink('bd', '百度网盘'),
  clientLink('kk', 'Quark Drive'),
  clientLink('ty', '天翼云盘', 'アクセスコード：exn0'),
  clientLink('gd', 'Google Drive'),
]

onMounted(()=> {
  downloadJump(params, downloadMethod)
})
</script>
