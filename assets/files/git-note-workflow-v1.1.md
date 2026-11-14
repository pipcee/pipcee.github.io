# Git 笔记工作流 · v1.1

这是一套为个人长期笔记设计的轻量流程，不追求复杂分支模型。

## 日常循环

```bash
git status
git add .
git commit -m "notes: 补充树状数组的边界说明"
git push origin main
```

提交信息建议使用「范围: 动作」：

- `notes: ...`
- `site: ...`
- `assets: ...`
- `fix: ...`

## 分支

- `main`：始终可发布。
- `draft/<topic>`：长文或结构性改版。
- 合并后删除分支，避免堆积。
- 不为了一个错别字开分支。

## 标签

每学期结束打一次标签：

```bash
git tag -a 2026-fall -m "2026 秋季学期笔记快照"
git push origin 2026-fall
```

## 回看与恢复

- 查看某次提交：`git show <hash>`
- 查看文件历史：`git log --oneline -- path/to/file.md`
- 丢弃工作区某个文件：`git restore path/to/file.md`
- 暂存当前修改：`git stash push -m "WIP"`

## 发布前检查

- [ ] 没有密钥、密码、个人信息进入公开仓库
- [ ] 图片与附件路径正确
- [ ] 至少在一个干净目录 clone + 打开测试
- [ ] 更新 README 中的链接

## 备份边界

私有笔记和公开站点分仓库。备份不等于公开，提交前先确认可见性。
