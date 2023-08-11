---
aside: true
titleTemplate: ':title | Kongying Tavern'
prev:
  text: '[Automatic Tracking] Important Notes'
  link: '../auto-tracking/importantnotes'
next:
  text: '【地图性能占用高】前后台帧率设置'
  link: '../bg/bgfrate'
description: Troubleshoot
---

[文：自动追踪问题排查.docx]: # '以下为 问题排查 内容'

# [Automatic Tracking] Troubleshooting

```card
theme: medium
title: 官方开发反馈 QQ 群
desc: 228382171（https://jq.qq.com/?_wv=1027&k=EqhYN9uI）
link: https://jq.qq.com/?_wv=1027&k=EqhYN9uI
```

## 0. 准备工作 {#issue0}

<span style="color: red">请关闭 360 或者其他国产的杀毒软件 如果不想关闭，请将"%APPDATA%\..\LocalLow\空荧酒馆\"加入到信任区。</span>

## 1. When auto tracking is engaged, the in-game minimap does not show pins, nor is there an overlay of the map client {#issue1}
[#]: # '这里没有直接翻译，因英文用户大概率没有看过演示视频，未提及《天理地图》'

自动追踪只是为了在查看地图客户端时，能自动完成地图区域的定位操作，省去手动拖动地图的麻烦，并实现神瞳的自动标记。 《空荧酒馆原神地图》目前没有标题所述的叠加、悬浮窗功能，在网上能看到的演示视频，属于另外一个姊妹项目《天理地图》 如果需要使用，可以在以下链接下载（尚在开发中，不稳定）

```card
title: 维系天理

link: http://www.weixitianli.com/
theme: medium
```

## 2. Cannot download auto tracking module, the download window flashes or the download speed is 0.00 kb/s {#issue2}
[#]: # '“请使用【群文件】的一键安装包手动安装” 的部分 替换 给了 dc 服务器里的下载频道'

服务器出现故障，请使用【群文件】的一键安装包手动安装，安装后需要重新打开“空荧酒馆”，就会切换到刚刚安装的版本

## 3. Receiving C++ Runtime error or client crashing after enabling auto tracking {#issue3}

- 重启地图后，重新尝试开启自动追踪
- Clear the auto tracking cache, launch the map client again and enable auto tracking, you will need to wait for the cache to build again
[#]: # '这里更新了客户端内一键清理自动追踪缓存的步骤，而不是到安装目录里删除，因此图片不同'

![](/imgs/manual/auto-tracking/6.png)
[反馈方式]: # '最适合目标语言用户的反馈方式'

- 如果依然无效，请反馈【启动自动追踪模块后软件崩溃】，最好反馈一下崩溃时地图的具体位置

## 4. Nothing happens when auto tracking is engaged {#issue4}

- When using a new version for the first time, the module requires 1-5 minutes to rebuild its cache.During this process, switching versions or using the tracking screenshot function may cause the client to stop responding.If no player indicator shows up after 10 minutes, or if it is not the initial activation of a new version, please refer to issues further down the list.
- Double-check if the auto tracker is toggled on.
- Check the in-game minimap for obstructions, and ensure that it's displaying properly.
- If it shows "Uninitialized", try restarting auto tracking.

/imgs/en/manual/auto-tracking/3.png![](/imgs/manual/auto-tracking/4.png) ![](/imgs/manual/auto-tracking/5.png)
[#]: # '与第 3 步一样，更新了客户端内一键清理的步骤和图片'

If the problem persists, use [Clear Tracking Module] under the auto tracking settings tab, which deletes all files in `%APPDATA%\..\LocalLow\空荧酒馆\Map\DLL`, and download the tracking module again.

![](/imgs/manual/auto-tracking/1.png)

- Use "Obtain Tracking Screenshot" in the auto tracking settings, if the screenshot is blank, showing a non-current image of the game, or unsuccessful, please see Issue 5.
- 截取并查看追踪截图，如果追踪截图正常，但一直不显示箭头，请查看[章节 6](#issue6)

## 5. Screenshot errors (Blank or non-current game image) {#issue5}

<span style="color: red">Some Windows 11 machines may not support BitBlt properly, switching the Tracking Mode to DirectX will likely solve the issue.</span>

- 尝试切换追踪模式，Bitblt 和 DirectX 都试试

  - BitBlt supports both windowed and exclusive fullscreen game
  - Try switching Tracking Modes (The modes differ only in capture method, there is no effect on tracking accuracy)

- Try running the game windowed (**Alt+Enter**, game does not minimize when pressing **Win** key). If you want to play the game fullscreen, please refer to: [Launching The Game in Windowed Fullscreen (Borderless)](../overlay-mode/fullscreen-windowed/launching.md)

- To use BitBlt in Windows 11, go to the Graphics settings (Settings->System->Display->Graphics), add GenshinImpact.exe to the list (`***\Genshin Impact Game\GenshinImpact.exe`, not launcher.exe) and **enable** "Don't use optimizations for windowed games".

![](/imgs/manual/auto-tracking/windowedoptimization.png)

- Please message in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【自动追踪截图失败】" in your message.

## 6. The screenshot is normal, but the player indicator is not displayed or does not move {#issue6}

- Please try with a resolution greater than 720p.
- 请确保运行原神的屏幕没有开启 HDR，没有使用全局软件校色，没有开启显卡滤镜，没开护眼，也没有运行其他可能会影响屏幕色彩的软件
- Auto tracking may not work properly with an aspect ratio greater than 21:9, switch to a 16:9 resolution and restart the game, if tracking functions properly in 16:9 only, reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) with a message including "【带鱼屏适配有问题】".
- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【自动追踪截图正常但无法追踪】" in your message.

## 7. 自动追踪坐标漂移 {#issue7}

漂移指的是地图定位的位置是错的，但能跟着角色移动，如果遇到这种情况，删除自动追踪缓存（[参照 3](#issue3)），并重启自动追踪等待重建即可（7.7.2 以及更新版本已支持自动重建，只有老版本飘移需要手动重建）

## 8. 自动追踪在大世界中瞬移/定位速度慢 {#issue8}

限于图像识别算法的局限性，瞬移无法避免，请参照以下做法排除：

- 确保游戏中小地图锁定是“锁定方向”
- Use a game resolution greater than 720p
- Improve tracking accuracy by enabling anti-aliasing
- Reducing tracking interval when it does not impact performance too much
- 请在原地等待 3~10 秒，不要走动，一般情况下都能定位到正确的位置
- If the player indicator continues to skip around, teleport to a waypoint, if the tracking returns to normal, the previous location does not have enough features for the tracker to recognize. (e.g. on the sea, open desert, sand storms, masked and yet-to-unlock areas)

---

- 如果小地图中标记太多（包括但不限于城内的商铺密集区，任务追踪标记，自己做的地图标记等）会严重影响地图定位的准确度，请暂时关闭自动追踪或者想办法去除这些标记（把任务做了，关闭追踪，删除游戏中标记等）
- 部分地图在游戏流程中地图会发生变化，自动追踪以最终形态为准。如果这些地区还有未完成的世界任务，请先完成，最终形态可以参照“空荧酒馆原神地图”。

已知会发生变化的区域：

| 圣显厅                           | 神弃殿阁                    | 镔铁沙丘     |
| ----------------------------- | ----------------------- | -------- |
| **The Sands of Three Canals** | **Wounded Shin Valley** | **荼泥黑渊** |

- 如果超过 1 分钟依然在不断的瞬移，并且无论传送到哪里都是如此，请反馈【全局追踪无法定位到正确的位置】
