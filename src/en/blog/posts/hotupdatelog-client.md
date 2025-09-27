---
title: "[Client] Hot Update Log"
layout: Post
authors:
  - aaaaaaa8
  - idangoi
---

{define:L_NORMAL}{color:#2bbc6e}**NORMAL**{/color}{/define}
{define:L_RARE}{color:#57b4c9}**RARE**{/color}{/define}
{define:L_EPIC}{color:#d07bec}**EPIC**{/color}{/define}
{define:L_LEGEND}{color:#e1ab36}**LEGENDARY**{/color}{/define}
{define:L_MYTH}{color:#f15e4e}**MYTHICAL**{/color}{/define}

> **Client Download Method (Other than auto update)**
>
> - Quark Netdisk: <https://pan.quark.cn/s/fe8bb34c77bc>
> - Join community: <https://yuanshen.site/docs/community.html>
> - Baidu Netdisk (Access code: KYJG): <https://pan.baidu.com/s/1t_FRadAiGHGxw1YvvWt0bg>
> - Chinatelecom Cloud (Access code：exn0)：<https://cloud.189.cn/t/YF7Fj2zIRVbi>
> - Automatic update window does not appear? <https://yuanshen.site/docs/manual/faq/autoupdate/updater>

``` java
/*
                   _ooOoo_
                  o8888888o
                  88" . "88
                  (| -_- |)
                  O\  =  /O
               ____/`---'\____
             .'  \\|     |//  `.
            /  \\|||  :  |||//  \
           /  _||||| -:- |||||-  \
           |   | \\\  -  /// |   |
           | \_|  ''\---/''  |   |
           \  .-\__  `-`  ___/-. /
         ___`. .'  /--.--\  `. . __
      ."" '<  `.___\_<|>_/___.'  >'"".
     | | :  `- \`.;`\ _ /`;.`/ - ` : | |
     \  \ `-.   \_ __\ /__ _/   .-` /  /
======`-.____`-.___\_____/___.-`____.-'======
                   `=---='
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          May no bug be with you.
*/
```

> For Hot Update Logs, please check ***[Release Notes](https://yuanshen.site/docs/en/blog/changelog-client)***.

----

::: timeline Rc1.0.1: 2025-01-15

## 2025-05-13-854

- Fix a {%= L_NORMAL %} issue where new area added in version 5.6 may appear outside the visible area.
- Removed SSL verification during login to eliminate certain login issues in specific system setups.

## 2025-05-07-118

- Update map and resources for version 5.6.
- Remove mode selection of the Position Tracker due to refactor.

<!-- more -->

## 2025-05-05-1406

- Fix a {%= L_NORMAL %} issue where Teleport Waypoint status may incorrect during initialization.

## 2025-05-05-1339

- Fix a {%= L_RARE %} issue where data update failure may lead to item count 0/0 and automatic login failure.

## 2025-04-29-116

- Fix a {%= L_RARE %} issue where pin layer display may abnormal after data update.
- Fix a {%= L_RARE %} issue where time detection fail while switching saves may cause a save loss.
- Fix a {%= L_NORMAL %} issue where select-all status of chest pins may display incorrectly during map initialization.
- Improved the display handling of above-ground layered pins.

## 2025-03-31-976

- Fix a {%= L_NORMAL %} bug that may cause Position Tracker malfunctions in Ancient Sacred Mountain.

## 2025-03-29-85

- Fix a {%= L_RARE %} issue where pin layer display may abnormal after data update.
- Fix a {%= L_NORMAL %} issue where layer display may abnormal in Ancient Sacred Mountain during initialization.

## 2025-03-25-1397

- Add map and resources for version 5.5.

## 2025-03-17-1091

- Fix a {%= L_NORMAL %} issue where text mapping may incorrect.

## 2025-03-16-428

- Fix an {%= L_EPIC %} bug that may cause data update malfunctions.
- Fix a {%= L_NORMAL %} issue that may cause certain directories in settings (such as program logs) to be unclickable.
- Fix a {%= L_NORMAL %} issue that may cause certain text (such as the Traditional Chinese character "鹮") to display incorrectly.
- Fix a {%+ L_NORMAL %} issue where SFX of the resolution dropdown button in the screenshot menu may lost.
- Update font library.
- Add a 12288×12288 option for screenshot resolution.
- Adjusted the screenshot range for certain regions. The screenshot feature is currently quite outdated and needs major improvements—stay tuned!

## 2025-03-10-1134

- Fix a {%= L_RARE %} bug that may cause Pin Association data error, preventing the viewing detailed information for some pins.

## 2025-02-05-52

- Fix a {%= L_NORMAL %} issue where the language may automatically switch when entering the map.
- Fix a {%= L_NORMAL %} issue where shortcut key toggle function may display incorrectly.

:::

::: timeline Rc1.0.0: 2025-01-14

## 2025-01-14-1297

- Fix a {%= L_RARE %} issue where Overlay Mode may not be able to activate.

## 2025-01-14-1101

- Update two base maps for version 5.3.

:::