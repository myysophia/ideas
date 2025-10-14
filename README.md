# 思考集 - 数字花园

一座宁静的数字花园，记录有价值的思考与感受。

## 设计理念

- **永恒性**：零外部依赖，纯 HTML/CSS，10 年后仍可完美渲染
- **极简主义**：纯黑文字 + 纯白背景，无色彩装饰
- **专注内容**：单栏布局，大量留白，优雅字体排版
- **原生体验**：无 JavaScript 框架，快速加载

## 快速开始

### 本地构建

```bash
# 安装依赖
npm install

# 构建静态网站
npm run build

# 预览（可选）
npm run preview
```

构建后的网站在 `dist/` 目录。

### 添加新文章

#### 方式一：Markdown 文件

在任意目录下创建 `.md` 文件，添加 frontmatter：

```markdown
---
title: 文章标题
date: 2025-01-15
description: 文章摘要（可选）
---

正文内容...
```

如果没有 frontmatter，可以从文件名推断日期（格式：`YYYY-MM-DD-title.md`）。

#### 方式二：HTML 文件

创建 `.html` 文件，确保包含：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>文章标题</title>
  <meta name="description" content="文章摘要">
</head>
<body>
  <nav>
    <a href="/">首页</a>
    <a href="/about.html">关于</a>
  </nav>
  <article>
    <header>
      <h1>文章标题</h1>
      <time datetime="2025-01-15">2025-01-15</time>
    </header>
    
    <p>正文内容...</p>
  </article>
</body>
</html>
```

构建脚本会自动提取标题和日期，并应用统一样式。

### 部署到 Cloudflare Pages

1. 在 Cloudflare Pages 创建项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 保存并部署

每次推送代码到 GitHub，Cloudflare Pages 会自动构建和部署。

## 目录结构

```
/
├── build.js              # 构建脚本
├── package.json          # 依赖配置
├── _templates/           # 模板文件
│   └── article.html     # 文章页面模板
├── _content/            # 系统页面源文件
│   └── about.md         # 关于页面
├── ai/                  # AI 相关文章
├── architecture/        # 架构相关文章
├── db/                  # 数据库相关文章
├── pm/                  # 项目管理相关文章
└── dist/                # 构建输出（不提交到 Git）
```

## 文件组织建议

- 按主题创建目录（如 `ai/`, `life/`, `thinking/`）
- 文件名使用有意义的描述
- 推荐使用日期前缀：`YYYY-MM-DD-title.md`

## 样式说明

所有文章使用统一的极简样式：

- **正文**：Georgia 衬线体，18px
- **标题**：系统无衬线体
- **代码**：Monaco 等宽字体
- **布局**：单栏，最大宽度 650px
- **颜色**：纯黑文字 (#000) + 纯白背景 (#fff)
- **代码块背景**：浅灰 (#f5f5f5)

## 技术栈

- **构建工具**：Node.js
- **Markdown 解析**：marked
- **部署平台**：Cloudflare Pages
- **依赖**：仅构建时依赖，生成的网站零运行时依赖

## 许可证

个人项目，内容版权归作者所有。
