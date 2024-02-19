---
description: Currently we only offer the Windows Version of our map client, versions in other OS are in progress.
aside: false
titleTemplate: :title | Kongying Tavern
---

# Download Client

Currently we only offer the **Windows Version** of our map client, versions in other OS are in progress.

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

<script setup>
import { useUrlSearchParams } from '@vueuse/core'
import { onMounted } from 'vue'
import { isNumber } from '../../.vitepress/theme/utils'

const downloadMethod = [
  { id:'sq', name: 'Discord', target: '_self', link: 'https://discord.gg/aFe57AKZUF', icon: 'i-logos-discord-icon' },
  { id:'gd', name: 'Google Drive', target: '_blank', link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing', icon: 'i-logos-google-drive' }
]
</script>
