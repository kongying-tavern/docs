---
home: true
title: HomePage
heroImage: /20210609/logo.jpg
actions:
  - text: Fast download
    link: ./download-client.html
    type: primary
  - text: Use Web
    link: https://yuanshen.site/
    type: secondary
footer: Chinese hoyolabMade By Kongying Tavern
---

<script setup>
import { onMounted, nextTick } from 'vue'
import { ElNotification } from 'element-plus';
onMounted(async () => {
  if(window.localStorage.getItem("QUESTIONNAIRE")) return;
  await nextTick();
  ElNotification({
    title: 'Questionnaire',
    duration: 6000,
    showClose: true,
    dangerouslyUseHTMLString: true,
    message: 'Fill out the questionnaire about the map to help us continue to optimize.<br/><a href="https://forms.gle/L9axyuNarT66wSwNA" target="_blank" rel="noopener noreferrer">https://forms.gle/L9axyuNarT66wSwNA</a>',
    position: 'top-right',
    offset: 20,
    onClose: () => {
      window.localStorage.setItem("QUESTIONNAIRE", "true");
    }
  })
})

</script>
