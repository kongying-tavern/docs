---
layout: doc
title: 批量选择
---

## 批量选择是什么？ {#intro}

“批量选择”是一个用于快速切换点位{green}(已完成)/{red}(未完成)状态的功能。

根据具体的操作行为，可以将其分为单选模式与多选模式。

## 单选模式 {#single-selection}

### 点选 {#dot}

- 右键点击 **{red}(未完成)** 点位，未完成点位将切换为 **{green}(已完成)** 状态；
- 右键点击 **{green}(已完成)** 点位，未完成点位将切换为 **{red}(未完成)** 状态。

![点选](/imgs/zh/manual/client/batch-selection/BS-01-Dot.gif)

## 多选模式 {#multiple-selection}

### 滑动选择 {#swipe}

- 按下鼠标右键，滑过相应的点位， **{red}(未完成)** 的点位会被标记为 **{green}(已完成)** ，已完成的点位不会改变。

![滑动选择 - 标记](/imgs/zh/manual/client/batch-selection/BS-02.1-Swipe-On.gif)

- 按下左 Alt+鼠标右键，滑过相应点位， **{green}(已完成)** 的点位会被标记为 **{red}(未完成)** ，未完成的点位不会改变。

![滑动选择 - 取消标记](/imgs/zh/manual/client/batch-selection/BS-02.2-Swipe-Off.gif)

### 框选 {#box}

- 按下 Ctrl+鼠标右键，开始拖动，松开鼠标右键后，选框中 **{red}(未完成)** 的点位会被标记为 **{green}(已完成)** ，已完成的点位不会改变。

![框选 - 标记](/imgs/zh/manual/client/batch-selection/BS-03.1-Box-On.gif)

- 按下 Ctrl+左 Alt+鼠标右键，开始拖动，松开鼠标右键后，选框中 **{red}(未完成)** 的点位会被标记为 **{green}(已完成)** ，未完成的点位不会改变。

![框选 - 取消标记](/imgs/zh/manual/client/batch-selection/BS-03.2-Box-Off.gif)
