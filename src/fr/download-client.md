---
title: Télécharger le client
description: Actuellement, nous proposons uniquement la version Windows de notre client carte, des versions pour d'autres OS sont en cours.
aside: false
---

# Télécharger le client

Actuellement, nous proposons uniquement la **Version Windows** de notre client, des versions pour d'autres OS sont en cours.

<LinkGrid :items="downloadMethod" />

Si vous souhaitez contribuer au développement, pensez à [Nous Rejoindre!](./join.md)

```card
title: Manuel d'utilisation du client carte
link: /fr/manual/client
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
import { clientLink, downloadJump } from '../components/links/Download.ts'

const params = useUrlSearchParams('history')
const downloadMethod = [
  clientLink('sq', 'Communautés'),
  clientLink('gd', 'Google Drive'),
]

onMounted(()=> {
  downloadJump(params, downloadMethod)
})
</script>
