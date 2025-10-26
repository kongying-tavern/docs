---
title: "[Client] Release Notes"
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
> - Chinatelecom Cloud (Access code: exn0): <https://cloud.189.cn/t/YF7Fj2zIRVbi>
> - Automatic update window does not appear? <https://yuanshen.site/docs/en/manual/faq/autoupdate/updater>

```
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
```

> For Hot Update Logs, please check ***[Hot Update Log](https://yuanshen.site/docs/en/blog/hotupdatelog-client)***.

---

::: timeline Rc1.0.1: 2025-01-15

- Fix a {%= L_NORMAL %} issue where unable to return to the game via shortcut.
- Fix a {%= L_NORMAL %} issue where unable to activate Pinned Window Mode.

:::

<!-- more -->

::: timeline Rc1.0.0: 2025-01-14

- Update engine version to 2021.3.20f1c1.
- Change base framework, now uses YooAsset + HybridCLR to implement hot-updates for long-term support.
- Improve overall fluency.
- Probably add a bunch of bugs.
- {color:#e13636}**Notice: This version can not be updated through the updater, please redownload the full package.**{/color}

:::

---

::: timeline Beta5.2.4: 2024-12-04

- Fix a {%= L_RARE %} issue that may cause a blank screen when double-clicking on Region Select button.
- Fix a {%= L_RARE %} issue that may cause the malfunction of Position Tracker after reporting errors when downloading and decompressing.
- Fix a {%= L_NORMAL %} issue that may cause a save error so that the program cannot exit.
- Fix a {%= L_NORMAL %} issue that may cause the Position Tracker setting to OFF when enabling Position Tracker via shortcut.
- Fix a {%= L_NORMAL %} issue that may cause the "Switch Map" text overlaps with the item when searching for items on other maps.
- Fix a {%= L_NORMAL %} issue where the startup screen scales incorrectly.
- Add a new option "Show 'found' pin detail on middle click only" (that is "Lock 'Found' Pins").
- Separate UI scaling from map scaling, and increase the zoom range.
- Improve displaying/hiding logic of basemap elements when scaling UI.

:::

::: timeline Beta5.2.3: 2024-12-01

- Fix a {%= L_RARE %} issue where refresh time format error may cause item count 0/0.
- Optimize UI scaling to fit Portrait Mode.
- Refactor UI scaling logic, now adjusting UI scaling will zoom map elements as well.

:::

::: timeline Beta5.2.2: 2024-11-24

- Fix a {%= L_RARE %} issue where login error may cause item count 0/0.
- Fix a {%= L_RARE %} issue in Pin Association where pin abnormally disappears when clicking on other pins after clicking on pins belonging to the same cluster.
- Fix a {%= L_NORMAL %} issue that may cause shortcut UI unclickable and animation error.
- Optimize label color for pins belonging to current layer in Multi-Layered Mode, which is the same as in the game now.
- Optimize icon style for icons without icon.
- Add text for Tecoloapan Bay region.

:::

::: timeline Beta5.2.1: 2024-11-20

- Fix a {%= L_RARE %} issue where app can not be used in new environment.
- Fix a {%= L_NORMAL %} issue that, in Multi-Region-Selection Mode with Show Items Outside Current Map Mode enabled, focusing on a non-current-map item and deselecting the current map may cause the filter to exclusively display non-current-map items.

:::

::: timeline Beta5.2: 2024-11-20

- Update map and resources for version 5.2.
- Fix an {%= L_EPIC %} issue that may cause save malfunctions.
- Fix an {%= L_EPIC %} issue that may cause Offline Mode malfunctions.
- Fix a {%= L_RARE %} issue that may cause abnormal sizing in pin popup text boxes.
- Fix a {%= L_NORMAL %} issue that may cause audio distortion during login.
- Fix a {%= L_NORMAL %} issue that causes island switching failures in the 2.8 Golden Apple Archipelago region.
- Fix a {%= L_NORMAL %} issue where deselect items when pin popup is opened may cause pin to be in the topmost layer.
- Add a secondary confirmation popup before clearing all selected items.
- Add Item Preset.
- Add Item Search.
- Add Multi-Region Mode.
- Add Show Items Outside Current Map Mode.
- Add Item Spotlight.
- Add Item Focus.
- Add Item Context Menu.
- Add Right-Click Region to Focus.
- Add new I18N options for startup screen.
- Add SFX options for startup screen.
- Optimize judgement logic for Selected Item panel.
- Optimize tooltip behavior to only refresh display duration when tooltips with identical content are triggered.
- Improve performance across all scrollable components.
- Optimize UI animations for region selection, category selection, and item selection interfaces.
- Improve scrollable window performance to prevent frame drops no matter how many items being loaded.
- Optimize data structures to improve operational efficiency.
- Improve performance by optimizing Garbage Collection (GC) calls.
- Optimize visual effects performance during map transitions.
- Optimize camera zooming behavior during UI interactions.
- Improve Item Progress Bar UI performance.
- Optimize layout management logic in the settings interface UI.
- Optimize cave entrance detection logic.
- Add a bunch of BUG features.

:::

::: timeline Beta5.0.2: 2024-09-23

- Fix an {%= L_EPIC %} issue where Relation Type errors may cause item state refresh failures, resulting in Item Count displays as 413/812.
- Fix a {%= L_NORMAL %} issue where Auto Switch Multi-Layered Map may not work.
- Fix a {%= L_NORMAL %} issue where Region Filter Sorting may not work properly.
- New Directional Related, Unidirectional Path, Bidirectional Path type are now available in the Pin Association.
- Add a new option for Windows Graphics Settings in Position Tracker to facilitate deactivate windowed-game optimization.

:::

::: timeline Beta5.0.1: 2024-08-28

- Fix a {%= L_RARE %} issue where the pin hidden state of some layers might be incorrect.
- Fix a {%= L_NORMAL %} issue where the DLL version translation may not apply.

:::

::: timeline Beta5.0: 2024-08-28

- Update map and resources for version 5.0.
- Fix a {%= L_NORMAL %} issue where resource version may be -1.
- Fix a {%= L_NORMAL %} issue where the scrollbar of the pin popup might not be able to be dragged.
- Fix a {%= L_NORMAL %} issue where some text changes might not take effect immediately when switching languages.
- Optimize I18n language reselection logic.
- Improve webp format support for images.
- Improve FX performance when switching item types.

:::

::: timeline Beta4.8: 2024-07-17

- Update map and resources for version 4.8.

:::

::: timeline Beta4.7.2: 2024-06-25

- Fix a {%= L_RARE %} issue where deselecting pins may deselect multiple times causing pins to disappear directly.
- Fix a {%= L_NORMAL %} issue where cave entrances may be affected by opacity settings when opening for the first time.

:::

::: timeline Beta4.7.1: 2024-06-17

- Fix a {%= L_NORMAL %} issue where data read exception may cause item count reports 413/812.

:::

::: timeline Beta4.7: 2024-06-17

- Update some basemap text.
- Fix an {%= L_EPIC %} issue where the program may not operate after forcing exit and reopening when activating Overlay Mode.
- Optimize Selected Items panel, now items with the same name will be merged.
- Optimize I18n language reselection logic.

:::

::: timeline Beta4.6.3: 2024-05-04

- Fix a {%= L_NORMAL %} issue where some pin popups may unable to open when activating Auto Switch Multi-Layered Map.
- Fix a {%= L_NORMAL %} issue where you may unable to close pin popup by clicking the Close button.

:::

::: timeline Beta4.6.2: 2024-05-01

- Update Position Tracker for Sea of Bygone Eras.
- Update some layered maps.
- Change some basemap text positions.
- Fix a {%= L_RARE %} issue where status restoration may restore other items with the same name.
- Add a {%= L_EPIC %} feature, Auto Switch Multi-Layered Map. When enabled, clicking on pins will automatically switch to corresponding layer.
- Add new option "Show Cave Entrances in Multi-Layered Mode" in Settings.
- Optimize Save Rollback, with the addition of data cleaning and date selection, the program may not get stuck with too much data now
- Optimize Tooltip, now middle click can also open POI details, so you can check POI details on middle click while editing the canvas

:::

::: timeline Beta4.6.1: 2024-04-24

- Fix a {%= L_RARE %} issue where Dragonspine region may incorrectly displayed as Veluriyam Mirage.

:::

::: timeline Beta4.6: 2024-04-24

- Update map and resources for version 4.6.
- Fix an {%= L_EPIC %} issue where Position Tracker may not be able to enable when the location tracking version update server crashes.
- Fix a {%= L_NORMAL %} issue where SFX may be abnormally stuttering when enabling Position Tracker.
- Fix a {%= L_NORMAL %} issue which may cause data error on very few items.
- Fix a {%= L_NORMAL %} issue which may cause Show Cave Entrances in Multi-Layered Mode malfunctioning.
- Add a {%= L_MYTH %} feature, Pin Association. This feature benefits in tracking and selecting pins by connecting pins with relations. Moreover, related settings are added, and pin relations can be auto-triggered once configured.
- Optimize redirection logic for some web links.
- Optimize pin rendering behavior at high map zoom levels.

:::

::: timeline Beta4.4.4: 2024-02-27

- Fix a {%= L_EPIC %} issue that may cause Position Tracker download failures.
- Fix a {%= L_RARE %} issue which may cause Overlay Mode errors when Graphic Settings are set to Borderless in-game.
- Fix a {%= L_RARE %} issue which may cause Run in Offline Mode and Exit button malfunctions after three download failures.
- Fix a {%= L_NORMAL %} issue which may cause Position Tracker update detection error.
- Fix a {%= L_NORMAL %} issue which may cause tooltip text to detach from prompt window.
- Optimize the version selection UI of Position Tracker. Moreover, a marker is added to the downloaded version.
- Optimize UI tips for some long text.

:::

::: timeline Beta4.4.3: 2024-02-22

- Fix a {%= L_NORMAL %} issue that may cause a mismatched announcement is displayed when clicking an announcement.
- Fix a {%= L_RARE %} issue that may cause a resetting failure in opened but hidden pins.
- Fix a {%= L_NORMAL %} issue that may cause items with item count 0/0 not to display.
- Add a control slider for Opacity of "Found" Pins.
- Add a option for switching the state of The Tower of Ipsissimus.
- Add a control slider for Opacity of Hidden Teleport Waypoints.
- Add text for layered map in Chenyu Vale region.
- Add shortcut settings for switching Multi-Layered Mode and Show/Hide "Found" pins (setting to "None" by default).
- Add chest collection progress bar.
- Add focus tooltips for most scrollbar controls.
- Optimize Announcement interface, an entry is added, and supports hyperlinks now.
- Optimize font texture for clearer display.
- Optimize pin popup by attaching images externally. Moreover, text scrolling logic is enhanced and text can be dragged by left-click.

:::

::: timeline Beta4.4.2: 2024-01-31

- Update map and resources for version 4.4.
- Fix a {%= L_RARE %} issue that may cause data update exception.

:::

::: timeline Beta4.4.1: 2024-01-31

- !!Update map and resources for version 4.4.!!

:::

::: timeline Beta4.4: 2024-01-31

- !!Update map and resources for version 4.4.!!
- Fix a {%= L_RARE %} issue that may cause other pins with the corresponding ID to not be selected simultaneously after selecting a Teleport Waypoint.
- Fix a {%= L_NORMAL %} issue which selected Teleport Waypoints may not be properly transparentized when enabling Multi-Layered Mode.
- Fix a {%= L_NORMAL %} issue that may cause accidental Teleport Waypoint activation when clicking on pins.
- Optimize selecting status of Teleport Waypoints.
- Optimize display behavior for overlength pin titles.
- Optimize display behavior of overlength text in pin popups.
- Add Announcement system.

:::

::: timeline Beta4.2: 2023-11-08

- Update map and resources for version 4.2.
- Fix a {%= L_EPIC %} issue that may cause the item selection state to not be correctly restored during login/logout. And when Multi-Layered Mode is enabled, the Cave Entrance will automatically display upon restarting the map after deactivating "Show Cave Entrances in Multi-Layered Mode".

:::

::: timeline Beta4.1.2: 2023-10-20

- Fix a {%= L_RARE %} issue that may cause the application stuck during data updates.

:::

::: timeline Beta4.1.1: 2023-10-12

- Optimize the size scaling of the layer switch button.
- Optimize filtering logic of underground area pins, allowing pins to be filtered based on underground levels.
- Improve version switching logic of Position Tracker.

:::

::: timeline Beta4.1: 2023-09-27

- Update map and resources for version 4.1.
- Fix a {%= L_NORMAL %} issue that may cause text overflow in certain languages in Settings.

:::

::: timeline Beta4.0.2: 2023-09-12

- Backend update to support the new version. Older versions will no longer be supported.
- Fix a {%= L_NORMAL %} issue that may cause image misalignment of Mountain Cavern: F2.
- Fix a {%= L_NORMAL %} issue where the Waverider Waypoint in Fontaine may be missing.
- Fix a {%= L_NORMAL %} issue that may cause two layered maps to be in the incorrect underground layer in Dharma Forest.
- Fix a {%= L_RARE %} issue that may cause certain pins to immediately refresh after being selected. !!(uncertain whether it is fully resolved)!!

:::

::: timeline Beta4.0.1: 2023-08-18

- Fix a {%= L_RARE %} issue where certain items may not show or hide properly .
- Fix a {%= L_NORMAL %} issue that may cause abnormal refresh time for mineral pins.
- Fix a {%= L_NORMAL %} issue where two Fontaine region may appear simultaneously on the map.

:::

::: timeline Beta4.0: 2023-08-16

- Update map and resources for version 4.0.
- Fix a {%= L_RARE %} issue: When restart the Map after selecting an item containing both Chest and other items, deselecting one of these items may cause this item can not be reselected.
- Fix a {%= L_RARE %} issue that may cause abnormal visibility of Cave Entrances.
- Fix a {%= L_NORMAL %} issue that may cause abnormal refresh time for mineral pins.

:::

::: timeline Beta3.8.1: 2023-07-08

- Update Position Tracker for 3.8.
- Fix a {%= L_RARE %} issue that may cause the data update speed to freeze at 0 kB/s.
- Add an auto-save prompt when exiting the Map.

:::

::: timeline Beta3.8: 2023-07-04

- Update map and resources for version 3.8.

:::

::: timeline Beta3.6.4: 2023-04-18

- Fix a {%= L_NORMAL %} issue that may cause Japanese place names to display incorrectly.

:::

::: timeline Beta3.6.3: 2023-04-17

- Fix a {%= L_NORMAL %} issue that may cause inherent pin interactions to block higher-level pins.
- Fix a {%= L_NORMAL %} issue that may prevent returning to the game via shortcuts when the game is running in Fullscreen Mode.

:::

::: timeline Beta3.6.2: 2023-04-16

- Fix a {%= L_EPIC %} issue that may cause the mouse not to be captured by the game when returning to the game in Overlay Mode.
- Fix a {%= L_NORMAL %} issue where map may not disappear properly in Overlay Mode.
- Fix a {%= L_NORMAL %} issue where some Teleport Waypoints may incorrectly appear in other maps after data update.
- Fix a {%= L_NORMAL %} issue where data update popup may not close properly after data update.
- Optimize the hotfix resource download logic to significantly reduce the size of subsequent update packages.
- Add an option for the return-to-game shortcut configuration in Settings.

:::

::: timeline Beta3.6.1: 2023-04-15

- Update Layered Map of Girdle of the Sands and some Layered Map of Dharma Forest.
- Fix a {%= L_NORMAL %} issue that may cause some item counts to display unusual values (e.g., 413/812) when not logged in.
- Fix a {%= L_NORMAL %} issue that may cause the map to switch to non-fullscreen mode after exiting and re-opening the map in Fullscreen Mode.
- Fix a {%= L_NORMAL %} issue that may cause the text of Vourukasha Oasis not to display.
- Fix a {%= L_NORMAL %} issue where the \[Tugini Hollow\] layer not to display as the final version.
- Fix a {%= L_NORMAL %} issue that may cause a series of pre-existing and post-issues in Overlay Mode.
- Remove Auto Oculus.
- Add an option to clear the tracking cache.

:::

::: timeline Beta3.6: 2023-04-12

- Update map and resources for Girdle of the Sands.
- Fix a {%= L_NORMAL %} issue that may cause border effect incorrectly displays in non-Teyvat areas.
- Fix a {%= L_NORMAL %} issue where the boundary effects may be in the incorrect layer when switching areas.
- Fix a {%= L_NORMAL %} issue where other items in Chest category can not be deselected after selection.
- Optimize touch screen adaptation.
- Change application icon.
- Update installer.

:::

::: timeline Beta3.5: 2023-03-06

- Fix a {%= L_RARE %} issue that may cause the opacity of underground and aboveground pins to not switch properly after data update.
- Fix a {%= L_RARE %} issue where the font outline of base map may not render properly.
- Fix a {%= L_NORMAL %} issue where the status of Teleport Waypoints may not be saved.
- Fix a {%= L_NORMAL %} issue where download progress may reset during re-downloading after closing the Position Tracker download window.
- Fix a {%= L_NORMAL %} issue that may cause abnormal animation behavior when re-completing download after clearing the download cache.
- Fix a {%= L_NORMAL %} issue: When exit and re-open Map during data download, data may display as a negative number when a re-download starts.
- Fix a {%= L_NORMAL %} issue that may cause the oculus popup window to be larger than others.
- Optimize the reset logic for filter options.
- Improve shader performance for boundary effects.

:::

::: timeline Beta3.4.10: 2023-02-14

- Fix a {%= L_RARE %} issue that may cause Canvas malfunctions, leading to a series of related UI anomalies.
- Fix a {%= L_NORMAL %} issue that may cause some map text to be obscured by the base map.
- Optimize the minimum opacity of pins.
- Optimize the shortcut key tips for Overlay Mode.
- Optimize pin opacity slider.
- Optimize the slider interaction logic, now allowing input values manually.
- Add a confirmation popup before opening the webpage.

:::

::: timeline Beta3.4.9: 2023-02-12

- Fix a {%= L_RARE %} issue that may cause abnormal UI scaling of pins after data update.
- Fix a {%= L_NORMAL %} issue that may cause some map text to be obscured by the base map.

:::

::: timeline Beta3.4.8: 2023-02-12

- Fix a {%= L_LEGEND %} issue that may cause UI interactions to freeze.
- Fix a {%= L_RARE %} issue that may cause data updates to fail.
- Fix a {%= L_NORMAL %} issue that may cause Teleport Waypoints to be hidden after selecting, due to the "Hide 'Found' Pins" option being enabled.
- Fix a {%= L_NORMAL %} issue where selecting Teleport Waypoints after enabling "Hide 'Found' Pins" may cause them to be hidden.

:::

::: timeline Beta3.4.7: 2023-02-11

- !!Fix a {%= L_LEGEND %} issue that may cause severe lag if the popup is closed before the image finishes loading when clicking on a pin (not fully fixed, might be resolved in next update).!!
- Fix a {%= L_RARE %} issue where the Teleport Waypoint popup may not be able to open.
- Fix a {%= L_RARE %} issue where Unusual Hilichurl may have refresh time.
- Fix a {%= L_RARE %} issue where Map may unable to exit when the network connection is poor.
- Fix a {%= L_RARE %} issue where unable to select other map areas after deactivating Easter Egg Mode in Golden Apple Archipelago Region.
- Fix a {%= L_RARE %} issue where show/hide status of Teleport Waypoints may be incorrect during initialization.
- Fix a {%= L_RARE %} issue where popup text may be incomplete while the image is loading.
- Add Auto Reset Refreshable Pins.
- Reduce delay when selecting a pin, now the selection will complete instantly, even if you are disconnected from the server.

:::

::: timeline Beta3.4.6: 2023-02-10

- !!Fix a {%= L_LEGEND %} issue that may cause severe lag after running for a period of time (not fully fixed, might be resolved in next update).!!
- Fix a {%= L_RARE %} issue where pin status may not refresh when switching saves.
- Fix a {%= L_RARE %} issue which may unable to scroll down when there are more than 6 saves.
- Fix a {%= L_RARE %} issue that may cause the program to freeze when exiting after the Position Tracker module is loaded.
- Fix a {%= L_NORMAL %} issue where Camera Lock may still work when it is deactivated.
- !!Fix a {%= L_NORMAL %} issue where popup text may incompletely displayed when loading image (not fully fixed, might be resolved in next update).!!
- Fix a {%= L_NORMAL %} issue where Cave Entrances in Sumeru may display incorrectly when enabling Multi-Layered Mode in other map areas.
- Fix a {%= L_NORMAL %} issue where the "Delete Canvas" button may act as duplicate in non-Chinese languages.
- Fix a {%= L_NORMAL %} issue where item filter may automatically fold when switching areas in Auto-Expand Mode.
- Add Save Rollback, with independent rollback for cloud and local saves.
- Add draggable UI.
- Add Show All Layers in Multi-Layered Mode.
- Add a new option to unbind shortcuts.
- Add an option to clear download cache of Position Tracker.
- Add a marker for downloaded version of Position Tracker.
- Optimize scaling logic for all popup UIs.
- Optimize the switching smoothness of Layered Maps and selected pins.
- Improve rendering efficiency.

:::

::: timeline Beta3.4.5: 2023-01-30

- Fix a {%= L_RARE %} issue where some items may display incorrectly when first rendered.
- Fix a {%= L_RARE %} issue where some items' filter types may not be repeatable.
- Fix a {%= L_NORMAL %} issue where translation of Reset Pin button may not apply.
- Fix a {%= L_NORMAL %} issue where unable to change display mode.
- Refactor the Position Tracker loading method, now it will update independently.
- The Position Tracker module now allows version selection.
- Remove Position Tracker module from the package, significantly reducing the package size.
- Optimize the version detection logic, now will check the version before downloading resources.

:::

::: timeline Beta3.4.4: 2023-01-29

- Fix a {%= L_NORMAL %} issue where unable to deselect some items.
- Fix a {%= L_NORMAL %} issue where the auto-update path may be incorrect.

:::

::: timeline Beta3.4.3: 2023-01-29

- {color:#e13636}**This version has an issue with automatic updates. Please update the version manually!**{/color}
- Fix a {%= L_RARE %} issue where underground pins in certain regions may not display underground marker.

:::

::: timeline Beta3.4.2: 2023-01-28

- {color:#e13636}**This version has an issue with automatic updates. Please update the version manually!**{/color}
- !!Update the independent auto-update for Position Tracker (Postponed).!!
- Update Layered Map for Desert of Hadramaveth (Thanks to "Teyvat Map Institute" for providing Layered Map of underground areas)
- Update DLL of Position Tracker.
- Fix a {%= L_RARE %} issue where Teleport Waypoints may display abnormally after data update.
- Fix a {%= L_RARE %} issue where icon may display as \[?\].
- Fix a {%= L_NORMAL %} issue that may cause incorrect scaling of Teleport Waypoints when scaling UI.
- Fix a {%= L_NORMAL %} issue where text of Safhe Shatranj may display abnormally.
- Fix a {%= L_NORMAL %} issue that may cause a failure in loading save, or save corruption when failed to edit saves.
- Fix a {%= L_NORMAL %} issue that may cause incorrect aboveground or underground state display for certain pins.
- !!Add fullscreen/windowed mode and a bunch of resolution settings (currently unusable due to a bug, will be fixed in the next version).!!
- Optimize the width of sub-region selection buttons to 4 Chinese characters.
- Optimize the item reset logic, now will no longer reset one-time pins.
- Add opacity configuration options for both aboveground and underground pins.
- Add options to toggle show/hide cave entrances in Multi-Layered Mode.

:::

::: timeline Beta3.4.1: 2023-01-22

- Update Position Tracker for Desert of Hadramaveth.
- Optimize visual performance of underground pins in Desert of Hadramaveth.
- Fix an {%= L_EPIC %} issue where pin counts may display as negative numbers.

:::

::: timeline Beta3.4: 2023-01-18

- Update map and resources for Desert of Hadramaveth.
- Fix an {%= L_EPIC %} issue that may cause panel data to fail refreshing, leading to item counts like 413/812. Errors will now directly prompt an alert.
- Fix an {%= L_EPIC %} issue where data refresh error may cause item count displays as 413/812. Now it will directly throw out a prompt when an error occurs.
- Fix a {%= L_NORMAL %} issue where Waverider Anchors in Sumeru may not display.
- Further optimize the UI scaling logic, making UI scaling more reasonable now.
- Optimize the hot update resource download, now you can clear and redownload resources.
- Improve visual performance for underground pins, now they have special markers (this also applies to all regions, including Inazuma).
- Optimize the texture of the zooming bar, making it a lot more clearer.
- Optimize the visual style of the settings button in the bottom-right corner to match the in-game design.
- Update Settings interface, adding numerous new options, paths, and shortcuts. For detailed content, please check the settings by clicking the top-right corner after the update.
- Update the Position Tracker, now supporting Genshin Impact · Cloud. !!(Maybe)!!

:::

::: timeline Beta3.3: 2022-12-30

- Fix a {%= L_RARE %} issue that may cause save data to be corrupted.
Fix a {%= L_RARE %} issue that may cause the filter can not update pin data when exiting the program without saving data locally.
- Fix a {%= L_RARE %} issue that may prevent deselecting an item in other types when multiple item types are selected simultaneously.
- Fix a {%= L_NORMAL %} issue that may cause teleport waypoints to appear incorrectly in the Lore.
- Optimize the UI scaling logic, now the UI scaling is more reasonable. !!(Though it's still hard to see the panel clearly on very low resolutions)!!
- !!Update the Position Tracker, now supporting Genshin Impact · Cloud (stability tests not passed yet, waiting for the next update).!!
- Optimize the height of the chest filter bar, now the chest category default displays 3 rows.
- Improve icon resolution.
- Add DLL version display for Position Tracker.

:::

::: timeline Beta3.1.4: 2022-10-07

- Fix a {%= L_LEGEND %} issue where continuous error with Position Tracker may cause the program to crash.
- Fix a {%= L_RARE %} issue again where the failure of pin data decompression may cause failed to enter level.
- Fix a {%= L_RARE %} issue where the Overlay Mode shortcut initialization may become something strange.
- Fix a {%= L_RARE %} issue again where time calculation error that caused incorrect time calculation during automatic saving of waypoint data.
- Fix a {%= L_RARE %} issue again where time calculation may be incorrect during auto-saving pin data.
- Update Layered Map for Desert of Hadramaveth again.
- Optimized the range of Camera Lock. Now the camera will move only when the character has moved a certain distance.
- Optimized the interaction logic of underground areas in desert areas of Sumeru.
- Optimized the pin ID position and title length of pin popup.

:::

::: timeline Beta3.1.3: 2022-10-06

- Fix a {%= L_RARE %} issue where pin data extraction error may cause unable to enter level.
- Fix a {%= L_NORMAL %} issue where pins can not be reset when they are not displayed.
- Fix a {%= L_NORMAL %} issue that may cause incorrect auto-save progress display on exit (does not affect progress actually).
- Fix a {%= L_NORMAL %} issue that may cause the Position Tracker icon to appear abnormally small.
- Update layered map of Sumeru desert areas.
- Add Pinned Window.
- Add customized shortcut for Overlay Mode.
- Optimize the display layer of the Oculus, so they won't be covered by other pins.
- Optimize the size of the Oculus, now it's much larger.
- Fix multiple errors with the Position Tracker, though there are still some issues with it in Controller Mode.

:::

::: timeline Beta3.1.2: 2022-10-05

- Fix a {%= L_NORMAL %} issue where the map may stop moving immediately if the mouse leaves the window before the movement is fully completed.
- Fix a {%= L_NORMAL %} issue that may cause incorrect status when showing or hiding pins.
- Update Position Tracker for Controller Mode and reduce crashes during tracking.
- Add an "Folded" option to item filter panel, now clicking on it will cycle through three states. And we also optimize the toggle descriptions.
- Optimize the data update logic, now it will update silently and load manually.
- Optimize the data storage format for faster download speeds and update times.
- Fix an issue where selecting pins may have a delay, now the maximum delay will be no more than 1 second.
- Fix the issue where pressing Alt+M may cause the mouse to click on the desktop. (uncertain about whether it has been fixed)

:::

::: timeline Beta3.1.1: 2022-10-01

- Update Position Tracker for Great Red Sand.
- Update Layered Map for Great Red Sand.
- Fix a {%= L_RARE %} issue that may cause save failure after data update.
- Add a new mode to the Position Tracker to address positioning failures.
- Improve the accuracy of the Position Tracker.
- Optimize the bottom-right settings, now they can be collapsed.
- Add Auto Oculus
- Add Camera Lock

:::

::: timeline Beta3.1: 2022-09-28

- Update map and resources for Great Red Sand.
- Update Layered Map for Great Red Sand.
- Fix a {%= L_NORMAL %} issue where the initial state of underground areas may be abnormal.
- Optimize the screenshot logic, only the selected region will be captured now to reduce performance overhead.

:::

::: timeline Beta3.0.2: 2022-09-06

- Fix a {%= L_RARE %} issue where the size of arrow may be incorrect after zooming when it is outside of the tracking area.
- Fix a {%= L_RARE %} issue that may cause Auto Save may not copy the local save when first logged in. Now, when creating a new save, it will ask whether to copy save from the local save or not before logging in.
- Fix a {%= L_RARE %} issue where certain devices may unable to use Position Tracker (fixed, if it still doesn't work, try updating your graphics drivers and restarting the map client).
- Optimize the Position Tracker, now it supports 2560×1080 ultrawide monitors.
- Optimize the readability of description text of the option "Hide 'Found' Pins".
- Optimize the scrolling speed of scrollbar.

:::

::: timeline Beta3.0.1: 2022-09-02

- Fix a {%= L_RARE %} issue where the jump button outside the auto-tracking area may display incorrectly.
- Add a option to toggle Layered Map. (Thanks to "Teyvat Map Institute" for providing Layered Map of underground areas)
- Update Position Tracker for all regions including Sumeru, The Chasm · Underground Mines and Enkanomiya! (only tested the performance at 1920×1080 resolution)
- Optimize cooldown of cancelling data update, now the interval will increase exponentially.
- Optimize the readability of the popup text when overwriting saves.

:::

::: timeline Beta3.0: 2022-08-24

- Update map and resources for Dharma Forest.
- Fix a {%= L_RARE %} issue where unable to select pins after data update.
- Fix a {%= L_RARE %} issue where item count may incorrect.
- Pin descriptions are now available for Teleport Waypoint.

:::

::: timeline !!Beta2.9: Postponed…!!

:::

::: timeline Beta2.8: 2022-07-23

- {color:#e13636}**Warning!**{/color} Previous versions may unable to update to this version automatically. If you encounter this issue, please manually download the update package!
- Fix a {%= L_RARE %} issue where item information may not synchronized when switching from the web version to the client.
- Fix a {%= L_RARE %} issue that may cause Map Screenshot malfunctions.
- Fix a {%= L_RARE %} issue where auto-update may not work.
- Fix a {%= L_NORMAL %} issue where data update may not update images and texts.
- Fix a {%= L_NORMAL %} issue where certain translations may not apply.
- Fix a {%= L_NORMAL %} issue where pin video button may disappear.
- Optimize the pin ID information storage, now use the new ID.
- Turn a mysterious bug into a new feature, popups can now be scaled by scroll wheel!

:::

::: timeline Beta2.7.5: 2022-07-20

- Fix a {%= L_RARE %} issue that may cause item selection error when updating data while switching to other maps without selecting any item after launching Map.
- Fix a {%= L_RARE %} issue where item count may not decrease after pin auto-refresh.
- Fix a {%= L_RARE %} issue that may cause translation errors when switching regions and languages after data update.
- Fix a {%= L_RARE %} issue where data update may unable to update new items.
- Optimize the selection effects for the four islands in the Golden Apple Archipelago region.
- Add tooltip for island switching in the Golden Apple Archipelago region.
- Add tooltips for pins that are not in the correct island state.
- {color:#e13636}**This version is unable to automatically update due to some issues. Please update manually!**{/color} This issue does not affect those who updates automatically from version 2.7.3 or earlier, nor those using overwrite installation.

:::

::: timeline Beta2.7.4: 2022-07-19

- Fix a {%= L_EPIC %} issue where pins may appear in incorrect locations on operating systems with different language settings.
- Fix a {%= L_RARE %} issue where certain pins may not display due to network issues in the Golden Apple Archipelago region.
- Fix a {%= L_RARE %} issue where the program may freeze after data update (same as in version 2.7.2, but triggered in a different circumstance).
- Fix a {%= L_NORMAL %} issue where the base map text in Japanese may appear as a white box.
- Fix a {%= L_NORMAL %} issue that may cause translation errors after switching region.
- Optimize the data download logic, now it will retry up to 5 times.
- {color:#e13636}**This version is unable to automatically update due to some issues. Please update manually!**{/color} This issue does not affect those who update automatically from version 2.7.3 or earlier, nor those using overwrite installation.

:::

::: timeline Beta2.7.3: 2022-07-17

- Fix a {%= L_RARE %} issue where updating data without switching maps after startup may cause item selection error
- Fix a {%= L_RARE %} issue where the program may freeze after data update.

:::

::: timeline Beta2.7.2: 2022-07-16

- Fix a {%= L_NORMAL %} issue that may cause treasure chests not to highlight when switching island forms first and then filtering for chests.
- Fix a {%= L_NORMAL %} issue where chests may not highlight when selecting chests after switching island forms for the first time.
- Revert Position Tracker DLL to previous version. Will be updated again after tests are completed.

:::

::: timeline Beta2.7.1: 2022-07-15

- Addressed a bunch of issues.

:::

::: timeline Beta2.7: 2022-07-15

- Update map and resources for Golden Apple Archipelago region.
- Refactor code logic.
- Addressed a bunch of issues.
- Add various of new features.
- Significantly optimize the program's smoothness, now it runs smoothly even at full load.
- Improve backend efficiency, now the program won't consume much GPU even when running in the background with Background Suspension disabled.
- Attempted to fix the C++ error in the Position Tracker.
- "Methods" and "Quality" of chests can be selected simultaneously.
- Dragonspine is now split off from Mondstadt as a new region.
- Certain pins is now related to multiple items, selecting one will select all.
- Increase the startup speed by 200%! Pin loading speed is now 1000% faster, completing in an instant!
- !!Add a new feature that may encounter Geo purgatory while launching Map.!!
- !!Add a bunch of bugs.!!

:::

::: timeline Beta2.6.1: 2022-04-03

- Fix a {%= L_RARE %} issue where the region selection may be unavailable when opening the client for the first time.
- Fix a {%= L_RARE %} issue that may cause auto-update malfunctions.
- Increase the client request limit to 2 million.

:::

::: timeline Beta2.6: 2022-03-11

- !!Add unexpected new features to the code.!!
- Fix a {%= L_NORMAL %} issue that may cause an initialization error when double-clicking "Click to Enter". !!(not fixed yet, but will definitely be fixed next time (well, actually it's fixed now; if not, please run the updater to update manually))!!
- Fix a {%= L_NORMAL %} issue where a continuos "Failed to obtain server version" state may prevent entry. Now, clicking on "Retry" will switch resource server and try again.
- Known a {%= L_RARE %} issue that prevents this version from running auto-update. Please update manually.

:::

::: timeline Beta2.5: 2022-02-16

- Update map and resources for Three Realms Gateway Offering.
- Update Position Tracker for Tsurumi Island.
- Add resource hot update logic !!(Also introduced numerous unknown issues)!!
- Fix an issue where saves may be overwritten. !!(maybe)!!
- Optimize the image resource display mode.
- Optimize loading page.
- Make minor adjustments to some UI elements.

:::

::: timeline Beta2.4: 2022-01-05

- Update map and resources for Enkanomiya.
- Add Map Screenshot.
- Add numerous tooltips and a toggle for displaying tooltips.
- Improve Canvas operation experience by adding canvas editing interface.
- Fix a {%= L_EPIC %} issue where certain line segments may disappear after completing route drawing and relaunching Map.
- Fix a {%= L_RARE %} issue where abnormal filter restoration may cause an operation lag.
- Fix a {%= L_RARE %} issue where deleting anchors may cause anomalies when using Canvas.
- Fix a {%= L_NORMAL %} issue that may trigger incorrect log outputs when drawing lines on the Canvas.
- Fix a {%= L_NORMAL %} issue that may cause error log outputs of line segments of the Canvas.
- Fix a {%= L_NORMAL %} issue where "Add Canvas" text may not display.
- Fix a {%= L_NORMAL %} issue that may inadvertently mark pins upon releasing Ctrl + RMB during Batch Selection.
- Fix a {%= L_NORMAL %} issue where Random Event and World Quest pins may display abnormally in Mondstadt.
- Fix a {%= L_NORMAL %} issue where the map may fail to load under certain circumstances.
- Optimize the effect where clicking on an empty map, now it won't generate an unclear click box.
- Optimize line drawing feature, now clicking on a POI pin while editing a line segment will pass the POI coordinates into the line.
- Optimize the display of selected items, now the delete icon only appears when hovering over them.
- Optimize the size of the region selection buttons to make them easier to click.
- Optimize translation system, now translations will be updated automatically.
- Optimize map resources to improve fluency.
- Add translation coverage to the language selection.

:::

::: timeline Beta2.3: Postponed…

:::

::: timeline Beta2.2: 2021-10-13

- Update map and resources for Tsurumi Island.
- Fix a {%= L_NORMAL %} issue that may cause font errors on Esperanto.

:::

::: timeline Beta2.1.3: 2021-09-10

- Fix a {%= L_NORMAL %} issue where the program may unable to restore from the system tray when it is minimized.
- Optimize map data update logic, now a popup will automatically appear when data updates are detected.
- Optimize the filter auto-expand logic, now it will automatically collapse after a period of time when the mouse leaves the program.
- Optimize the region selection logic, so the issue which unable to find Watatsumi Island, Seirai Island should no longer reoccur.
- Optimize popup style when update fails, making it more elegant.

:::

::: timeline Beta2.1.2: 2021-09-03

- Update Position Tracker for Watatsumi Island, Seirai Island.
- Fix a {%= L_RARE %} issue where a small floating window may appear when switching applications by using Alt+Tab.
- Fix a {%= L_RARE %} issue that may cause the floating window to flicker erratically, and the map may reopen unexpectedly after a certain period when it is closed by using Alt+M.
- Fix a {%= L_NORMAL %} issue that may cause the pin popup to be penetrated while viewing guide videos, allowing user to interact with pins underneath.

:::
