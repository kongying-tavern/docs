---
aside: false
layout: doc
title: Position Tracker
---

[文：【自动更新】没有反应]: # 'https://support.qq.com/products/321980/faqs/102055'
[#]: # '仅 capabilities 内容来自原文，其余来自申讨反馈群群文件 位置追踪问题排查.docx 。'

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
- The Game in not under **exclusive fullscreen**, running [windowed fullscreen (Borderless)](./fullscreen-windowed.md)is recommended

Once Position Tracker is enabled, The **map client** will

- Display your UID at the lower right corner
- Automatically detect the current location of your character and display a simultaneous player indicator on the **map client**

![](/imgs/en/manual/auto-tracking/autotrackingegaged.png)

---

[见：位置追踪问题排查.docx]: # '以下为 位置追踪支持列表： 内容'

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
- **Fixed minimap** (under in-game GameGameplayplay settings)
- Windowed, and in some scenarios, exclusive fullscreen (see Troubleshooting Issue 4)

### In-progress

- Rotating minimap (under in-game Gameplay settings)
- Domains and indoor areas

### Will not support

Compensating for color distortions, which could be caused by:

- Third party color calibration
- Third party brightness adjustment
- Windows 11 Auto HDR (tested: reduced player heading accuracy)
- "Eye saver" features
- NVIDIA Freestyle Game Filters

**Position Tracker** may work with reduced accuracy or not at all.

---

[见：位置追踪问题排查.docx]: # '以下为 反馈问题前你需要知道的： 内容'

## Troubleshooting {#Troubleshooting}

Some facts to know before troubleshooting and submitting feedback:

1. Position Tracker is based on image recognition, it does not read or modify the game process, thus it brings no risk of an account ban.
2. The image recognition is not highly accurate, it's normal for the player indicator to shift sporadically. This cannot be resolved completely due to the limitations of the technology implemented.
3. Please check if your desired range of settings and feature is supported above.
4. The following troubleshooting files can help us identify an issue, please attach them with your feedback if possible:
   - Tracking log (autoTrack.log)
   - Tracking screenshot (Capture.png)

![](/imgs/en/manual/auto-tracking/7.png)

::: tip
You can visit the files' directory quickly through the **Position Tracker** settings.

![](/imgs/en/manual/auto-tracking/2.png)
:::

[反馈方式]: # '最适合目标语言用户的反馈方式'

Please go through the [potential Issues](#Troubleshooting) before posting in the [#feedback channel on Discord](https://discord.gg/8wgttNDwse). (you are welcomed ask any question in #chat)

[文：位置追踪问题排查.docx]: # '以下为 问题排查 内容'

## Troubleshooting

## 1. When **Position Tracker** is engaged, the in-game minimap does not show pins, nor is there an overlay of the map client {#issue1}

[#]: # '这里没有直接翻译，因英文用户大概率没有看过演示视频，未提及《天理地图》'

The **Position Tracker** feature cannot overlay the game window, you can use the Stay on Top feature to have a similar effect as the title describes.

[#]: # '因此在这链接了 reddit 上的演示'

Showcase：

```card
layout: doc
title: The Best Underground Map (Kongying Tavern x Teyvat Map Institute)

link: https://www.reddit.com/r/Genshin_Impact/comments/12znlyd/the_best_underground_map_kongying_tavern_x_teyvat/
theme: medium
```

## 2. Cannot download **Position Tracker** module, the download window flashes or the download speed is 0.00 kb/s {#issue2}

[#]: # '“请使用【群文件】的一键安装包手动安装” 的部分 替换 给了 dc 服务器里的下载频道'

There is a problem with our server, join our [Discord](https://discord.gg/S7MxgjcbtD) and download the module there. Once the installation finishes, restart the map client to load the module.

## 3. Receiving C++ Runtime error or client crashing after enabling **Position Tracker** {#issue3}

- Simply re-enable **Position Tracker**
- Clear the **Position Tracker** cache, launch the map client again and enable **Position Tracker**, you will need to wait for the cache to build again

[#]: # '这里更新了客户端内一键清理位置追踪缓存的步骤，而不是到安装目录里删除，因此图片不同'

![](/imgs/en/manual/auto-tracking/6.png)

[反馈方式]: # '最适合目标语言用户的反馈方式'

- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【启动位置追踪模块后软件崩溃】" in your message.

## 4. Nothing happens when **Position Tracker** is engaged {#issue4}

- When using a new version for the first time, the module requires 1-5 minutes to rebuild its cache. During this process, switching versions or using the tracking screenshot function may cause the client to stop responding. If no player indicator shows up after 10 minutes, or if it is not the initial activation of a new version, please refer to issues further down the list.
- Double-check if the **Position Tracker** is toggled on.
- Check the in-game minimap for obstructions, and ensure that it's displaying properly.
- Check the "DLL" version at the lower left corner of the map client. If it shows "Uninitialized", try restarting **Position Tracker**.

![](/imgs/en/manual/auto-tracking/3.png)
![](/imgs/en/manual/auto-tracking/4.png)
![](/imgs/en/manual/auto-tracking/5.png)

[#]: # '与第 3 步一样，更新了客户端内一键清理的步骤和图片'

If the problem persists, use [Clear Tracking Module] under the **Position Tracker** settings tab, which deletes all files in `%APPDATA%\..\LocalLow\空荧酒馆\Map\DLL`, and download the tracking module again.

![](/imgs/en/manual/auto-tracking/1.png)

- Use "Obtain Tracking Screenshot" in the **Position Tracker** settings, if the screenshot is blank, showing a non-current image of the game, or unsuccessful, please see Issue 5.
- If a normal screenshot is obtained, but no player indicator shows up, please see Issue 6.

## 5. Screenshot errors (Blank or non-current game image) {#issue5}

<span style="color: red">Some Windows 11 machines may not support BitBlt properly, switching the Tracking Mode to DirectX will likely solve the issue.</span>

- Try switching Tracking Modes (The modes differ only in capture method, there is no effect on tracking accuracy)
  - BitBlt supports both windowed and exclusive fullscreen game
  - DirectX supports windowed game only
- Try running the game windowed (**Alt+Enter**, game does not minimize when pressing **Win** key). If you want to play the game fullscreen, please refer to: [Launching The Game in Windowed Fullscreen (Borderless)](./fullscreen-windowed.md)
- To use BitBlt in Windows 11, go to the Graphics settings (Settings->System->Display->Graphics), add GenshinImpact.exe to the list (`***\Genshin Impact Game\GenshinImpact.exe`, not launcher.exe) and **enable** "Don't use optimizations for windowed games".

![](/imgs/en/manual/auto-tracking/windowedoptimization.png)

- Please message in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【位置追踪截图失败】" in your message.

## 6. The screenshot is normal, but the player indicator is not displayed or does not move {#issue6}

- Please try with a resolution greater than 720p.
- Auto HDR, some color calibration profiles, Game Filters, "eye savers", etc. can reduce tracking accuracy or prevent the **Position Tracker** from working.
- **Position Tracker** may not work properly with an aspect ratio greater than 21:9, switch to a 16:9 resolution and restart the game, if tracking functions properly in 16:9 only, reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) with a message including "【带鱼屏适配有问题】".
- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【位置追踪截图正常但无法追踪】" in your message.

## 7. Drifting player indicator {#issue7}

When the player indicator is at the wrong location, but moves with your in-game movement, clear the **Position Tracker** cache from the settings and restart **Position Tracker** to rebuild it. (see [**_Issue 3._**](#_3-receiving-c-runtime-error-or-client-crashing-after-enabling-auto-tracking))

## 8. Player indicator teleports or updates player movement slowly {#issue8}

Occasional teleportation skips of the player indicator cannot be avoided due to the nature of our image recognition algorithm, but you can reduce its occurrence and improve responsiveness with the following actions:

- Set the in-game minimap to "Fixed" (required)
- Use a game resolution greater than 720p
- Improve tracking accuracy by enabling anti-aliasing
- Reducing tracking interval when it does not impact performance too much
- Standing still for 3-10 seconds will allow the **Position Tracker** to recapture your location
- If the player indicator continues to skip around, teleport to a waypoint, if the tracking returns to normal, the previous location does not have enough features for the tracker to recognize. (e.g. on the sea, open desert, sand storms, masked and yet-to-unlock areas)

---

- Too many **in-game custom pins** will significantly reduce tracking accuracy. (e.g. Quest navigation, vendors, custom pins, etc.)
- Some areas can change appearance through world quest progression, **Position Tracker** compares the game image to the **final form** of the map. For **Position Tracker** to work accurately, please complete the related world quests. You can view the final form of the map in the map client. Areas that change:

| Khaj-Nisut                    | Safhe Shatranj          | Dunes of Steel    |
| ----------------------------- | ----------------------- | ----------------- |
| **The Sands of Three Canals** | **Wounded Shin Valley** | **Tunigi Hollow** |

- If teleportation persists, please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse), include "【全局追踪无法定位到正确的位置】" in your message.

[文：自动神瞳]: #

## ~~[Position Tracker] Oculus Tracking~~

Functioning principle:

- If an oculus indicator appears on the minimap, that oculus will be unmarked on the map client
- If an oculus indicator does not appear at the corresponding location on the minimap, that oculus will be marked as found

---

<p>Important Note: <span style="color: red">This feature is not 100% accurate. False positives can occur when oculi don't appear on the minimap because they are vertically distant, either in the air or under ground.</span></p>
