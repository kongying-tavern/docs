---
title: Download Client
description: Actuellement, nous proposons uniquement la version Windows de notre client carte, des versions pour d'autres OS sont en cours.
aside: false
titleTemplate: :title | Kongying Tavern
---

# Télécharger le client


<LinkGrid :items="downloadMethod" />

::: tip
Actuellement, nous proposons uniquement la **Version Windows** de notre client, des versions pour d'autres OS sont en cours.

Si vous souhaitez contribuer au développement, pensez à Nous Rejoindre (^\_^)](./join)
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
  { id:'sq', name: 'Rejoignez la communauté', target: '_self', link: './community', icon: '/imgs/logo_256.png' },
  { id:'gd', name: 'Google Drive', target: '_black', link: 'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing', icon: 'i-logos-google-drive' },
  { id:'bd', name: 'Baidu Drive (Chinois)', target: '_black', link: 'https://pan.baidu.com/s/1mrU_bkqcpcdjeKPUCzMNDQ?pwd=kyjg', icon: '/svg/baidu-drive.svg' 
  },
  { id: 'kk', name: 'Quark Drive (Chinois)', target: '_black', link: 'https://pan.quark.cn/s/fe8bb34c77bc', icon: '/svg/quark-drive.svg' 
  },
  { id: 'ty', name: 'Tianyi Cloud (Chinois)', secondary: '访问码：exn0', target: '_black', link: 'https://cloud.189.cn/t/YF7Fj2zIRVbi', icon: '/svg/tianyi-drive.svg' 
  }
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
