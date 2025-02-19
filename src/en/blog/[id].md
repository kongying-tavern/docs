---
docInfo: false
layout: Post
outline: false
aside: false
docHeader: false
---

<script setup>
import { withBase, useData } from 'vitepress'

const { params } = useData()

if(params.value?.rewriteUrl) {
  history.replaceState({}, '', withBase(params.value?.rewriteUrl))
}
</script>

<!-- @content -->
