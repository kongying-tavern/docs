---
title: Download Client
layout: doc
aside: false
---

## Windows Client <Badge type="warning" text="Beta" />

Currently we only offer the Windows Version of our map client, versions in other OS are in progress.

<LinkGrid :items="downloadMethod" />

If you are interested in aiding our development, consider [Join Us](./join)

## Map Client User Manual

```card
title: Map Client User Manual
link: /en/manual/client/
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
import { clientLink, downloadJump } from '../components/links/Download.ts'

const params = useUrlSearchParams('history')
const downloadMethod = [
  clientLink('sq', 'Community'),
  clientLink('gd', 'Google Drive'),
]

onMounted(()=> {
  downloadJump(params, downloadMethod)
})
</script>
