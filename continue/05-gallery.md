# 05 · 图库：三列文件夹与图片灯箱

## 本步提交内容

- 新增 `gallery.html` + `js/gallery.js`。
- 新增 18 张本地示例 SVG 图片（6 个图集 × 3 张），位于 `assets/gallery/`。
- `css/style.css` 新增三列图库、圆角文件夹卡片、全屏灯箱与响应式样式。

## 图集列表

| 顺序 | 图集 | 英文 | 图片数 |
| ---: | --- | --- | ---: |
| 01 | 山野之间 | Between Mountains | 3 |
| 02 | 城市切片 | City Fragments | 3 |
| 03 | 海风来信 | Letters from the Sea | 3 |
| 04 | 校园四季 | Campus Seasons | 3 |
| 05 | 日常静物 | Quiet Objects | 3 |
| 06 | 光影实验 | Studies in Light | 3 |

- 文件夹卡片本身展示第 1 张图片作为封面；三列布局在 1440px、390px 下都保持每行 3 个。
- 卡片整体是圆角矩形，包含文件夹编号、图片数量、标题、英文名与日期。
- 封面使用 4:3 比例；图片全部本地化，无远程图片依赖。

## 灯箱交互

- 点击封面按钮打开模态框，显示大图、图注、页码与缩略图。
- 支持点击左右箭头、`←` / `→` 键切换图片；`Esc` 关闭。
- 点击遮罩或右上角关闭按钮关闭。
- 打开时锁定 `body` 滚动，焦点移到关闭按钮；`Tab` 在对话框内循环；关闭后焦点回到触发卡片。
- 模态框具有 `role="dialog" aria-modal="true"`、`aria-labelledby` 和 `aria-describedby`。
- 切换图片时若新图尚未解码，会先降低透明度，加载完成后淡入；同时预加载前后图片。

## 后端功能与预留

| 前端调用 | HTTP 接口 | 说明 |
| --- | --- | --- |
| `BlogAPI.getGalleryAlbums()` | `GET /api/gallery/albums` | 图集数组，包含封面和照片数组 |
| `BlogAPI.getGalleryAlbum(albumId)` | `GET /api/gallery/albums/:albumId` | 单图集详情，已预留但当前弹窗直接使用列表数据 |
| — | 对象存储 / CDN URL | 真实图片地址建议由后端返回可访问的 URL |

图片数据结构：

```json
{
  "id": "mountains",
  "title": "山野之间",
  "en": "Between Mountains",
  "description": "周末向城外走。",
  "date": "2026.10",
  "cover": "https://cdn.example.com/mountains-1.jpg",
  "photos": [
    { "src": "https://cdn.example.com/mountains-1.jpg",
      "alt": "晨雾中的层叠山脊",
      "caption": "清晨六点的山脊。" }
  ]
}
```

## 验证记录

- 桌面与移动端均为每行 3 个文件夹，6 个图集全部渲染；
- 18 张本地图片路径存在且浏览器加载成功；
- 点击封面成功打开模态框，封面加载成功、缩略图为 3 张；
- `ArrowRight` 将页码切到 `02 / 03`，`Esc` 正常关闭并解除滚动锁；
- 图库图片全部为本地文件，无外部图片 404。
