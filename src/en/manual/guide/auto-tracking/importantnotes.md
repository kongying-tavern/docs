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
---

# [Automatic Tracking] Introduction

This feature is based on **image recognition**

## Capabilities

- Support for most languages (Not limited to Chinese, Korean, and English)
- Functioning properly even when Windows system Scaling is not 100%
- Accurate player heading detection
- Functioning in all regions, including Enkanomia and Chasm: Underground Mines when the client is displaying them

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

## Software Support

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

## Graphics Support

### Supported

- Any resolution (recommended 720p or greater)
- Any aspect ratio (recommended 4:3 to 21:9)
- Any input device
- Windowed, and in some scenarios, exclusive fullscreen (see Troubleshooting 4. a)

### In-progress

- Rotating map
- Domains and indoor areas

### Will not support

Compensating for color distortions, which could be caused by:

- Windows HDR calibration
- Third party color calibration
- Third party brightness adjustment
- Auto HDR (Windows 11)
- "Eye saver" features
- NVIDIA Freestyle Game Filters

Auto tracking may work with reduced accuracy or not at all.

---

## Troubleshooting

Some facts to know before troubleshooting and submitting feedback:

1. Automatic tracking is based on image recognition, it does not read or modify the game process, thus it brings no risk of an account ban.
2. The image recognition is not highly accurate, it's normal for the player indicator to shift sporadically. It cannot be resolved due to the limitations of the technology implemented.
3. Please check if your desired range of settings and feature is supported above.
4. The following troubleshooting files can help us identify the issue, please attach them with your feedback if possible:
   - Tracking log (autoTrack.log)
   - Tracking screenshot (Capture.png)

![](/imgs/en/manual/auto-tracking/1.png)

Tip: You can visit the files' location quickly through the auto tracking settings

![](/imgs/en/manual/auto-tracking/2.png)

5. Please go through the following potential Issues before posting in the #feedback channel in Discord. (you are welcomed ask questions in #chat)
