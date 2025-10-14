# 部署到 Cloudflare Pages

## 一、前提条件

- GitHub 账号
- Cloudflare 账号
- 代码已推送到 GitHub 仓库

## 二、Cloudflare Pages 配置步骤

### 1. 连接 GitHub 仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages** > **Create application** > **Pages**
3. 点击 **Connect to Git**
4. 选择你的 GitHub 仓库 `ideas`

### 2. 配置构建设置

在构建配置页面，设置以下参数：

```
Project name: digital-garden (或你喜欢的名称)
Production branch: main
Build command: npm run build
Build output directory: dist
Environment variables: (可选)
  - NODE_VERSION = 18
```

### 3. 保存并部署

点击 **Save and Deploy**，Cloudflare Pages 会：

1. 克隆你的 GitHub 仓库
2. 安装依赖 (`npm install`)
3. 执行构建 (`npm run build`)
4. 部署 `dist/` 目录的内容

构建完成后，你会获得：

- 生产环境 URL：`https://<your-project>.pages.dev`
- 自定义域名配置（可选）

## 三、自动部署

之后每次推送到 `main` 分支，Cloudflare Pages 会自动：

1. 检测到代码变更
2. 自动触发构建
3. 部署最新版本

预览部署：

- 每个 Pull Request 都会自动创建预览环境
- URL 格式：`https://<commit-hash>.<your-project>.pages.dev`

## 四、本地预览

在推送前，可以本地预览：

```bash
# 安装依赖（仅第一次）
npm install

# 构建网站
npm run build

# 预览构建结果（方式1：直接打开）
open dist/index.html

# 预览构建结果（方式2：本地服务器）
npm run preview
# 然后访问 http://localhost:3000
```

## 五、添加新文章

### 方式1：Markdown 文件

在任意目录创建 `.md` 文件，添加 frontmatter：

```markdown
---
title: 我的新文章
date: 2025-01-15
description: 文章简介
---

正文内容开始...
```

### 方式2：HTML 文件

在任意目录创建 `.html` 文件，确保包含必要的元信息：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的新文章</title>
  <meta name="description" content="文章简介">
</head>
<body>
  <article>
    <header>
      <h1>我的新文章</h1>
      <time datetime="2025-01-15">2025-01-15</time>
    </header>
    <p>正文内容...</p>
  </article>
</body>
</html>
```

提交推送：

```bash
git add .
git commit -m "添加新文章"
git push origin main
```

Cloudflare Pages 会自动构建并部署。

## 六、自定义域名（可选）

1. 在 Cloudflare Pages 项目设置中，选择 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `blog.example.com`）
4. Cloudflare 会自动配置 DNS 和 SSL 证书

## 七、故障排查

### 构建失败

检查构建日志：

1. 进入 Cloudflare Pages 项目
2. 点击失败的部署
3. 查看 **Build log**

常见问题：

- **依赖安装失败**：检查 `package.json` 是否正确
- **构建脚本错误**：本地测试 `npm run build`
- **Node 版本不兼容**：设置环境变量 `NODE_VERSION=18`

### 页面显示异常

- 检查文件路径是否正确
- 确保所有链接使用相对路径或绝对路径
- 验证 HTML 语法是否正确

## 八、性能优化

Cloudflare Pages 自动提供：

- ✅ 全球 CDN 加速
- ✅ 自动 Brotli/Gzip 压缩
- ✅ HTTP/2 和 HTTP/3
- ✅ 免费 SSL 证书
- ✅ DDoS 防护

无需额外配置！

## 九、监控与分析

可选择集成：

1. **Cloudflare Web Analytics**（无需 Cookie，隐私友好）
2. **Google Analytics**
3. **Plausible Analytics**

在模板文件中添加对应的跟踪代码即可。

