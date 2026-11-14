# 08 · 后端接口契约与预留说明

> **当前项目没有实现任何真实后端。** 所有页面均为静态 HTML/CSS/JS，数据来自本地 Mock。
> 本文定义前端已预留的 HTTP 契约；把 `js/api.js` 里的
> `BLOG_API_CONFIG.useMock` 改为 `false` 后，前端会请求这些接口。

## 1. 接入方式

```js
// js/api.js
window.BLOG_API_CONFIG = {
  useMock: true,      // 改为 false
  baseUrl: "/api",    // 改到真实网关地址
  mockDelay: 90,
};
```

- 所有请求默认带 `Accept: application/json`；带 body 的请求自动加 `Content-Type: application/json`。
- 非 2xx 响应由前端捕获并展示错误状态。
- 前端只通过 `window.BlogAPI` 访问内容，页面不直接读取散落数据。
- 切换后端时，响应结构应与下文一致；字段名、分页字段不要改名。

### 通用分页结构

```json
{
  "items": [],
  "page": 1,
  "pageSize": 4,
  "total": 9,
  "totalPages": 3
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | array | 当前页数据 |
| `page` | number | 当前页码，从 1 开始 |
| `pageSize` | number | 每页条数 |
| `total` | number | 总条数 |
| `totalPages` | number | 总页数；无数据时为 0 |

---

## 2. 接口列表

### `GET /api/site`

站点级信息。当前前端使用静态 HTML；**仅在希望后台配置品牌 / 导航时使用**。

```json
{
  "name": "Bring`s Blog",
  "description": "算法竞赛、学习笔记、生活图集与资源分享。",
  "since": 2024,
  "location": "合肥 · 中国"
}
```

状态：`[预留]`，首页暂未调用。

---

### `GET /api/profile`

个人介绍页的头部信息。

```json
{
  "name": "Bring",
  "handle": "@bring",
  "role": "计算机科学与技术 · 本科",
  "status": {
    "label": "目前状态",
    "value": "大二",
    "detail": "2025 级 · 计算机科学与技术",
    "term": "2026 秋季学期"
  },
  "avatar": "https://cdn.example.com/avatar.jpg",
  "avatarAlt": "Bring 的头像",
  "intro": "你好，我是 Bring。",
  "bio": ["第一段简介。", "第二段简介。"],
  "now": [{ "label": "在学", "value": "图论 / 编译原理" }],
  "interests": ["算法竞赛", "摄影"],
  "location": "合肥 · 中国",
  "socials": [{ "label": "GitHub", "href": "https://github.com/" }]
}
```

状态：`[已预留并调用]`。

### `GET /api/awards`

返回奖项数组，按展示顺序排列。

```json
[
  {
    "title": "ICPC 国际大学生程序设计竞赛",
    "detail": "亚洲区域赛 · 南京站",
    "honor": "铜奖",
    "date": "2026.11",
    "year": "2026",
    "issuer": "ICPC Asia Nanjing Regional Contest",
    "description": "团队在五小时内完成七题。",
    "tone": "sage"
  }
]
```

- `tone` 建议限定为 `sage | sand | mist | rose`，前端未知值回退到 `sage`。
- 获奖卡片为圆角矩形，文本渲染前由前端转义。

状态：`[已预留并调用]`。

### `GET /api/overview`

个人介绍页显示的总量统计。

```json
{
  "notes": 24,
  "albums": 6,
  "photos": 18,
  "resources": 9
}
```

状态：`[已预留并调用]`。

---

### `GET /api/article-folders`

文章页面文件夹列表。服务端应计算每个文件夹的笔记数量和最近更新时间。

```json
[
  {
    "id": "icpc",
    "name": "ICPC 题解",
    "en": "ICPC Solutions",
    "description": "从区域赛到训练赛。",
    "glyph": "01",
    "accent": "#34584b",
    "soft": "#edf3ef",
    "count": 6,
    "latest": "2026-11-09"
  }
]
```

- `id` 用于 URL：`notes.html?folder=icpc`。
- `count`、`latest` 由后端计算；前端 Mock 从笔记数据推导。

状态：`[已预留并调用]`。

### `GET /api/article-folders/:folderId/notes?page=1&pageSize=4`

某个文件夹的分页笔记列表。响应除通用分页字段外，必须带 `folder`：

```json
{
  "folder": {
    "id": "icpc",
    "name": "ICPC 题解",
    "en": "ICPC Solutions",
    "description": "……",
    "glyph": "01"
  },
  "items": [
    {
      "id": "icpc-nanjing-2026",
      "folder": "icpc",
      "title": "2026 ICPC 南京站 · 从热身赛到正赛的 72 小时",
      "summary": "一次区域赛的完整记录。",
      "date": "2026-11-09",
      "readingTime": 9,
      "tags": ["ICPC", "复盘", "团队"]
    }
  ],
  "page": 1,
  "pageSize": 4,
  "total": 6,
  "totalPages": 2
}
```

状态：`[已预留并调用]`。

### `GET /api/notes/:noteId`

单篇笔记与相邻导航。

```json
{
  "note": {
    "id": "icpc-nanjing-2026",
    "folder": "icpc",
    "title": "……",
    "summary": "……",
    "date": "2026-11-09",
    "readingTime": 9,
    "tags": ["ICPC"],
    "body": "<p>可信、已清洗的 HTML</p>"
  },
  "folder": { "id": "icpc", "name": "ICPC 题解", "en": "ICPC Solutions" },
  "previous": null,
  "next": {
    "id": "icpc-network-flow-modeling",
    "folder": "icpc",
    "title": "网络流建模：从 24 题里提炼的三个套路",
    "summary": "……",
    "date": "2026-10-24",
    "readingTime": 8,
    "tags": ["网络流"]
  }
}
```

- `previous` 表示时间更新的一篇，`next` 表示更早的一篇；无对应项时为 `null`。
- 正文渲染为 `innerHTML`，真实后端必须做 HTML 白名单清洗，禁止脚本、事件属性与危险链接。
- 也可以返回 Markdown，但需要同步调整前端渲染层。

状态：`[已预留并调用]`。

---

### `GET /api/gallery/albums`

```json
[
  {
    "id": "mountains",
    "title": "山野之间",
    "en": "Between Mountains",
    "description": "周末向城外走。",
    "date": "2026.10",
    "cover": "https://cdn.example.com/mountains-1.jpg",
    "count": 3,
    "photos": [
      {
        "src": "https://cdn.example.com/mountains-1.jpg",
        "alt": "晨雾中的层叠山脊",
        "caption": "清晨六点的山脊。"
      }
    ]
  }
]
```

- 列表和弹窗当前共用此响应。
- 真实服务建议封面使用尺寸较小的缩略图字段，例如额外返回 `thumb`，以减小首屏流量。

状态：`[已预留并调用]`。

### `GET /api/gallery/albums/:albumId`

单个图集详情，响应为上面的单个对象。

状态：`[已预留，当前页面未调用]`。

---

### `GET /api/resources?page=1&pageSize=4`

```json
{
  "items": [
    {
      "id": "icpc-notebook",
      "name": "ICPC 竞赛代码模板",
      "filename": "icpc-team-notebook-v2.4.zip",
      "version": "v2.4",
      "type": "ZIP",
      "description": "覆盖图论、数论、字符串与数据结构。",
      "updated": "2026-10-28",
      "size": "3.2 KB",
      "md5": "8a1c8c04557d69030f1df1cd29201deb",
      "downloadUrl": "https://storage.example.com/signed/...",
      "url": "https://oi-wiki.org/"
    }
  ],
  "page": 1,
  "pageSize": 4,
  "total": 9,
  "totalPages": 3
}
```

- `downloadUrl`：**由后端短期签名的下载地址**，不要把对象存储根路径或不安全 secrets 传给前端。
- `url`：来源页；前端只接受 `http(s)` 链接。
- `md5`：32 位十六进制；上传后由服务端/CI 计算。
- `size`、`updated` 可直接作为展示字符串。

状态：`[已预留并调用]`。

### `POST /api/downloads/:resourceId/log`

请求体可为空对象 `{}`。统计下载事件，**下载本身不得依赖此请求成功**。

```json
{ "ok": true }
```

状态：`[已预留并调用，fire-and-forget]`。

---

## 3. 后端待实现清单

| 能力 | 状态 | 前端位置 |
| --- | --- | --- |
| 个人资料 / 当前状态 | 待实现 | `about.html`、`js/about.js` |
| 奖项列表 | 待实现 | `about.html`、`js/about.js` |
| 文章文件夹与计数 | 待实现 | `articles.html`、`js/articles.js` |
| 笔记分页 | 待实现 | `notes.html`、`js/notes.js` |
| 笔记正文与前后篇 | 待实现 | `note.html`、`js/note.js` |
| 图集列表 / 图片 CDN | 待实现 | `gallery.html`、`js/gallery.js` |
| 资源分页与签名下载 | 待实现 | `resources.html`、`js/resources.js` |
| 下载事件统计 | 待实现 | `js/resources.js` |
| 后台编辑器 / 登录鉴权 | 不在本示例范围 | — |
| 文件上传 / 自动计算 MD5 | 不在本示例范围 | — |

## 4. 真实接入时的建议

1. **统一响应格式**：错误使用非 2xx + JSON `{ "message": "..." }`，前端会展示 message。
2. **HTML 清洗**：对 `note.body` 做白名单过滤（例如 DOMPurify 服务端等价实现）。
3. **鉴权**：读取接口可公开；写接口需要登录态与 CSRF 防护。
4. **签名下载**：URL 过期时间建议 5–15 分钟；下载统计用独立异步事件。
5. **CORS**：若 API 与静态站分域，只放行博客域名与方法。
6. **缓存**：列表数据可加 `Cache-Control` 与 ETag；签名下载地址不缓存。
7. **分页边界**：服务端对 `page`、`pageSize` 做最大条数限制（建议 pageSize ≤ 50）。
8. **可观测性**：记录 API 延迟、空列表率与下载失败率。
