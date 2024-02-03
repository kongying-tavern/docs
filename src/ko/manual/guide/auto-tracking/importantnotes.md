---
aside: true
titleTemplate: ':title | 空荧酒馆'
prev:
  text: '目录'
  link: '/manual/client-user-manual'
next:
  text: '【位置追踪】问题排查'
  link: '../auto-tracking/troubleshoot'
description: This feature is based on image recognition
---

[文：【位置追踪】注意事项]: # 'https://support.qq.com/products/321980/faqs/102055' [#]: # '仅 capabilities 内容来自原文，其余来自申讨反馈群群文件 位置追踪问题排查.docx 。'

# 【位置追踪】注意事项

## 使用说明

- 在开启位置追踪后，《空荧酒馆》会实时获取游戏中玩家的位置，并在地图中显示小箭头，帮助玩家拖动地图并显示自己的位置，以方便玩家更快的找到需要标记的点位。

## 特性 {#capabilities}

- 本功能基于【图像识别】技术实现
- 可支持大部分原神客户端的匹配（包括但不限于中、韩、英）
- 适配多种屏幕比例
- 支持全地区追踪，包括渊下宫，层岩巨渊和4.0之后的地下分层地图。目前自动切换层级功能在开发中

## 开启

成功开启位置追踪后，

- 【地图客户端】右下角会**显示 UID**
  - 基于OCR识别，没有读取在线数据
  - 在窗口模式下，uid可能会因为标题栏的挤压显示在屏幕外面，可能会影响到uid的识别，但不会影响到追踪
- 筛选列表下方显示**位置追踪版本**

![image](https://github.com/Sallee1/docs/assets/99392726/b9c6cbbd-430b-4886-ac70-ee4bc9f27633)

- 自动检测游戏内**当前角色位置**（小地图坐标位置）并同步显示到【地图客户端】上（像游戏内地图一样）

![](/imgs/manual/auto-tracking/autotrackingegaged.png)

---
[见：位置追踪问题排查.docx]: # '以下为 位置追踪支持列表： 内容'

## 已支持的程序 {#Software}

- Windows10/11 下的原神 PC 版
- 【已不再支持】云原神（_云原神有反录屏，无法获取到截图_）

---

## 画面设置 {#Graphics}

- 支持任意分辨率（建议不小于 1280x720）
- 支持任意画面比例（推荐画面比例在 4:3~21:9 之间）
  - 如果画面是小于16:9的窄屏，则按照宽度固定计算等效分辨率
  - 如果画面是大于16:9的带鱼屏，则按照高度固定计算等效分辨率
- 支持手柄、键鼠
- 支持独占全屏和窗口（建议使用“[无边框窗口](http://yuanshen.site/docs/manual/guide/overlay-mode/fullscreen-windowed/launching)”代替全屏模式）
- 小地图仅支持锁定方向，不支持锁定玩家视角
- 不支持秘境，室内等有独立地图的区域
- 使用了可能会影响到屏幕色彩的软件，包括但不限于：
  - 第三方校色软件
  - 第三方亮度调节软件
  - Windows 11 自动 HDR (影响角度定位精确度)
  - 开启了护眼
  - 显卡滤镜

## 无法追踪怎么办

参见：[【位置追踪】注意事项](http://yuanshen.site/docs/manual/guide/auto-tracking/troubleshoot)

## 反馈问题前你需要知道的 {#Troubleshooting}

1. 位置追踪基于图像识别，不会侵入游戏进程，所以不存在封号的风险。可以放心使用
2. 图像识别的准确度并不高，抖动和偶发的瞬移属于正常现象，这个属于图像识别本身的缺陷，无法完全解决
3. 在反馈之前，请确定程序和画面设置没有问题
4. 在反馈问题前，请确保了解位置追踪产生的日志文件，以方便为开发组排查问题:

   **追踪日志：**

   ```
   <地图安装目录>/AutoTrack.log
   ```

   追踪日志：可用记事本打开的文本文件（建议使用第三方文本编辑器，如 notepad3,vscode）

   **追踪截图：**

   ```
   <地图安装目录>/capture.png
   ```

   png 图像，用来排查 UI 定位的问题。追踪截图：png 图像，用来排查 UI 定位的问题。因为带有 Alpha 通道，所以可能会有很大的色差，用 PS 打开或者粘贴到 QQ 上既可正常显示游戏画面。

   **定位缓存：**

   ```
   <地图安装目录>/cvAutoTrack.xml
   ```

   后缀为xml，实际上是二进制文件，用于对匹配加速

   如果坐标不准确或者新地图无法追踪，可以尝试删除，会重新生成

   **崩溃镜像：**

   ```
   <地图安装目录>/cvAutoTrack-[时间].dmp
   ```

   位置追踪崩溃后自动生成的文件，如果近期没有出现崩溃的问题，可以删除

**【注意】：如果反馈群要求发送追踪截图，请不要使用截图或者用 qq 的发送图片功能，必须要以文件的方式发送图像。可以将追踪截图的文件直接拖到聊天框来发送文件。可以将追踪截图的文件直接拖到聊天框来发送文件。**
[反馈方式]: # '最适合目标语言用户的反馈方式'

### 请确保[问题排查](./troubleshoot.md)的措施都尝试过，依然没有解决问题后再尝试在[开发反馈 QQ 群：228382171](https://jq.qq.com/?_wv=1027&k=EqhYN9uI)反馈相关问题。

## 帮助开发

仓库地址：https://github.com/GengGode/cvAutoTrack

位置追踪基于 **C++和OpenCV** 技术栈，如果你想参与到**空荧酒馆原神地图**位置追踪模块的开发，可以[点击这里](https://qm.qq.com/cgi-bin/qm/qr?k=wXbtoDmXCjlR8iJ-3lRwdNIOWio3quit&jump_from=webapi&authKey=aS/Be7vKSbcu/6zrmYVlpF6DsSnkHVMGT6Arn+RU+IiJf8ItKIFEXnVvfFmOL9We)加入到开发组。或者自行fork修改
