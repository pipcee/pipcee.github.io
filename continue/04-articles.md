# 04 · 文章：文件夹 → 分页列表 → 笔记详情

## 本步提交内容

- 新增 `articles.html` + `js/articles.js`：四个文章文件夹。
- 新增 `notes.html` + `js/notes.js`：某个文件夹下的分页笔记列表。
- 新增 `note.html` + `js/note.js`：单篇笔记正文与前后篇导航。
- 新增 `js/notes-data.js`：24 篇示例笔记正文（Mock）。
- `css/style.css` 新增文件夹卡片、面包屑、笔记行、文章正文排版、系列导航与响应式样式。

## 浏览路径

```text
articles.html
  └─ notes.html?folder=icpc&page=1     # 4 篇 / 页，共 2 页
       └─ note.html?folder=icpc&id=icpc-nanjing-2026
```

URL 全部可直接打开、刷新与分享。列表页码越界时会自动重定向到最后一个有效页；空数据时展示空状态。

## 文件夹与示例数据

| folder id | 名称 | 笔记数 | 页数（4/页） |
| --- | --- | ---: | ---: |
| `icpc` | ICPC 题解 | 6 | 2 |
| `algorithms` | 算法笔记 | 6 | 2 |
| `club` | 社团建设笔记 | 6 | 2 |
| `misc` | 杂物 | 6 | 2 |

列表展示标题、摘要、日期、阅读时间、标签；点击整行进入详情。正文支持标题、段落、有序/无序列表、引用与带横向滚动的代码块。

## 后端功能与预留

| 前端调用 | HTTP 接口 | 说明 |
| --- | --- | --- |
| `BlogAPI.getArticleFolders()` | `GET /api/article-folders` | 文件夹名称、描述、数量、最后更新时间 |
| `BlogAPI.getNotes(folderId, page, 4)` | `GET /api/article-folders/:folderId/notes?page=&pageSize=` | 分页列表，含 `folder` 元信息 |
| `BlogAPI.getNote(noteId)` | `GET /api/notes/:id` | 正文、所属文件夹、上一篇/下一篇 |

### 约定

- 分页响应：`{ items, page, pageSize, total, totalPages }`。
- 当前正文以**可信的本地 HTML 字符串**渲染；真实后端必须返回经安全清洗的 HTML，或改由后端渲染 Markdown 后输出。前端未引入 Markdown 解析库，也没有使用 `eval`。
- 标题、摘要、标签等元数据在渲染前都经过 `BlogUI.escapeHTML`。
- 页面级空/错状态已实现，并提供“重新加载”按钮。

## 验证记录

在真实浏览器（Edge headless + CDP）中验证通过：

- 文件夹数量为 4，链接均指向正确的 `notes.html?folder=...`；
- ICPC 列表第 1 页 4 篇、第 2 页 2 篇，编号从 `05` 连续；
- 分页链接、笔记详情路由、正文标题/段落渲染正常；
- 点击文件夹可以真实跳转到笔记列表；
- 直接打开 `note.html` 的上一篇/下一篇区域正常；
- 桌面与 390px 移动端均无横向滚动。
