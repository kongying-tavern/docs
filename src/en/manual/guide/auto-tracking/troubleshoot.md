---
title: \[Automatic Tracking] Troubleshooting
aside: true
titleTemplate: Kongying Tavern
prev:
  text: '[Automatic Tracking] Important Notes'
  link: '../auto-tracking/importantnotes'
next:
  text: '[Background Usage] Framerate/Tracking Control'
  link: '../bg/bgfrate'
---

# [Automatic Tracking] Troubleshooting

## 1. When auto tracking is engaged, the in-game minimap does not show pins, nor is there an overlay of the map client

The auto tracking feature cannot overlay the game window, you can use the Stay on Top feature to have a similar effect as the title describes.

Showcase
<MediaIntroduction 
  media="reddit"
  text="The Best Underground Map (Kongying Tavern x Teyvat Map Institute)"
  link="https://www.reddit.com/r/Genshin_Impact/comments/12znlyd/the_best_underground_map_kongying_tavern_x_teyvat/"
/>

## 2. Cannot download auto tracking module, the download window flashes or the download speed is 0.00 kb/s

There is a problem with our server, join our [Discord](https://discord.gg/S7MxgjcbtD) and download the module there. Once the installation finishes, restart the map client to load the module.

## 3. Receiving C++ Runtime error or client crashing after enabling auto tracking

- Simply retry enabling auto tracking
- Exit the map client and delete the auto tracking cache, launch the map client again and enable auto tracking, you will need to wait for the cache to build again

![](/imgs/en/manual/auto-tracking/6.png)

- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【启动自动追踪模块后软件崩溃】" in your message.

## 4. Nothing happens when auto tracking is engaged

- When using a new version for the first time, the module requires 1-5 minutes to rebuild its cache. During this process, switching versions or using the tracking screenshot function may cause the client to stop responding. If no player indicator shows up after 10 minutes, or if it is not the initial activation of a new version, please refer to issues further down the list.
- Double-check if the auto tracker is toggled on.
- Check the in-game minimap for obstructions, and ensure it's displaying properly.
- Check the "DLL" version at the lower left corner of the map client. If it shows "Uninitialized", try restarting auto tracking.
  ![](/imgs/en/manual/auto-tracking/3.png)
  ![](/imgs/en/manual/auto-tracking/4.png)
  ![](/imgs/en/manual/auto-tracking/5.png)
  If the problem persists, please delete all files in `C:\Users\username\AppData\LocalLow\空荧酒馆\Map\DLL`, and download the tracking module again.
  ![](/imgs/en/manual/auto-tracking/1.png)

- Use "Obtain Tracking Screenshot" in the auto tracking settings, if the screenshot is blank, showing a non-current image of the game, or failed, please see Issue 5.
- If a normal screenshot is obtained, but no player indicator shows up, please see Issue 6.

## 5. Screenshot errors (Blank or non-current game image)

<span style="color: red">Some PCs with Windows 11 do not support BitBlt properly, switching the Tracking Mode to DirectX will likely solve the issue</span>.

- Try switching Tracking Modes
  - BitBlt supports both windowed and exclusive fullscreen
  - DirectX supports windowed only
  - The modes differ only in capture method, there is no effect on tracking accuracy
- Try running the game windowed (**Alt+Enter**, game does not minimize when pressing **Win** key). If you want to play the game fullscreen, please refer to: [Launching The Game in Windowed Fullscreen (Borderless)](../overlay-mode/fullscreen-windowed/launching.md)
- To use BitBlt in Windows 11, go to the Graphics settings (Settings->System->Display->Graphics), add GenshinImpact.exe to the list (`***\Genshin Impact Game\GenshinImpact.exe`, not launcher.exe) and **enable** "Don't use optimizations for windowed games".

![](/imgs/en/manual/auto-tracking/windowedoptimization.png)

- Please message in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【自动追踪截图失败】" in your message.

## 6. The screenshot is normal, but the player indicator is not displayed or does not move

- Please try with a resolution greater than 720p.
- Auto HDR, some color calibration profiles, Game Filters, "eye savers", etc. can reduce tracking accuracy or prevent the auto tracker from working.
- Auto tracking may not work properly with an aspect ratio greater than 21:9, switch to a 16:9 resolution and restart the game, if tracking functions properly in 16:9 only, reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) with a message including "【带鱼屏适配有问题】".
- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【自动追踪截图正常但无法追踪】" in your message.

## 7. Drifting player indicator

When the player indicator is at the wrong location, but moves with your in-game movement, clear the auto tracking cache from the settings and restart auto tracking to rebuild it. (see **_Issue 3._**)

## 8. Player indicator teleports or updates player movement slowly

Occasional teleportation skips of the player indicator cannot be avoided due to the nature of our image recognition algorithm, but you can reduce its occurrence and improve responsiveness with the following actions:

- Set in-game minimap to "Fixed" (required)
- Use a game resolution greater than 720p
- Improve tracking accuracy by enabling anti-aliasing
- Reducing tracking interval when it does not impact performance too much
- Standing still for 3-10 seconds will allow the auto tracker to recapture your location
- If the player indicator continues to skip around, teleport to a waypoint, if the tracking returns to normal, the previous location does not have enough features for the tracker to recognize. (e.g. on the sea, open desert, sand storms, masked and yet-to-unlock areas)

---

- Too many **in-game pins** will significantly reduce tracking accuracy. (e.g. Quest navigation, vendors, custom pins, etc.)
- Some areas can change appearance through world quest completion, auto tracking compares the game image to the **final form** of the map. For auto tracking to work accurately, please complete the related world quest. You can view the final form of the map in the map client. Areas that change:
  - Khaj-Nisut
  - Safhe Shatranj
  - Dunes of Steel
  - The Sands of Three Canals
  - Wounded Shin Valley
  - Tunigi Hollow
- If teleportation persists, please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse), include "【全局追踪无法定位到正确的位置】" in your message.
