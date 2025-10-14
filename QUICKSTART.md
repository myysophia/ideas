# 快速开始

## 项目简介

这是一个极简的静态博客系统（数字花园），专注于内容本身：

- ✅ 纯黑白设计，零外部依赖
- ✅ 支持 Markdown 和 HTML 两种格式
- ✅ 自动构建部署到 Cloudflare Pages
- ✅ 10-20 年可持续的设计理念

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 添加新文章

**方式 A：Markdown**（推荐）

在任意目录创建 `.md` 文件：

```markdown
---
title: 我的新思考
date: 2025-01-15
description: 简短描述
---

正文内容开始...
```

**方式 B：HTML**

在任意目录创建 `.html` 文件（参考现有文章格式）。

### 3. 本地构建预览

```bash
# 构建
npm run build

# 预览（打开浏览器访问 dist/index.html）
open dist/index.html

# 或者启动本地服务器
npm run preview
```

## 部署到 Cloudflare Pages

### 首次部署

1. 将代码推送到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. **Workers & Pages** > **Create application** > **Pages**
4. 连接 GitHub 仓库
5. 配置构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
6. 点击 **Deploy**

### 后续更新

只需：

```bash
git add .
git commit -m "添加新文章"
git push
```

Cloudflare Pages 会自动构建并部署！

## 文件说明

```
├── _content/          # 特殊内容（如关于页面）
├── _templates/        # HTML 模板
├── ai/               # AI 相关文章
├── architecture/     # 架构相关文章
├── db/              # 数据库相关文章
├── pm/              # 项目管理相关文章
├── build.js         # 构建脚本
├── package.json     # 依赖配置
└── wrangler.toml    # Cloudflare Pages 配置
```

在任意目录创建 `.md` 或 `.html` 文件即可自动被识别和构建！

## 常见问题

**Q: 文章不显示在首页？**  
A: 确保 Markdown 文件有 frontmatter，或者 HTML 文件有 `<title>` 和 `<time>` 标签。

**Q: 日期格式？**  
A: 使用 `YYYY-MM-DD` 格式，如 `2025-01-15`。

**Q: 如何修改网站标题？**  
A: 编辑 `build.js` 中的 `generateIndex()` 函数，修改 `<h1>思考集</h1>` 部分。

**Q: 如何添加自定义域名？**  
A: 在 Cloudflare Pages 项目设置中添加 Custom Domain。

## 设计理念

**永恒性**：零外部依赖，纯 HTML/CSS，10 年后仍可完美渲染。

**极简主义**：纯黑文字 + 纯白背景，专注于内容本身。

**原生体验**：无 JavaScript 框架，快速加载。

**呼吸感**：大量留白，优雅的字体排版。

---

开始你的写作之旅吧！删除 `ai/2025-01-15-示例文章.md` 即可。

