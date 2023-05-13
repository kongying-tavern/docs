---
title: \[Background Usage] Framerate/Tracking Control
aside: false
titleTemplate: Kongying Tavern
prev:
  text: '[Automatic Tracking] Troubleshooting'
  link: '../auto-tracking/troubleshoot'
next:
  text: '[Multi Mark] Instructions'
  link: '../batch-selection/instructions'
---

# [Background Usage] Framerate/Tracking Control

## Framerate Control

[Foreground Frame Rate] and [Background Frame Rate] can be configured in the General settings, it is recommended to reduce resource utilization by setting [Foreground Frame Rate] to 30-50 fps and [Background Frame Rate] to 1-10 fps, thus minimizing fps loss in-game.

If you wish to use the [Stay on Top] feature, which pins the map client window on top despite being out of focus, it is recommended to match both frame rate settings' values.

![](/imgs/en/manual/bg-frate/1.png)

::: tip

Dragging the frame rate slider to the leftmost position will enable \[V-Sync], which matches the frame rate limit to your monitor's refresh rate.

![](/imgs/en/manual/bg-frate/2.png)

:::

## Tracking Interval

[Tracking Interval] can be found under [Automatic Tracking] settings, the unit of its value is **second**.

- Reducing [Tracking Interval] will increase CPU usage (minimum 0.1 sec);
- Increasing [Tracking Interval] will reduce CPU usage (maximum 1.0 sec), while reducing tracking responsiveness.

![](/imgs/en/manual/bg-frate/3.png)

## Background Suspend

[Background Suspend] will hold the client in stasis completely when it is not in the foreground, you can enable this feature at the bottom right of the map client.

Reduces resource utilization and impact on in-game framerate.

![](/imgs/en/manual/bg-frate/4.png)
