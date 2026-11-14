# Continue · 过程与接口记录

这里是 Bring`s Blog 的构建记录。每完成一个模块，都会记录：

1. 本次改动的文件；
2. 关键实现与设计决策；
3. 验证方式与结果；
4. 后端功能标记和预留接口；
5. 已知限制。

## 索引

| 文档 | 内容 |
| --- | --- |
| [00-plan.md](00-plan.md) | 项目目标、视觉方向、验收矩阵 |
| [01-foundation.md](01-foundation.md) | 目录结构、全局设计系统、共享导航/页脚 |
| [02-home-birds.md](02-home-birds.md) | 首页与 25 只鸟的群集动画 |
| [03-about.md](03-about.md) | 个人介绍、大二状态、奖项 |
| [04-articles.md](04-articles.md) | 文章文件夹、分页列表、笔记详情 |
| [05-gallery.md](05-gallery.md) | 三列图库、示例图片、灯箱 |
| [06-resources.md](06-resources.md) | 文件下载、MD5、URL、分页 |
| [07-quality.md](07-quality.md) | 响应式、可访问性、视觉与资源一致性验证 |
| [08-backend-api.md](08-backend-api.md) | 后端接口契约汇总 |
| [09-ui-v2.md](09-ui-v2.md) | UI v2：关于页、文章页与资源页简化 |

## 验证结果摘要

- 真实浏览器自动化检查：**62 / 62 通过**；
- 浏览器控制台错误：0；HTTP ≥400：0；未捕获异常：0；
- 9 个下载文件 MD5 全链路一致；
- 设备覆盖：1440 × 1000 桌面、390 × 844 @2x 移动端；
- 已验证直接双击/通过 `file://` 打开的核心页面。


> 说明：本项目是纯前端示例，所有数据来自本地 Mock；接口层 `js/api.js` 已预留真实后端切换点，把 `window.BLOG_API_CONFIG.useMock` 改成 `false` 即可请求 `/api/...`。
