---
title: Télécharger le client
description: Actuellement, nous proposons uniquement la version Windows de notre client carte, des versions pour d'autres OS sont en cours.
aside: false
titleTemplate: :title | Kongying Tavern
---

# Télécharger le client

<LinkGrid :items="downloadMethod" />

::: tip
Actuellement, nous proposons uniquement la **Version Windows** de notre client, des versions pour d'autres OS sont en cours.

Si vous souhaitez contribuer au développement, pensez à [Nous Rejoindre!](./join.md)
:::

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

<script setup>
import { useUrlSearchParams } from '@vueuse/core'
import { onMounted } from 'vue'

const params = useUrlSearchParams('history')
const downloadMethod = [
  { id: 'discord', name: 'Discord', target: '_black', link: 'https://discord.com/invite/aFe57AKZUF', secondary: 'aFe57AKZUF', icon: 'i-logos-discord-icon' },
  { id:'gd', name: 'Google Drive', target: '_black', link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing', icon: 'i-logos-google-drive' }
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
