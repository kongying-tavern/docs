---
aside: true
layout: doc
title: Overlay Mode
---

[文：【覆盖模式】使用说明]: # 'https://support.qq.com/products/321980/faqs/97047'

## Introduction

Overlay Mode <span style="color: green"><b>displays the map client</b></span> over the <span style="color: red"><b>Genshin game window</b></span>. This mode benefits players who only have one monitor, allowing quicker switching between the game and the map client.

![](/imgs/en/manual/overlay-mode/1.png)
(Map client displaying on game Window)

## Instructions

- Overlay Mode only functions properly when the Genshin is running under a non-fullscreen mode
- For users who prefer a fullscreen experience, please follow the instructions in: [Launching The Game in Windowed Fullscreen](./fullscreen-windowed)
- The map cannot be summoned to the top when Genshin is in exclusive fullscreen. Try setting Genshin to windowed, quitting, or using the **Alt+Enter** shortcut to switch it to windowed without changing the game resolution
- When Overlay Mode is enabled, a tip is displayed.

![](/imgs/en/manual/overlay-mode/2.png)
(Overlay Mode enabled Tip)

- Pressing **Alt+M**, **M**, **Esc**, or clicking on the close button at the top right corner will hide the map client and return you to the game

![](/imgs/en/manual/overlay-mode/3.png)
(Close Button - Go Back to Game)

- Once Overlay Mode is enabled successfully, a **Paimon Icon** displays on the left of the minimap in-game
- If the Paimon Icon does not appear, **PopTips** likely loaded unsuccessfully. This may be caused by system permission denial, you can launch the **PopTips** plugin manually by executing `map_folder_directory_\Map_Data\Plugins\x86_64\tips.exe`

![](/imgs/en/manual/overlay-mode/4.png)
(Paimon Icon)

- You can drag the Paimon Icon to change its position
- Either double-clicking on the Paimon Icon or pressing Alt+M can summon the map
- Right-clicking on the Paimon Icon in the system tray allows customization of shortcut key binds. (Sorry for the lack of translation for this part)

![](/imgs/en/manual/overlay-mode/5.png)
(Modify Switching Shortcut)

- Firewalls may cause failure in launching Overlay Mode. We will resolve this issue in the coming future.

## FAQs

- If the hotkey conflicts with another hotkey, you can delete all files in the hotkey cache directory reset the hotkey configuration. After the deletion, the shortcut will be reset to its default: **Alt+M** upon relaunch.

![](/imgs/en/manual/overlay-mode/6.png)
