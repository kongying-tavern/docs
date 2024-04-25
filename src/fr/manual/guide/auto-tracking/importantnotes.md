---
aside: true
titleTemplate: :title - Client Manuals | Kongying Tavern
description: This feature is based on image recognition
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
