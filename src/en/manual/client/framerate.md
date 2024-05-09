---
aside: false
layout: doc
title: Framerate/Tracking Control
---

[文：【地图性能占用高】前后台帧率设置]: # 'https://support.qq.com/products/321980/faqs/97183'
[#]: # '最后加入后台暂停的介绍'

## Framerate Control

[Foreground Frame Rate] and [Background Frame Rate] can be configured in the General settings, it is recommended to reduce resource utilization by setting [Foreground Frame Rate] to 30-50 fps and [Background Frame Rate] to 1-10 fps, thus minimizing fps loss in-game.

If you wish to use the [Stay on Top] feature, which pins the map client window on top despite being out of focus, it is recommended to match both frame rate settings' values.

![](/imgs/en/manual/bg-frate/1.png)

::: tip

Dragging the frame rate slider to the leftmost position will enable \[V-Sync], which matches the frame rate limit to your monitor's refresh rate.

![](/imgs/en/manual/bg-frate/2.png)

:::

## Tracking Interval

[Tracking Interval] can be found under [Position Tracker] settings, the unit of its value is **second**.

- Reducing [Tracking Interval] will increase CPU usage (minimum 0.1 sec);
- Increasing [Tracking Interval] will reduce CPU usage (maximum 1.0 sec), while reducing tracking responsiveness.

![](/imgs/en/manual/bg-frate/3.png)

[#]: # '兔小巢上后台暂停的介绍'

## Background Suspend

[Background Suspend] will hold the client in stasis completely when it is not in the foreground, you can enable this feature at the bottom right of the map client.

Reduces resource utilization and impact on in-game framerate.

![](/imgs/en/manual/bg-frate/4.png)
