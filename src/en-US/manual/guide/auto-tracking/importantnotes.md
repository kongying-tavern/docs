---
aside: true
titleTemplate: ':title | Kongying Tavern'
prev:
  text: '目录'
  link: 'en/manual/client-user-manual'
next:
  text: '[Automatic Tracking] Troubleshooting'
  link: '../auto-tracking/troubleshoot'
description: This feature is based on image recognition
---

[文：【自动更新】没有反应]: # 'https://support.qq.com/products/321980/faqs/102055' [#]: # '仅 capabilities 内容来自原文，其余来自申讨反馈群群文件 自动追踪问题排查.docx 。''

# [Automatic Tracking] Introduction

本功能基于【图像识别】技术实现

## Capabilities {#capabilities}

- 可支持大部分原神客户端的匹配（包括但不限于中、韩、英）
- Functioning properly even when Windows system Scaling is not 100%
- 角度定位比以前更加精准
- 全地区追踪，包括渊下宫和地下矿区，但需先在客户端内切换至该地区

---

- 请确认：您的操作版本至少是 win10 或以上版本（win7 不支持追踪）
- 请确认：游戏内【解锁神像点亮地图】，游戏内【左上角小地图】完整。
- 请确认：游戏内【左上角小地图】中，无【任务坐标、范围】指引遮挡。
- The Game in not under **exclusive fullscreen**, running [windowed fullscreen (Borderless)](../overlay-mode/fullscreen-windowed/launching.md)is recommended

成功开启自动追踪后，

- Once automatic tracking is enabled, The **map client** will
- Automatically detect the current location of your character and display a simultaneous player indicator on the **map client**

![](/imgs/manual/auto-tracking/autotrackingegaged.png)

---
[见：自动追踪问题排查.docx]: # '以下为 自动追踪支持列表： 内容'

## 程序列表 {#Software}

### Supported

- Genshin Impact PC client running on Windows 10/11

### 不支持，但未来可能会适配

- 云·原神
- Windows 8.1 and earlier
- 手机，或 PS4/5 的投屏

### Will not support

- Non-Windows OS
- Android simulators
- Virtual machines

---

## 画面设置 {#Graphics}

### 支持（或部分支持）的画面设置

- 支持任意分辨率（建议不小于 1280x720）
- Any aspect ratio (recommended: 4:3 to 21:9)
- 支持手柄、键鼠
- Windowed, and in some scenarios, exclusive fullscreen (see Troubleshooting Issue 4)

### 不支持，但未来可能会适配

- 小地图仅支持锁定方向，不支持锁定玩家视角
- 不支持秘境，室内等有独立地图的区域

### Will not support

使用了可能会影响到屏幕色彩的软件，包括但不限于：

- Third party color calibration
- Third party brightness adjustment
- Windows 11 Auto HDR (tested: reduced player heading accuracy)
- 开启了护眼
- NVIDIA Freestyle Game Filters

---
[见：自动追踪问题排查.docx]: # '以下为 反馈问题前你需要知道的： 内容'

## 反馈问题前你需要知道的 {#Troubleshooting}

1. Automatic tracking is based on image recognition, it does not read or modify the game process, thus it brings no risk of an account ban.可以放心使用
2. 图像识别的准确度并不高，抖动和偶发的瞬移属于正常现象，这个属于图像识别本身的缺陷，无法完全解决
3. 在反馈之前，请确定使用的程序和画面设置在自动追踪支持列表之中
4. 在反馈问题前，请确保了解自动追踪产生的日志文件，以方便为开发组排查问题:
   - 追踪日志：可用记事本打开的文本文件（建议使用第三方文本编辑器，如 notepad3,vscode）
   - 追踪截图：png 图像，用来排查 UI 定位的问题。因为带有 Alpha 通道，所以可能会有很大的色差，用 PS 打开或者粘贴到 QQ 上既可正常显示游戏画面。

<span style="color: red">【注意】：如果反馈群要求发送追踪截图，请不要使用截图或者用 qq 的发送图片功能，必须要以文件的方式发送图像。可以将追踪截图的文件直接拖到聊天框来发送文件。</span>

![](/imgs/manual/auto-tracking/7.png)

::: tip
You can visit the files' directory quickly through the auto tracking settings.

![](/imgs/manual/auto-tracking/2.png)
:::
[反馈方式]: # '最适合目标语言用户的反馈方式'

### 请确保[问题排查](./troubleshoot.md)的措施都尝试过，依然没有解决问题后再尝试在[开发反馈 QQ 群：228382171](https://jq.qq.com/?_wv=1027&k=EqhYN9uI)反馈相关问题。
