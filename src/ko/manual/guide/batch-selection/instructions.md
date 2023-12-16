---
aside: false
titleTemplate: ':title | 空荧酒馆'
prev:
  text: '【地图性能占用高】前后台帧率设置'
  link: '../bg/bgfrate'
next:
  text: '【画板】路线功能教程'
  link: '../canvas/guide'
description: 应旅行者需求，现已将多选功能加入豪华午餐！
---

# 【批量选择】使用说明

应旅行者需求，现已将多选功能加入豪华午餐！

- <span style="color: red">右键单击</span>某个点位，将直接转换 **<span style="color: green">完成</span>/<span style="color: red">未标记</span>** 状态
- <span style="color: red">按住右键划过</span>点位，将直接将划过的点位标记为 **<span style="color: green">已完成</span>** 状态
- 按住<span style="color: red">左 Alt+右键划过</span>点位，将直接将划过的点位标记为 **<span style="color: red">未标记</span>** 状态
- 按住<span style="color: red">左 Ctrl+右键框选</span>点位，将直接将框选的所有点位标记为 **<span style="color: green">已完成</span>** 状态
- 按住<span style="color: red">左 Ctrl+左 Alt+右键框选</span>点位，将直接将框选的所有点位标记为 **<span style="color: red">未标记</span>** 状态

## **详细说明** {#instruction}

### 多选方式一：点选 {#s1}

- 右键点击 **<span style="color: red">未完成</span>** 点位，未完成点位将切换为 **<span style="color: green">已完成</span>** 状态；
- 右键点击 **<span style="color: green">已完成</span>** 点位，未完成点位将切换为 **<span style="color: red">未完成</span>** 状态。

![](/imgs/manual/batch-selection/BS-demo1-CN.gif "右键点选")

### 多选方式二：滑动选择 {#s2}

- 按下鼠标右键，滑过相应的点位， **<span style="color: red">未完成</span>** 的点位会被标记为 **<span style="color: green">已完成</span>** ，已完成的点位不会改变。

![](/imgs/manual/batch-selection/BS-demo2-CN.gif "右键滑动 - 标记")

- 按下左 Alt+鼠标右键，滑过相应点位， **<span style="color: green">已完成</span>** 的点位会被标记为 **<span style="color: red">未完成</span>** ，未完成的点位不会改变。

![](/imgs/manual/batch-selection/BS-demo3-CN.gif "右键滑动 - 取消标记")

### 多选方式三：框选 {#s3}

- 按下 Ctrl+鼠标右键，开始拖动，松开鼠标右键后，选框中 **<span style="color: red">未完成</span>** 的点位会被标记为 **<span style="color: green">已完成</span>** ，已完成的点位不会改变。

![](/imgs/manual/batch-selection/BS-demo4-CN.gif "右键框选 - 标记")

- 按下 Ctrl+左 Alt+鼠标右键，开始拖动，松开鼠标右键后，选框中 **<span style="color: red">未完成</span>** 的点位会被标记为 **<span style="color: green">已完成</span>** ，未完成的点位不会改变。

![](/imgs/manual/batch-selection/BS-demo5-CN.gif "右键框选 - 取消标记")
