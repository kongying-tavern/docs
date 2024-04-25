---
title: Download Client
layout: doc
description: Currently we only offer the Windows Version of our map client, versions in other OS are in progress.
aside: false
titleTemplate: :title | Kongying Tavern
---

## Windows Clinet <Badge type="warning" text="Beta" />

<LinkGrid :items="downloadMethod" />

If you are interested in aiding our development, consider [Join Us](./join)

## Map Client User Manual

```card
title: Map Client User Manual
link: /en/manual/client-user-manual
theme: medium
```

## Web Version

```card
title: Web Version Portal
link: https://yuanshen.site
theme: medium
```

<script setup lang="ts">
import { useUrlSearchParams } from '@vueuse/core'
import { onMounted } from 'vue'
import { clientMap, downloadJump } from '../components/Download.ts'

const params = useUrlSearchParams('history')
const downloadMethod = [
  clientMap.sq
  clientMap.gd
]

onMounted(()=> {
  downloadJump(params, downloadMethod)
})
</script>
