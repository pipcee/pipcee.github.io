# 03 · 个人介绍页与奖项卡片

## 本步提交内容

- 新增 `about.html`、`js/about.js`。
- 新增头像插画 `assets/avatar.svg`（本地、矢量、无外部图片依赖）。
- 新增 Mock 数据与接口层：
  - `js/data.js` 中的 `profile`、`awards`、`articleFolders`、`gallery`、`resources` 数据结构；
  - `js/notes-data.js` 中文章正文示例；
  - `js/api.js` 统一 API 边界。
- `css/style.css` 新增个人介绍、状态胶囊、现在进行时、奖项圆角卡片及移动端布局。

## 页面结构

1. 顶部共享导航（当前页有下划线）。
2. 页面标题：`关于我.` + `01` 页码装饰。
3. 自适应双栏 Hero：
   - 左侧：4:5 头像插画，圆角矩形 + 细描边；桌面端 sticky；
   - 右侧：`你好，我是 Bring.`、**目前状态：大二**、个人简介、在学/在做/在写、社交链接。
4. 个人奖项：
   - 两列圆角矩形卡片，移动端一列；
   - 每张卡包含编号、奖项等级胶囊、赛事名称、具体赛项、描述、颁发方、日期；
   - 四种低饱和色调（sage / sand / mist / rose）；
   - 卡片依次淡入、悬浮轻微上移。

## 后端功能与预留

页面数据全部通过 `window.BlogAPI` 获取，页面中没有把业务数据写死到 DOM。

| 方法 | 对应接口 | 当前实现 |
| --- | --- | --- |
| `BlogAPI.getProfile()` | `GET /api/profile` | 返回 `BLOG_DATA.profile` |
| `BlogAPI.getAwards()` | `GET /api/awards` | 返回 `BLOG_DATA.awards` |
| `BlogAPI.getOverview()` | `GET /api/overview` | 汇总笔记数、图集数、资源数 |

响应结构见 `data.js` 中对应对象；真实后端切换开关为 `js/api.js` 的 `BLOG_API_CONFIG.useMock`。

### 预留字段

- `profile.status.value`：必须能表示“大二”等当前状态；
- `profile.avatar`：头像 URL，由后端返回可访问地址；
- `awards[].tone`：允许的视觉色调枚举，未知值自动回退 `sage`；
- 前端已对接口文本调用 `escapeHTML`，但真实后端仍应在返回时完成 HTML 转义与内容审核。

## 验证结果

- `about.html` 包含 `<img>` 头像和 `大二` 状态初始占位，JS 加载后会以接口数据覆盖。
- 加载态 → 奖项数据列表，无外部依赖。
- 奖项渲染 6 项；概览统计显示 24 篇笔记与 9 份资源。
- 浏览器自动化验证：“大二”状态、6 个奖项、头像加载、概述统计均通过。
- 移动端：双栏转为单栏，奖项转为一列，无横向滚动。

## 验证中修正

初次渲染时概览显示“0 篇笔记”，原因是关于页只加载了 `data.js`，未加载
`notes-data.js`，Mock 统计拿不到笔记。已在关于页补充该脚本，保证概览与
`GET /api/overview` 的真实响应结构一致。

