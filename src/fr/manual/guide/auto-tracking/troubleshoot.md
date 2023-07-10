---
aside: true
titleTemplate: :title | Kongying Tavern
prev:
  text: '[Automatic Tracking] Important Notes'
  link: '../auto-tracking/importantnotes'
next:
  text: '[Background Usage] Framerate/Tracking Control'
  link: '../bg/bgfrate'
description: Troubleshoot
---

::: info
Désolé, la traduction de cette page est toujours en cours
:::

[文：自动追踪问题排查.docx]: # '以下为 问题排查 内容'

# [Automatic Tracking] Troubleshooting

## 1. When auto tracking is engaged, the in-game minimap does not show pins, nor is there an overlay of the map client {#issue1}

[#]: # '这里没有直接翻译，因英文用户大概率没有看过演示视频，未提及《天理地图》'

The auto tracking feature cannot overlay the game window, you can use the Stay on Top feature to have a similar effect as the title describes.

[#]: # '因此在这链接了 reddit 上的演示'

Showcase：

```card
title: The Best Underground Map (Kongying Tavern x Teyvat Map Institute)

link: https://www.reddit.com/r/Genshin_Impact/comments/12znlyd/the_best_underground_map_kongying_tavern_x_teyvat/
theme: medium
```

## 2. Cannot download auto tracking module, the download window flashes or the download speed is 0.00 kb/s {#issue2}

[#]: # '“请使用【群文件】的一键安装包手动安装” 的部分 替换 给了 dc 服务器里的下载频道'

There is a problem with our server, join our [Discord](https://discord.gg/S7MxgjcbtD) and download the module there. Once the installation finishes, restart the map client to load the module.

## 3. Receiving C++ Runtime error or client crashing after enabling auto tracking {#issue3}

- Simply re-enable auto tracking
- Clear the auto tracking cache, launch the map client again and enable auto tracking, you will need to wait for the cache to build again

[#]: # '这里更新了客户端内一键清理自动追踪缓存的步骤，而不是到安装目录里删除，因此图片不同'

![](/imgs/fr/manual/auto-tracking/6.png)

[反馈方式]: # '最适合目标语言用户的反馈方式'

- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【启动自动追踪模块后软件崩溃】" in your message.

## 4. Nothing happens when auto tracking is engaged {#issue4}

- When using a new version for the first time, the module requires 1-5 minutes to rebuild its cache. During this process, switching versions or using the tracking screenshot function may cause the client to stop responding. If no player indicator shows up after 10 minutes, or if it is not the initial activation of a new version, please refer to issues further down the list.
- Double-check if the auto tracker is toggled on.
- Check the in-game minimap for obstructions, and ensure that it's displaying properly.
- Check the "DLL" version at the lower left corner of the map client. If it shows "Uninitialized", try restarting auto tracking.

![](/imgs/fr/manual/auto-tracking/3.png)
![](/imgs/fr/manual/auto-tracking/4.png)
![](/imgs/fr/manual/auto-tracking/5.png)

[#]: # '与第 3 步一样，更新了客户端内一键清理的步骤和图片'

If the problem persists, use [Clear Tracking Module] under the auto tracking settings tab, which deletes all files in `%APPDATA%\..\LocalLow\空荧酒馆\Map\DLL`, and download the tracking module again.

![](/imgs/fr/manual/auto-tracking/1.png)

- Use "Obtain Tracking Screenshot" in the auto tracking settings, if the screenshot is blank, showing a non-current image of the game, or unsuccessful, please see Issue 5.
- If a normal screenshot is obtained, but no player indicator shows up, please see Issue 6.

## 5. Screenshot errors (Blank or non-current game image) {#issue5}

<span style="color: red">Some Windows 11 machines may not support BitBlt properly, switching the Tracking Mode to DirectX will likely solve the issue.</span>

- Try switching Tracking Modes (The modes differ only in capture method, there is no effect on tracking accuracy)
  - BitBlt supports both windowed and exclusive fullscreen game
  - DirectX supports windowed game only
- Try running the game windowed (**Alt+Enter**, game does not minimize when pressing **Win** key). If you want to play the game fullscreen, please refer to: [Launching The Game in Windowed Fullscreen (Borderless)](../overlay-mode/fullscreen-windowed/launching.md)
- To use BitBlt in Windows 11, go to the Graphics settings (Settings->System->Display->Graphics), add GenshinImpact.exe to the list (`***\Genshin Impact Game\GenshinImpact.exe`, not launcher.exe) and **enable** "Don't use optimizations for windowed games".

![](/imgs/fr/manual/auto-tracking/windowedoptimization.png)

- Please message in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【自动追踪截图失败】" in your message.

## 6. The screenshot is normal, but the player indicator is not displayed or does not move {#issue6}

- Please try with a resolution greater than 720p.
- Auto HDR, some color calibration profiles, Game Filters, "eye savers", etc. can reduce tracking accuracy or prevent the auto tracker from working.
- Auto tracking may not work properly with an aspect ratio greater than 21:9, switch to a 16:9 resolution and restart the game, if tracking functions properly in 16:9 only, reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) with a message including "【带鱼屏适配有问题】".
- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【自动追踪截图正常但无法追踪】" in your message.

## 7. Drifting player indicator {#issue7}

When the player indicator is at the wrong location, but moves with your in-game movement, clear the auto tracking cache from the settings and restart auto tracking to rebuild it. (see [**_Issue 3._**](#_3-receiving-c-runtime-error-or-client-crashing-after-enabling-auto-tracking))

## 8. Player indicator teleports or updates player movement slowly {#issue8}

Occasional teleportation skips of the player indicator cannot be avoided due to the nature of our image recognition algorithm, but you can reduce its occurrence and improve responsiveness with the following actions:

- Set the in-game minimap to "Fixed" (required)
- Use a game resolution greater than 720p
- Improve tracking accuracy by enabling anti-aliasing
- Reducing tracking interval when it does not impact performance too much
- Standing still for 3-10 seconds will allow the auto tracker to recapture your location
- If the player indicator continues to skip around, teleport to a waypoint, if the tracking returns to normal, the previous location does not have enough features for the tracker to recognize. (e.g. on the sea, open desert, sand storms, masked and yet-to-unlock areas)

---

- Too many **in-game custom pins** will significantly reduce tracking accuracy. (e.g. Quest navigation, vendors, custom pins, etc.)
- Some areas can change appearance through world quest progression, auto tracking compares the game image to the **final form** of the map. For auto tracking to work accurately, please complete the related world quests. You can view the final form of the map in the map client. Areas that change:

| Khaj-Nisut                    | Safhe Shatranj          | Dunes of Steel    |
| ----------------------------- | ----------------------- | ----------------- |
| **The Sands of Three Canals** | **Wounded Shin Valley** | **Tunigi Hollow** |

- If teleportation persists, please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse), include "【全局追踪无法定位到正确的位置】" in your message.
