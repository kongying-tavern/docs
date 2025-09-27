---
title: "[Web] Change Log"
layout: Post
authors:
  - aaaaaaa8
  - idangoi
---

{define:T_REFACTOR}:recycle: Refactor{/define}
{define:T_FEAT}:sparkles: New Feature{/define}
{define:T_BUG}:bug: Bug Fixes{/define}
{define:T_SECURITY}:lock: Security Optimizations{/define}
{define:T_ENHANCE}:zap: Feature Optimizations{/define}
{define:T_RES}:bento: Resource Update{/define}
{define:T_MISC}:page_facing_up: Miscellaneous{/define}
{define:T_I18N}:globe_with_meridians: I18n{/define}
{define:T_DEPRECATE}:fire: Deprecated{/define}

**Hi，Here's the change log of the web version of Kongying Tavern Genshin Interactive Map.\(o゜▽゜\)o☆**

**We have carefully noted every feedback and suggestion regarding the Kongying Tavern Genshin Interactive Map, and we are continuously following up on them. Below are the feature update logs of the Map-take a look and see if there's anything you're interested in!**

**If you like our Map, you can [Support Us](https://yuanshen.site/docs/support-us.html)\~**

----

::: timeline 2025-05-15

### {%= T_MISC %}

- Fix links of Feedback and Change Log.

:::

<!-- more -->

::: timeline 2024-09-23

### {%= T_BUG %}

- Fix item sorting of item list.

:::

::: timeline 2024-09-03

### {%= T_BUG %}

- Fix an issue that incorrect fetching logic may cause item icons unable to be fetched.

:::

::: timeline 2024-07-27

### {%= T_RES %}

- Add icons for Natlan and Snezhnaya.

:::

::: timeline 2024-07-22

### {%= T_MISC %}

- Change the description of "Underground Map" to "Layered Map".

:::

::: timeline 2024-07-17

### {%= T_ENHANCE %}

- Optimize style of region selector and region label.

### {%= T_RES %}

- Add region switch for Simulanka.
- Add color scheme for Natlan icon.

:::

::: timeline 2024-07-01

### {%= T_BUG %}

- Fix an issue where deselecting layer stack by clicking on the layer may trigger sub-region click events.

:::

::: timeline 2024-06-10

### {%= T_ENHANCE %}

- Update harmless prompt logic.

:::

::: timeline 2024-06-09

### {%= T_RES %}

- Update page icon.

:::

::: timeline 2024-04-27

### {%= T_BUG %}

- Fix an issue where clicking on pins near the sub-region selection panel may trigger sub-region clicking events.

:::

::: timeline 2023-12-02

### {%= T_BUG %}

- Fix the issue where underground pin markers and underground status may incorrectly determined.

:::

::: timeline 2023-10-29

### {%= T_REFACTOR %}

- Separate the code related to the pin description narration function.

### {%= T_FEAT %}

- Add the playback feature of Aranara's Songs.

:::

::: timeline 2023-10-28

### {%= T_FEAT %}

- Add narration feature of pin description.

### {%= T_BUG %}

- Fix an issue that may cause an automatic log out.
- Fix the compatibility check for the voice engine.

:::

::: timeline 2023-09-17

### {%= T_FEAT %}

- Introduced layer counting for the Layered Map.

### {%= T_BUG %}

- Fix an issue where additional layer of the Layered Map may display above the overlay layer.

:::

::: timeline 2023-09-12

### {%= T_BUG %}

- Fix an issue where unable to deselect selected item.

### {%= T_MISC %}

- Adjust data structure based on changes in the API.

:::

::: timeline 2023-08-31

### {%= T_FEAT %}

- Add Portrait Mode support.
- Add a popup for Portrait Mode.
- Add region switching for Portrait Mode.

### {%= T_BUG %}

- Fix an issue where sub-region options may not close when switching regions in Portrait Mode.
- Fix an issue with region initialization in Portrait Mode.
- Fix an issue with layered map refreshing in Golden Apple Archipelago region.

:::

::: timeline 2023-08-30

### {%= T_MISC %}

- Update harmless prompt to the app.

:::

::: timeline 2023-08-29

### {%= T_BUG %}

- Fix the processing logic for Layered Map image configuration.

:::

::: timeline 2023-08-26

### {%= T_RES %}

- Change the icon for control strip.

:::

::: timeline 2023-08-24

### {%= T_REFACTOR %}

- Separate the code of Easter Egg Mode.
- Separate the code of region selector.

### {%= T_FEAT %}

- Add multi-layer selection feature for Layered Map.

:::

::: timeline 2023-08-19

### {%= T_FEAT %}

- Add a feature to automatically focus on the current region when switching regions.

### {%= T_BUG %}

- Fix an issue where Map may freeze after switching region.
- Fix an issue where overlay layer may abnormally display when selecting an Layered Map.
- Fix an issue where icon may not cleared after clearing selected category.
- Fix an issue where aggregated pins may not be displayed as transparent.

### {%= T_ENHANCE %}

- Adjust the merging logic for remote configurations.

:::

::: timeline 2023-08-18

### {%= T_BUG %}

- Fix an issue where the base map may not change when switching regions.
- Fix an issue with chest pins aggregation.

:::

::: timeline 2023-08-16

### {%= T_REFACTOR %}

- Refactor Layered Map in Sumeru to support layered map switching in all map areas.
- Refactor map rendering to support dynamic map updates.
- Refactor map layer to support dynamic Layered Map loading.
- Refactor region selector to support dynamic region loading.

### {%= T_FEAT %}

- Add Easter Egg Region.
- Add Area Blocking.

### {%= T_BUG %}

- Fix an issue with generating underground icon when item icon does not have an image.

### {%= T_RES %}

- Update map and resources for version 4.0.

:::

::: timeline 2023-08-14

### {%= T_BUG %}

- Fix an issue where the background may not transparent when switching to underground areas in Sumeru.

### {%= T_ENHANCE %}

- Add the size of layer switching button in Sumeru.

:::

::: timeline 2023-07-26

### {%= T_BUG %}

- Fix an issue where abnormal data parsing of layered pins may cause the layered pins failed to load.

:::

::: timeline 2023-07-06

### {%= T_BUG %}

- Fix an display issue of Teleport Waypoint.

:::

::: timeline 2023-07-05

### {%= T_BUG %}

- Fix an issue where pins may not display when their item count is set to 0.
- Fix an issue where unable to switch to 3.8 area.
- Fix an issue with Teleport Waypoint popup positioning.

### {%= T_RES %}

- Update map and resources for version 3.8.

:::

::: timeline 2023-04-28

### {%= T_BUG %}

- Fix an issue where item count may abnormal when item count is not set to 1.

:::

::: timeline 2023-04-27

### {%= T_ENHANCE %}

- Improve save logic.
- Improve UI appearance.
- Improve the mobile UI display of layered pins in Sumeru area.

:::

::: timeline 2023-04-25

### {%= T_BUG %}

- Fix an issue where layered pins switching may abnormal.

### {%= T_ENHANCE %}

- Improve the code logic for Sumeru layered map selection.

:::

::: timeline 2023-04-24

### {%= T_REFACTOR %}

- Refactor Layered Map Selector of Sumeru area.

### {%= T_RES %}

- Update layered map to the latest version.

:::

::: timeline 2023-04-23

### {%= T_BUG %}

- Fix an issue where the page may freeze when displaying Teleport Waypoints in Mondstadt.

:::

::: timeline 2023-04-12

### {%= T_RES %}

- Update map and resources for version 3.6.

:::

::: timeline 2023-03-29

### {%= T_RES %}

- Update webpage icon.

:::

::: timeline 2023-03-07

### {%= T_BUG %}

- Fix an issue where item may not display when item type is null.
- Fix an issue where aggregated pins' opacity in the Layered Map of Sumeru may incorrectly display after being fully marked.

:::

::: timeline 2023-02-28

### {%= T_BUG %}

- Fix an issue where creating a new save for the first time may not take effect.

:::

::: timeline 2023-02-16

### {%= T_FEAT %}

- Add a count for marked pins.

:::

::: timeline 2023-02-01

### {%= T_FEAT %}

- Add region switch for the Great Red Sand.

### {%= T_BUG %}

- Fix an issue where layer may display incorrectly in the Great Red Sand.

### {%= T_ENHANCE %}

- Add layer tags to layered pins.
- Change pin popup style.

:::

::: timeline 2023-01-31

### {%= T_FEAT %}

- Add layer switch for the Great Red Sand.
- Add a option to show layered pins only.

### {%= T_ENHANCE %}

- Adjust the map layer hierarchy for the Great Red Sand.

:::

::: timeline 2023-01-30

### {%= T_RES %}

- Add map and layered map for the Great Red Sand.

:::

::: timeline 2023-01-18

### {%= T_RES %}

- Update map and resources for version 3.4.

:::

::: timeline 2023-01-16

### {%= T_BUG %}

- Fix an issue where creating a new save for the first time may fail.
- Fix several issues.

### {%= T_RES %}

- Update layered map for the Great Red Sand.

:::

::: timeline 2023-01-15

### {%= T_ENHANCE %}

- Optimize logic of creating new save, now it will upload current data while creating a new save.

:::

::: timeline 2023-01-12

### {%= T_BUG %}

- Fix an issue where TCG players may incorrectly categorized under Teleport Waypoints.
- Fix an issue where layered map may still display when switching regions while layered map is enabled in Sumeru.

:::

::: timeline 2022-12-30

### {%= T_ENHANCE %}

- Add a prompt before deleting a save.
- Add a red dot alert to save and save reminders while switching save.
- Make "Download Client" button visible exclusively on PC.
- Optimize the logic for automatically uploading local saves during login.
- Optimize the display style for Waverider Waypoints.

:::

::: timeline 2022-12-29

### {%= T_FEAT %}

- Add feature to transparentize aggregated pins after they are marked as found.
- Add external video playback support.

### {%= T_BUG %}

- Fix an issue where the "Clear Selected Items" button display may overflow.
- Resolve style conflicts in aggregated pin display.
- Fix an issue where pins are not cleared when switching back to Teyvat.
- Fix an issue where chest pins may not display when switching regions.
- Optimize style of the video playback button.

### {%= T_ENHANCE %}

- Optimize chest pins aggregation logic by grouping all chests into a single category.
- Adjust the aggregation range of chest pins.
- Adjust pin style.
- Adjust the appearance of the mouse pointer.
- Optimize item selection state logic.
- Adjust the map border appearance.
- Add animation to the selected item bar.
- Adjust the display size of unselected item icons.
- Add transition animation when switching regions.

:::

::: timeline 2022-11-14

### {%= T_FEAT %}

- Add save feature.
- Add "Hide Found Pins" feature.

### {%= T_ENHANCE %}

- Add filtering in the item selector to hide items without any pins.
- Improve transparency logic — pin icons now turn transparent as well.
- Add error response for image loading failures.
- Adjust the icon loading timing in dropdown lists.

### {%= T_DEPRECATE %}

- Disable the aggregation of Teleport Waypoints.

:::

::: timeline 2022-10-29

### {%= T_BUG %}

- Fix an issue where pin aggregation may not update when zooming the map.
- Fix an issue where pin status may not update when marking a pin.
- Fix an issue that may cause a state regression after switching regions.

### {%= T_ENHANCE %}

- Adjust the appearance of the region selector when it is collapsed.
- Update map plugins.
- Improve map animation effects.
- Improve the performance of icons and animations.
- Adjust the expand animation of filter.
- Adjust the icon rendering method of item selector list.

:::

::: timeline 2022-10-27

### {%= T_FEAT %}

- Sync the old pin aggregation feature.

:::

::: timeline 2022-10-17

### {%= T_MISC %}

- Update the URL of "Join Us".

:::

::: timeline 2022-09-19

### {%= T_ENHANCE %}

- Adjust code logic.

:::

::: timeline 2022-08-31

### {%= T_BUG %}

- Fix an issue where the style of "Mark Pin" toggle may incorrect.
- Fix an issue where data statistic may not apply.

:::

::: timeline 2022-08-30

### {%= T_FEAT %}

- Add a toggle for displaying Teleport Waypoints.

:::

::: timeline 2022-08-29

### {%= T_FEAT %}

- Teleport Waypoints now can be shown on the map.

### {%= T_ENHANCE %}

- Adjust the style of marked pins.

:::

::: timeline 2022-08-28

### {%= T_REFACTOR %}

- Update map to v3.

:::

::: timeline 2022-03-30

### {%= T_RES %}

- Update map and resources for version 2.6.

:::

::: timeline 2022-03-19

### {%= T_I18N %}

- Update the Japanese translation of the documentation.

:::

::: timeline 2022-02-16

### {%= T_RES %}

- Update map and resources for version 2.5.

:::

::: timeline 2022-01-09

### {%= T_FEAT %}

- Add a switch to toggle background animations.
- Add a switch to make marked pins transparent.

:::

::: timeline 2022-01-05

### {%= T_RES %}

- Update map and resources for Enkanomiya.

:::

::: timeline 2022-01-01

### {%= T_ENHANCE %}

- Adjust the appearance of the starry-sky background.

:::

::: timeline 2021-09-24

### {%= T_ENHANCE %}

- Adjust the appearance of friend links.

### {%= T_MISC %}

- Add a friend link for Teyvat Wiki.

:::

::: timeline 2021-09-06

### {%= T_BUG %}

- Fix an issue where foreign-language homepage icon may display incorrectly.

### {%= T_ENHANCE %}

- Adjust the appearance of friend links.

### {%= T_MISC %}

- Add a friend link for Feixiaoqiu.

:::

::: timeline 2021-09-02

### {%= T_FEAT %}

- Add a redirect feature for pins with videos in Simplified Chinese.

:::

::: timeline 2021-08-26

### {%= T_FEAT %}

- Add a popup for save selection once the user logs in.

:::

::: timeline 2021-08-20

### {%= T_BUG %}

- Fix an issue where the pin popup’s close button may display incorrectly.

:::

::: timeline 2021-08-15

### {%= T_BUG %}

- Fix an issue where saves cannot be switched.

### {%= T_MISC %}

- Add an ADrive download link to the client download page.

:::

::: timeline 2021-08-14


### {%= T_FEAT %}

- Add a changelog shortcut link to the footer of the homepage.

### {%= T_BUG %}

- Fix an issue where the pin completion button on the homepage may not work.

### {%= T_ENHANCE %}

- Merge page footer details.

:::

::: timeline 2021-08-13

### {%= T_SECURITY %}

- Add Content Security Policy (CSP).

### {%= T_DEPRECATE %}

- Remove Map Scale button.

:::

::: timeline 2021-08-03

### {%= T_ENHANCE %}

- Enhance night mode support for the redirect page.

:::

::: timeline 2021-07-28

### {%= T_ENHANCE %}

- Design a new error page for cases where JavaScript fails to load or when using IE browser.
- Improve browser compatibility for the documentation.
- Improve dark mode adaptation in the documentation.

### {%= T_MISC %}

- Add one-click access code copying for Baidu Netdisk links in the download page.

:::

::: timeline 2021-07-26

### {%= T_MISC %}

- Update and reorder the personal sponsor list.

### {%= T_I18N %}

- Update Japanese translations for Inazuma and Golden Apple Archipelago area.

:::

::: timeline 2021-07-19

### {%= T_BUG %}

- Fix an issue with map filter aggregation.

:::

::: timeline 2021-07-06

### {%= T_BUG %}

- Fix an issue that causes 404 errors on map tiles.

### {%= T_RES %}

- Update Golden Apple Archipelago map for English and Japanese.

### {%= T_MISC %}

- Update the sponsorship link.

### {%= T_DEPRECATE %}

- Remove the startup popup on the Japanese page.
- Remove map log.

:::

::: timeline 2021-06-11

### {%= T_RES %}

- Add map and resources for version 2.8 Golden Apple Archipelago area.

:::

::: timeline 2021-06-02

### {%= T_REFACTOR %}

- Refactor the frontend documentation.

### {%= T_BUG %}

- Fix an issue where log may be automatically deleted.

### {%= T_ENHANCE %}

- Improve map style.

### {%= T_MISC %}

- Add a Google Drive download link to the client download page.

:::

::: timeline 2021-05-26

### {%= T_FEAT %}

- Add log export.

### {%= T_ENHANCE %}

- Add auto Polyfill.

:::

::: timeline 2021-05-19

### {%= T_BUG %}

- Fix an issue where feedback still requires QQ or WeChat login when already logged in.

:::

::: timeline 2021-05-18

### {%= T_ENHANCE %}

- Add switch state memory.

:::

::: timeline 2021-05-15

### {%= T_ENHANCE %}

- Add a fallback error page for incompatible browsers to redirect to.

:::

::: timeline 2021-04-30

### {%= T_ENHANCE %}

- Add a language-based automatic redirection page.

:::

::: timeline 2021-04-01

### {%= T_FEAT %}

- Add Japanese version.

:::

::: timeline 2021-03-31

- Add English version.

:::

::: timeline 2021-03-22

### {%= T_RES %}

- Complete client-side updates for chest pins.
- Complete proofreading of all chest pins.
- Complete proofreading of all pins in Mondstadt.

:::

::: timeline 2021-03-12

### {%= T_MISC %}

- Add a friend link for Mona Uranai.

:::

::: timeline 2021-02-04

### {%= T_FEAT %}

- Add a feature to link with Today’s Materials.
- Add a toggle switch to show or hide Teleport Waypoints.

### {%= T_ENHANCE %}

- Adjust page information.

:::

::: timeline 2020-12-26

### {%= T_RES %}

- Update locations and images of Crimson Agates and chests in Dragonspine.
- Remake the icons of Crimson Agate and chests.

:::

::: timeline 2020-12-24

### {%= T_RES %}

- Update map and resources for version 1.2.
- Add locations of some Crimson Agates, chests, Chilled Meat and Starsilver Ores.

:::

::: timeline 2020-11-20

### {%= T_RES %}

- Update some pin information.
- Fix some pin issues.

:::

::: timeline 2020-11-17

### {%= T_RES %}

- Add locations of Meteorite Shards.

:::

::: timeline 2020-11-16

### {%= T_RES %}

- Update locations of Loaches and Bamboo Shoots.

:::

::: timeline 2020-11-13

### {%= T_RES %}

- Update locations of Unusual Hilichurls.
- Add a bunch of pins.

:::

::: timeline 2020-11-11

### {%= T_BUG %}

- Fix several potential issues.

### {%= T_ENHANCE %}

- Improve the auto-saving logic.

:::

::: timeline 2020-11-10

### {%= T_FEAT %}

- Add a cloud save login system based on Gitee Gist.
- Introduce automatic pin refresh, so you no longer have to unmark pins yourself!

:::

::: timeline 2020-10-20

### {%= T_BUG %}

- Fix an issue related to redirection.

### {%= T_RES %}

- Fix several pin issues.

:::

::: timeline 2020-10-19

### {%= T_MISC %}

- Site update.
- Prepare for login system update.

:::

::: timeline 2020-10-14

### {%= T_RES %}

- Update several pins belongs to Food and Alchemy.
- Adjust descriptions of some chest pins.

:::

::: timeline 2020-10-08

### {%= T_ENHANCE %}

- Adjust code.
- Improve font style.
- Release a version without Pin Aggregation.

:::

::: timeline 2020-10-06

### {%= T_ENHANCE %}

- Optimize aggregation style to make completion status clearer.
- Improve the appearance of the Oculus pins.
- Improve the appearance of popups.

### {%= T_RES %}

- Update several pin information.
- Add some new categories and new items.

:::

::: timeline 2020-10-03

### {%= T_RES %}

- Update pins of Small Lamp Grass.
- Calibrate some pins.

:::

::: timeline 2020-10-02

### {%= T_RES %}

- Update locations of Starconches.
- Adjust locations and images for several pins.

:::

::: timeline 2020-10-01

### {%= T_FEAT %}

- Add Pin Import.

### {%= T_RES %}

- Update several chest pins.
- Add several pins for Qingxin, Horsetail and Lotus Head.
- Update pins for Fatui Skirmishers, Treasure Hoarders (in Liyue), Whopperflowers, Mitachurl (in Mondstadt), Abyss Mage (in Mondstadt) and Ruin Guards (in Mondstadt).

:::

::: timeline 2020-09-29

### {%= T_RES %}

- Update several chest pins.
- Add locations of Whopperflowers and Geovishap Hatchlings.

:::

::: timeline 2020-09-28

### {%= T_FEAT %}

- Add Pin Aggregation.
- Add a notification for the number of completed treasure chests.

### {%= T_ENHANCE %}

- Improve certain UI interactions.

:::

::: timeline 2020-09-27

### {%= T_RES %}

- Update a bunch of chest pins.
- Adjust several pin locations of Violetgrass and update their images.

:::

::: timeline 2020-09-26

### {%= T_RES %}

- Update a bunch of chest pins.

:::

::: timeline 2020-09-25

### {%= T_ENHANCE %}

- Refresh the pin popup UI: images can now be hidden with a click, and the "?" placeholder won't appear for pins without images.

:::

::: timeline 2020-09-22

### {%= T_RES %}

- Update locations of Violetgrass, Glaze Lily and some chests in Liyue.

:::

::: timeline 2020-09-20

### {%= T_RES %}

- Update locations and images of some chests.

:::

::: timeline 2020-09-19

### {%= T_ENHANCE %}

- Update filter.
- Make Oculi larger and optimize pin appearance. Items you have obtained are now easier to identify.

### {%= T_RES %}

- Adjust Geoculus locations and update related images.

:::

::: timeline 2020-09-15

### {%= T_RES %}

- Update base map to official version.
- Update locations of Anemoculus and Geoculus to official version.

:::

::: timeline 2020-09-14

### {%= T_BUG %}

- Fix some issues.

### {%= T_ENHANCE %}

- The filter is now enabled by default on PC.

:::

::: timeline 2020-09-09

### {%= T_FEAT %}

- Add marking feature.

### {%= T_ENHANCE %}

- Redesign the filter UI appearance.
- Adjust webpage source code.

### {%= T_RES %}

- Add chests in Liyue.
- Add pictures for chests.

:::

::: timeline 2020-07-17

### {%= T_RES %}

- Add and remove locations of some elite enemies in Liyue.
- Add chests in Mondstadt.

:::

::: timeline 2020-07-07

### {%= T_ENHANCE %}

- Add outlines to pin icons.

### {%= T_RES %}

- Update locations of elite enemies in Liyue.

:::

::: timeline 2020-06-30

### {%= T_RES %}

- Update location of the last Geoculus.

:::

::: timeline 2020-06-29

### {%= T_RES %}

- Update locations of Crystal Ores and White Iron Ores in Mondstadt.

:::

::: timeline 2020-06-28

### {%= T_RES %}

- Update locations of Crystal Ores and White Iron Ores in Liyue.

:::

::: timeline 2020-06-23

### {%= T_RES %}

- Update locations of Wolfhook, Calla Lily, Valberry, Windwheel Aster, Cecilia, Philanemo Mushroom, Dandelion Seed, Noctilucous Jade and Cor Lapis.

:::

::: timeline 2020-06-20

### {%= T_ENHANCE %}

- Adjust menu interface.
- Adjust webpage code.

:::

::: timeline 2020-06-18

### {%= T_RES %}

- Update locations of Jueyun Chili, Silk Flower and Glaze Lily.

:::

::: timeline 2020-06-16

### {%= T_RES %}

- Update locations of 20 Shrines of Depths in Mondstadt and Liyue.

:::

![](https://foruda.gitee.com/images/1736948131955761755/ab609fa4_4922359.png)