# 空荧酒馆原神正交坐标系

## 稻妻版本前坐标系情况

目前空荧酒馆·原神地图网页版使用的是基于地球空间的坐标系。纬度范围为南纬 66.5 度至赤道，经度范围为 0 度至东经 90 度。显然这种坐标系没有拓展性，无法适应新地区的加入。

空荧酒馆·原神地图 Unity 客户端对此进行了优化，使用正交坐标系，大地图左上角为(-4096,-4096),右下角为(4096,4096)。但由于原点并不是确定的点，在适配时较难确定坐标。

米游社·观测枢·原神地图的比例与空荧酒馆·原神地图 Unity 客户端相同，区别在于米游社·观测枢·原神地图使用蒙德城风神像作为原点。

## 空荧酒馆原神正交坐标系

以下简称“提议坐标系”。

使用空荧酒馆·原神地图 Unity 客户端使用的坐标系比例，原点设为玉京台中心。

[示例](http://ysmap.projectxero.top/?url=yuanshen.site/default.json&size=4096)

## 转换方式

由空荧酒馆·原神地图网页版坐标系转为提议坐标系：

```javascript
const originalMapSize = [8192, 8192]
const centerOffsetFromLeftTop = [3568, 6286]
function project(lat, lng) {
  let sinLat = Math.sin((lat * Math.PI) / 180)
  return [
    (lng / 90) * originalMapSize[0] - centerOffsetFromLeftTop[0],
    (-Math.log((1 + sinLat) / (1 - sinLat)) / Math.PI) * originalMapSize[1] -
      centerOffsetFromLeftTop[1],
  ]
}
```

由提议坐标系转为空荧酒馆·原神地图网页版坐标系：

```javascript
function unproject(x, y) {
  let sinLat = Math.sin((lat * Math.PI) / 180)
  return [
    (2 *
      Math.atan(
        Math.exp(
          ((y + centerOffsetFromLeftTop[1]) / -originalMapSize[1] / 2) * Math.PI
        )
      ) *
      180) /
      Math.PI -
      90,
    ((x + centerOffsetFromLeftTop[0]) / originalMapSize[0]) * 90,
  ]
}
```

## 适配内容

- 网页版的 Leaflet.js 版本改为使用 `L.CRS.Simple`
- Unity 版的坐标适配只需在坐标上加上 `[centerOffsetFromLeftTop[0] - 4096, centerOffsetFromLeftTop[1] - 4096]`
- 后端管理平台适配正交坐标系
- 数据库坐标统一转为正交坐标系
- 网页版的 deck.js 版本改为使用 `deck.OrthographicView`

## 待完善内容

- Tile 相关
- 金苹果群岛地图
