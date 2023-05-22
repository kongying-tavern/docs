---
title: \[Automatic Tracking] Important Notes
aside: true
titleTemplate: Kongying Tavern
prev:
  text: 'Table of Contents'
  link: 'en/manual/client-user-manual'
next:
  text: '[Automatic Tracking] Troubleshooting'
  link: '../auto-tracking/troubleshoot'
description: This feature is based on image recognition
---

[文：【自动更新】没有反应]: # 'https://support.qq.com/products/321980/faqs/102055'
[仅 capabilities 内容来自原文，其余来自申讨反馈群群文件 自动追踪问题排查.docx 。]: #

# [Automatic Tracking] Introduction

This feature is based on **image recognition**

## Capabilities {#capabilities}

- Support for most languages (Not limited to Chinese, Korean, and English)
- Functioning properly even when Windows system Scaling is not 100%
- Accurate player heading detection
- Functional in all regions, including Enkanomia and Chasm: Underground Mines when the client is displaying them

---

The following are the requirements for this feature:

- Windows 10 or above
- The map is unmasked by unlocking the Statues of Seven, and the **minimap** is complete
- The **minimap** contains no **custom waypoints** or **highlighted regions**

Once automatic tracking is enabled, The **map client** will

- Display your UID at the lower right corner
- Automatically detect the current location of your character and display a simultaneous player indicator on the **map client**

![](/imgs/en/manual/auto-tracking/autotrackingegaged.png)

---

[见：自动追踪问题排查.docx]: # '以下为 自动追踪支持列表： 内容'

## Software Support {#Software}

### Supported

- Genshin Impact PC client running on Windows 10/11

### In-progress

- Cloud gaming
- Windows 8.1 and earlier
- Remote play/casting from other devices

### Will not support

- Non-Windows OS
- Android simulators
- Virtual machines

---

## Graphics Support {#Graphics}

### Supported

- Any resolution (recommended: 720p or greater)
- Any aspect ratio (recommended: 4:3 to 21:9)
- Any input device
- **Fixed minimap** (under in-game Gamplay settings)
- Windowed, and in some scenarios, exclusive fullscreen (see Troubleshooting Issue 4)

### In-progress

- Rotating minimap (under in-game Gamplay settings)
- Domains and indoor areas

### Will not support

Compensating for color distortions, which could be caused by:

- Third party color calibration
- Third party brightness adjustment
- Windows 11 Auto HDR (tested: reduced player heading accuracy)
- "Eye saver" features
- NVIDIA Freestyle Game Filters

Auto tracking may work with reduced accuracy or not at all.

---

[见：自动追踪问题排查.docx]: # '以下为 反馈问题前你需要知道的： 内容'

## Troubleshooting {#Troubleshooting}

Some facts to know before troubleshooting and submitting feedback:

1. Automatic tracking is based on image recognition, it does not read or modify the game process, thus it brings no risk of an account ban.
2. The image recognition is not highly accurate, it's normal for the player indicator to shift sporadically. This cannot be resolved completely due to the limitations of the technology implemented.
3. Please check if your desired range of settings and feature is supported above.
4. The following troubleshooting files can help us identify an issue, please attach them with your feedback if possible:
   - Tracking log (autoTrack.log)
   - Tracking screenshot (Capture.png)

![](/imgs/en/manual/auto-tracking/7.png)

::: tip
You can visit the files' directory quickly through the auto tracking settings.

![](/imgs/en/manual/auto-tracking/2.png)
:::

[反馈方式]: # '最适合目标语言用户的反馈方式'

Please go through the [potential Issues](./troubleshoot.md) before posting in the [#feedback channel on Discord](https://discord.gg/8wgttNDwse). (you are welcomed ask any question in #chat)
