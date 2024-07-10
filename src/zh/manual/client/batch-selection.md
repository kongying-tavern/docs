---
layout: doc
title: 批量选择
---

- {red}(右键单击)某个点位，将直接转换 **{green}(完成)/{red}(未标记)** 状态
- {red}(按住右键划过)点位，将直接将划过的点位标记为 **{green}(已完成)** 状态
- 按住{red}(左 Alt+右键划过)点位，将直接将划过的点位标记为 **{red}(未标记)** 状态
- 按住{red}(左 Ctrl+右键框选)点位，将直接将框选的所有点位标记为 **{green}(已完成)** 状态
- 按住{red}(左 Ctrl+左 Alt+右键框选)点位，将直接将框选的所有点位标记为 **{red}(未标记)** 状态

## **详细说明** {#instruction}

### 多选方式一：点选 {#dot}

- 右键点击 **{red}(未完成)** 点位，未完成点位将切换为 **{green}(已完成)** 状态；
- 右键点击 **{green}(已完成)** 点位，未完成点位将切换为 **{red}(未完成)** 状态。

![点选](/imgs/zh/manual/client/batch-selection/BS-01-Dot.gif)

### 多选方式二：滑动选择 {#swipe}

- 按下鼠标右键，滑过相应的点位， **{red}(未完成)** 的点位会被标记为 **{green}(已完成)** ，已完成的点位不会改变。

![滑动选择 - 标记](/imgs/zh/manual/client/batch-selection/BS-02.1-Swipe-On.gif)

- 按下左 Alt+鼠标右键，滑过相应点位， **{green}(已完成)** 的点位会被标记为 **{red}(未完成)** ，未完成的点位不会改变。

![滑动选择 - 取消标记](/imgs/zh/manual/client/batch-selection/BS-02.2-Swipe-Off.gif)

### 多选方式三：框选 {#box}

- 按下 Ctrl+鼠标右键，开始拖动，松开鼠标右键后，选框中 **{red}(未完成)** 的点位会被标记为 **{green}(已完成)** ，已完成的点位不会改变。

![框选 - 标记](/imgs/zh/manual/client/batch-selection/BS-03.1-Box-On.gif)

- 按下 Ctrl+左 Alt+鼠标右键，开始拖动，松开鼠标右键后，选框中 **{red}(未完成)** 的点位会被标记为 **{green}(已完成)** ，未完成的点位不会改变。

![框选 - 取消标记](/imgs/zh/manual/client/batch-selection/BS-03.2-Box-Off.gif)
