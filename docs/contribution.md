---
title: 贡献鸣谢
description: 贡献鸣谢
sidebar: false
anchor: false
---

## 贡献鸣谢

空荧酒馆原神地图从 2020 年 6 月初制作决定开始至今已 <time> {{ date }} </time> 天，点位数据收集总耗时超两万个小时。

我们在此鸣谢每一位为地图做出贡献的小伙伴，感谢有你。

### 点位贡献

铃，Minazuki\*Chocola，丘丘人保护协会，AAAAAAAA，(\^\_^\)

等等...

<!-- <PointContribution></PointContribution> -->

### 翻译贡献

`英语翻译`

suizyun

`日语翻译`

壹団喵

`世界语翻译`

尉迟兰屏

<script setup>
import { ref } from 'vue';
import dayjs from 'dayjs';

const date = ref(dayjs().diff(dayjs('2020-06-1'), 'day'));
</script>
