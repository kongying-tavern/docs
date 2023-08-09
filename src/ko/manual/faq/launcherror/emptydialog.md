---
titleTemplate: :title | 空荧酒馆
description: 分为3种情况
banner: 죄송합니다. 이 페이지 번역은 아직 진행 중입니다
---

[文：【无法打开】空窗提示或卡进度条]: # 'https://support.qq.com/products/321980/faqs/99662'

# 【无法打开】空窗提示或卡进度条

分为 3 种情况

1. 第一种，卡在 0%，且弹窗空提示

![](/imgs/ko/manual/launcherror/1.png)

这种情况是防火墙阻止了接口请求，退出防火墙即可解决（特别是 360）。

2. 第二种，卡在 0%，无提示

![](/imgs/ko/manual/launcherror/2.jpeg)

这种情况是缓存文件损坏了，前往如下地址删除 PlayerPrefs.json 即可解决。

![](/imgs/ko/manual/launcherror/3.png)

3. 第三种，卡在 100%，无提示，是 1.11 版本的 bug，属于登录模块的 bug，解决方法同第二种。
