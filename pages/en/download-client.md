---
title: Download Client
layout: doc
aside: false
---

## Windows Client <VPBadge type="tip" text="Rc" />

Currently we only offer the Windows Version of our map client, versions in other OS are in progress.

<LinkGrid :items="downloadMethod" />

If you are interested in aiding our development, consider [Join Us](./join)

## Map Client User Manual

::Card
---
title: Map Client User Manual
link: /en/manual/client/
theme: medium
---
::

## Web Version

::Card
---
title: Web Version Portal
link: https://yuanshen.site
theme: medium
---
::

<script setup lang="ts">
import { clientLink, useDownloadRedirect } from '@/src/features/links/Download'

const downloadMethod = [
  clientLink('sq', 'Community'),
  clientLink('gd', 'Google Drive'),
]

useDownloadRedirect(downloadMethod)
</script>
