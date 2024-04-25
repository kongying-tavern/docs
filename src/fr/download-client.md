---
title: Télécharger le client
description: Actuellement, nous proposons uniquement la version Windows de notre client carte, des versions pour d'autres OS sont en cours.
aside: false
titleTemplate: :title - Client Manuals | Kongying Tavern
---

# Télécharger le client

Actuellement, nous proposons uniquement la **Version Windows** de notre client, des versions pour d'autres OS sont en cours.

<LinkGrid :items="downloadMethod" />

Si vous souhaitez contribuer au développement, pensez à [Nous Rejoindre!](./join.md)

```card
title: Manuel d'utilisation du client carte
link: /fr/manual/client-user-manual
theme: medium
```

## Version Web

```card
title: Site de la versions Web
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
