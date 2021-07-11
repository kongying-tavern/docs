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
import { onMounted } from 'vue'
import { ElNotification } from 'element-plus';

onMounted(()=>{
  if(window.localStorage.getItem("QUESTIONNAIRE")) return;
  setTimeout(()=>{
    ElNotification({
      title: 'Questionnaire',
      duration: 5000,
      showClose: true,
      dangerouslyUseHTMLString: true,
      message: 'Fill out the questionnaire about the map to help us continue to optimize.<br/><a href="https://forms.gle/L9axyuNarT66wSwNA" target="_blank" rel="noopener noreferrer">https://forms.gle/L9axyuNarT66wSwNA</a>',
      position: 'bottom-right',
      onClose: () => {
        window.localStorage.setItem("QUESTIONNAIRE", "true");
      }
    })
  }, 1000);
})

</script>
