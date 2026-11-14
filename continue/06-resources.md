# 06 · 资源：下载、MD5、URL 与分页

## 本步提交内容

- 新增 `resources.html` + `js/resources.js`。
- 新增 9 个真实可下载的示例文件至 `assets/files/`。
- `js/data.js` 中写入每个文件的真实 MD5、文件大小、版本和来源 URL。
- `css/style.css` 新增圆角资源卡片、MD5 字段、操作按钮与分页响应式样式。

## 资源列表

| # | 文件名 | 版本 | 大小 | MD5（前缀） |
| ---: | --- | --- | ---: | --- |
| 01 | `icpc-team-notebook-v2.4.zip` | v2.4 | 3.2 KB | `8a1c8c04…` |
| 02 | `string-algorithms-v1.2.md` | v1.2 | 2.2 KB | `f9990114…` |
| 03 | `club-contest-kit-v1.0.zip` | v1.0 | 2.0 KB | `214faa0c…` |
| 04 | `git-note-workflow-v1.1.md` | v1.1 | 1.2 KB | `2c5f93f5…` |
| 05 | `reading-list-2026.csv` | v1.0 | 905 B | `ea429316…` |
| 06 | `brings-blog-theme-v1.0.zip` | v1.0 | 124.2 KB | `67a79c40…` |
| 07 | `icpc-latex-template-v0.9.zip` | v0.9 | 1.4 KB | `c5a0f4b9…` |
| 08 | `markdown-writing-guide-v1.0.md` | v1.0 | 1.0 KB | `8b7464dd…` |
| 09 | `freshman-setup-checklist-2026.txt` | 2026.1 | 1.2 KB | `e83ac73d…` |

> 主题模板在最终功能完成后重新打包，已包含完整静态站点与 `continue/` 文档记录。
> 该项的 MD5 已同步更新为 `67a79c40e4101cc16a81be9bedd28943`。

## 卡片结构

每张圆角矩形资源卡包含：

1. 文件类型图标（ZIP / MD / CSV / TXT）；
2. 文件名称与真实文件名；
3. 版本胶囊；
4. 文件描述；
5. 完整 32 位 MD5；
6. 更新时间与文件大小；
7. **文字为 `URL` 的跳转按钮**（`target="_blank"`，安全 `rel`）；
8. **文字为 `下载` 的下载按钮**（`download` 属性，触发原文件下载）；
9. 文件序号。下载按钮最左侧没有任何下箭头图标。

## 分页

- 每页 4 个文件，共 9 个文件 → 3 页。
- 分页使用可分享的 URL：`resources.html?page=1/2/3`。
- 页码越界时自动重定向到最后一个有效页。
- 分页控件同时提供上一页/下一页箭头（与“下载按钮最左侧箭头”无关）。

## 后端功能与预留

| 前端调用 | HTTP 接口 | 说明 |
| --- | --- | --- |
| `BlogAPI.getResources(page, 4)` | `GET /api/resources?page=&pageSize=` | 分页文件列表 |
| `BlogAPI.logDownload(id)` | `POST /api/downloads/:id/log` | 点击下载后的异步统计，失败不阻断下载 |

真实实现建议：

- 数据库保存文件元数据、版本、大小、MD5 与对象存储 key；
- 列表接口返回**短期签名下载地址** `downloadUrl`，避免暴露永久存储路径；
- URL 按钮跳到来源页（GitHub、文档站等），下载按钮使用签名 URL；
- 文件上传完成后由后端或 CI 计算 MD5，确保与页面展示一致；
- 下载统计接口做限流，不能影响下载主链路。

## 验证记录

- 9 个文件真实存在，浏览器端与磁盘端 MD5 均与页面数据一致；
- 第 1 页 4 个、第 2 页 4 个、第 3 页 1 个；
- URL 按钮文本均为 `URL`，下载按钮文本均为 `下载`，操作区无左侧下箭头；
- 所有 MD5 均为 32 位小写十六进制；
- 移动端资源卡自动纵向排列，按钮等宽，无横向溢出。
