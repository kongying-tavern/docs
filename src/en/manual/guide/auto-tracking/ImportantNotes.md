---
title: \[Automatic Tracking] Important Notes
aside: true
---

# [Automatic Tracking] Important Notes

This feature is based on **image recognition**

---

The following are pre-requisites for this feature:

- Windows 10 or above
- The map is unmasked by unlocking the Statues of Seven, and the **minimap** is complete
- The **minimap** contains no **custom waypoints** or **highlighted regions**

Once automatic tracking is enabled, The **map client** will

- Display your UID at the lower right corner
- Automatically detect the current location of your character and display a simultaneous player indicator on the **map client**

![](./../../../../public/imgs/en/manual/auto-tracking/autotrackingegaged.png)

## Important Notes

- If the player indicator remains in the upper left corner, <span style="color: red">please try to update your GPU driver, and close software overlays such as Legion zone, MSI Afterburner, etc.</span>
- The anti-aliasing setting under **Graphics** must be set to SMAA
- (This feature supports various aspect ratios and the controller UI layout)
- A low game resolution will reduce tracking accuracy, a resolution of <span style="color: red">1920\*1080 or greater is recommended</span>
- Automatic tracking will not function with **exclusive fullscreen**. Please use **windowed** for functional tracking.
- If you wish to play the game fullscreen like **exclusive fullscreen**, refer to the guide: [Launching The Game in Fullscreen Windowed (Borderless)](../overlay-mode/Fullscreen-Windowed/Launching.md)
- Automatic tracking <span style="color: red">may somtimes return a C++ related error prompt</span>, clicking "OK" will cause the client to crash. This can be solved by installing **2005c++runtime**, if there are further problems please refer to our feedback options
- Windows 11 users may need to enable "Don't use optimizations for windowed games" for automatic tracking to function

![](./../../../../public/imgs/en/manual/auto-tracking/windowedoptimization.png)

## Capabilities

- <span style="color: red">[New capability]</span> Support for most languages (Not limited to Chinese, Korean, and English)
- <span style="color: red">[New capability]</span> Functioning properly even when Windows system Scaling is not 100%
- <span style="color: red">[New capability]</span> More accurate player heading detection
- <span style="color: red">[New capability]</span> Functioning in all regions, including Enkanomia and Chasm: Underground Mines when the client is displaying them
  ​
