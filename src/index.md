---
layout: home
title: 原神地图
titleTemplate: 首页
hero:
  name: 原神地图
  text: 空荧酒馆制作的原神全资源攻略地图。
  tagline: Simple, powerful, and performant.
  actions:
    - theme: brand
      text: 立即下载
      link: ./download-client.html
    - theme: alt
      text: View on GitHub
      link: https://github.com/kongying-tavern/docs
features:
  - title: 强大功能
    details: 您可以通过原神地图客户端获得所有功能 - 多样的功能、更加享受便捷，使探索大世界变得更加得心应手。
  - title: 简单易用
    details: 一切都刚刚好。
  - title: 完全免费
    details: 原神地图是使用 MulanPSL-1.0 许可的开源项目，使用完全免费并且无广告。
footer: MIT Licensed | Made by Kongying Tavern
---

<script setup lang='ts'>
onMounted(()=> {
  if (/windows|win32/i.test(navigator.userAgent)) return;
  const mainBtn = document.querySelector('#VPContent > div > div.VPHero.VPHomeHero > div > div > div > div:nth-child(1) > a');
  mainBtn.textContent = '立即体验';
  mainBtn.href = 'https://yuanshen.site/'
})
</script>
