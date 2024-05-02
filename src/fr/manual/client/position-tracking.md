---
aside: false
description: null
wip: true
titleTemplate: ':title - Client Manuals | Kongying Tavern'
---

[文：【自动更新】没有反应]: # 'https://support.qq.com/products/321980/faqs/102055'
[#]: # '仅 capabilities 内容来自原文，其余来自申讨反馈群群文件 位置追踪问题排查.docx 。'

# [Suivi Automatique] Introduction

Cette fonctionnalité est basée sur la **reconnaissance d'image**

## Fonctionnalités {#Fonctionnalités}

- Prise en charge de la plupart des langues (non limitée au chinois, au français et à l'anglais)
- Fonctionne même lorsque la mise à l'échelle du système n'est pas à 100 %
- Détection précise de la position du joueur
- Fonctionnel dans toutes les régions, y compris Enkanomia et le Gouffre: les Mines souterraines s'affiche automatiquement

---

Voici la configuration minimale pour cette fonctionnalité :

- Windows 10/11
- La carte est débloquer en déverrouillant les Statues des Sept, et la **mini-carte** est complète
- La **mini-carte** ne contient aucun **waypoints personnalisés** ni **régions mises en surbrillance**.
- Le jeu n'est pas en **plein écran exclusif**, l'exécution de [plein écran fenêtré (sans bordure)](../overlay-mode/fullscreen-windowed/launching.md) est recommandée

Une fois le Suivi Automatique activé, le **client**

- Affichage de votre UID dans le coin inférieur droit
- Détection automatique l'emplacement actuel de votre personnage et affiche un indicateur en simultané sur le **client**

![](/imgs/fr/manual/auto-tracking/autotrackingegaged.png)

---

[见：位置追踪问题排查.docx]: # '以下为 位置追踪支持列表： 内容'

## Support logiciel {#Logiciel}

### Pris en charge

- Genshin Impact version PC fonctionnant sous Windows 10/11

### En cours

- Cloud-Gaming
- Windows 8.1 et versions antérieures
- Lecture/diffusion à distance depuis d'autres appareils

### Ne supportera pas

- Système d'exploitation non Windows (Linux)
- émulateur Android
- Machines virtuelles

---

## Support graphique {#Graphique}

### Pris en charge

- N'importe quelle résolution (recommandée : 720p (1280×720) ou supérieure)
- Tout format d'image (recommandé : 4:3 à 21:9)
- Tout périphérique d'entrée
- **Mini-carte fixe** (sous les paramètres de gameplay du jeu)
- Fenêtré et, dans certains scénarios, plein écran exclusif (voir Dépannage, problème 4)

### En cours

- Mini-carte rotative (sous les paramètres de jeu du jeu)
- Donjons et espaces intérieurs

### Ne supportera pas

Les distorsions de couleur causées par :

- étalonnage des couleurs par un tiers
- Réglage de la luminosité par un tiers
- L'Auto HDR de Windows 11 (testé : précision de cap du joueur réduite)
- Fonctionnalités « Eye Saver »
- Filtres de jeu NVIDIA Freestyle

**Le Suivi Automatique** peut fonctionner avec une précision réduite, voire pas du tout.

---

[见：位置追踪问题排查.docx]: # '以下为 反馈问题前你需要知道的： 内容'

## Dépannage {#Dépannage}

Quelques faits à connaître avant de dépanner et de soumettre des commentaires :

1. Le suivi automatique est basé sur la reconnaissance d'images, il ne lit ni ne modifie le processus du jeu, il n'entraîne donc aucun risque de bannissement.
2. La reconnaissance d'image n'est pas une science exacte, il est donc normal que l'indicateur de position change anormalement. Ce problème ne peut être résolu complètement en raison des limites de la technologie mise en œuvre.
3. Veuillez vérifier si la vos paramètres et fonctionnalités utiliser sont prise en charge ci-dessus.
4. Les fichiers de dépannage suivants peuvent nous aider à identifier un problème. Veuillez les joindre si possible à vos commentaires :

- Journal de suivi (autoTrack.log)
- Capture d'écran de suivi (Capture.png)

![](/imgs/fr/manual/auto-tracking/7.png)

::: Conseil
Vous pouvez visiter rapidement le répertoire des fichiers via les paramètres du **Suivi Automatique**.

![](/imgs/fr/manual/auto-tracking/2.png)
:::

[反馈方式]: # '最适合目标语言用户的反馈方式'

Veuillez parcourir les [problèmes potentiels](./troubleshoot.md) avant de publier sur le [canal #feedback sur Discord](https://discord.gg/8wgttNDwse). (vous êtes invités à poser n'importe quelle question dans #chat)

[文：位置追踪问题排查.docx]: # '以下为 问题排查 内容'

# [Position Tracker] Troubleshooting

## 1. When **Position Tracker** is engaged, the in-game minimap does not show pins, nor is there an overlay of the map client {#issue1}

[#]: # '这里没有直接翻译，因英文用户大概率没有看过演示视频，未提及《天理地图》'

The **Position Tracker** feature cannot overlay the game window, you can use the Stay on Top feature to have a similar effect as the title describes.

[#]: # '因此在这链接了 reddit 上的演示'

Showcase：

```card
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

![](/imgs/fr/manual/auto-tracking/6.png)

[反馈方式]: # '最适合目标语言用户的反馈方式'

- Please reach out in [#feedback on Discord](https://discord.gg/8wgttNDwse) if the issue remains, include "【启动位置追踪模块后软件崩溃】" in your message.

## 4. Nothing happens when **Position Tracker** is engaged {#issue4}

- When using a new version for the first time, the module requires 1-5 minutes to rebuild its cache. During this process, switching versions or using the tracking screenshot function may cause the client to stop responding. If no player indicator shows up after 10 minutes, or if it is not the initial activation of a new version, please refer to issues further down the list.
- Double-check if the **Position Tracker** is toggled on.
- Check the in-game minimap for obstructions, and ensure that it's displaying properly.
- Check the "DLL" version at the lower left corner of the map client. If it shows "Uninitialized", try restarting **Position Tracker**.

![](/imgs/fr/manual/auto-tracking/3.png)
![](/imgs/fr/manual/auto-tracking/4.png)
![](/imgs/fr/manual/auto-tracking/5.png)

[#]: # '与第 3 步一样，更新了客户端内一键清理的步骤和图片'

If the problem persists, use [Clear Tracking Module] under the **Position Tracker** settings tab, which deletes all files in `%APPDATA%\..\LocalLow\空荧酒馆\Map\DLL`, and download the tracking module again.

![](/imgs/fr/manual/auto-tracking/1.png)

- Use "Obtain Tracking Screenshot" in the **Position Tracker** settings, if the screenshot is blank, showing a non-current image of the game, or unsuccessful, please see Issue 5.
- If a normal screenshot is obtained, but no player indicator shows up, please see Issue 6.

## 5. Screenshot errors (Blank or non-current game image) {#issue5}

<span style="color: red">Some Windows 11 machines may not support BitBlt properly, switching the Tracking Mode to DirectX will likely solve the issue.</span>

- Try switching Tracking Modes (The modes differ only in capture method, there is no effect on tracking accuracy)
  - BitBlt supports both windowed and exclusive fullscreen game
  - DirectX supports windowed game only
- Try running the game windowed (**Alt+Enter**, game does not minimize when pressing **Win** key). If you want to play the game fullscreen, please refer to: [Launching The Game in Windowed Fullscreen (Borderless)](../overlay-mode/fullscreen-windowed/launching.md)
- To use BitBlt in Windows 11, go to the Graphics settings (Settings->System->Display->Graphics), add GenshinImpact.exe to the list (`***\Genshin Impact Game\GenshinImpact.exe`, not launcher.exe) and **enable** "Don't use optimizations for windowed games".

![](/imgs/fr/manual/auto-tracking/windowedoptimization.png)

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

# ~~[Position Tracker] Oculus Tracking~~

Functioning principle:

- If an oculus indicator appears on the minimap, that oculus will be unmarked on the map client
- If an oculus indicator does not appear at the corresponding location on the minimap, that oculus will be marked as found

---

<p>Important Note: <span style="color: red">This feature is not 100% accurate. False positives can occur when oculi don't appear on the minimap because they are vertically distant, either in the air or under ground.</span></p>
