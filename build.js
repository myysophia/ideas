const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// 配置
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', '_templates', '_content'];
const TEMPLATE_PATH = '_templates/article.html';
const OUTPUT_DIR = 'dist';

// 读取模板
const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 文章列表
const articles = [];

// 递归扫描目录
function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (!EXCLUDED_DIRS.includes(item)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (ext === '.md' || ext === '.html') {
        processFile(fullPath);
      }
    }
  }
}

// 处理单个文件
function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const relativePath = path.relative('.', filePath);
  
  // 排除文档文件
  const basename = path.basename(filePath).toLowerCase();
  const excludeFiles = ['readme.md', 'deploy.md', 'quickstart.md'];
  if (excludeFiles.includes(basename)) {
    return;
  }
  
  console.log(`处理文件: ${relativePath}`);
  
  let title = '';
  let date = '';
  let content = '';
  let description = '';
  
  if (ext === '.md') {
    // 处理 Markdown 文件
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    
    title = parsed.data.title || path.basename(filePath, '.md');
    // 确保日期是 YYYY-MM-DD 格式
    if (parsed.data.date) {
      const d = new Date(parsed.data.date);
      date = d.toISOString().split('T')[0];
    } else {
      date = extractDateFromFilename(filePath);
    }
    description = parsed.data.description || '';
    content = marked(parsed.content);
    
  } else if (ext === '.html') {
    // 处理 HTML 文件 - 直接复制原文件
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 提取标题（用于首页列表）
    const titleMatch = fileContent.match(/<title>(.*?)<\/title>/i);
    title = titleMatch ? titleMatch[1] : path.basename(filePath, '.html');
    
    // 提取日期（用于首页列表）
    const timeMatch = fileContent.match(/<time[^>]*>(.*?)<\/time>/i);
    date = timeMatch ? timeMatch[1] : extractDateFromFilename(filePath);
    
    // 提取描述（用于首页列表）
    const descMatch = fileContent.match(/<meta name="description" content="(.*?)"/i);
    description = descMatch ? descMatch[1] : '';
    
    // 直接复制 HTML 文件到输出目录
    const outputPath = path.join(OUTPUT_DIR, relativePath);
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    
    // 添加到文章列表
    articles.push({
      title,
      date: date || '',
      url: '/' + relativePath,
      description: description || extractFirstParagraph(fileContent)
    });
    
    return; // 直接返回，不需要后续的模板处理
  }
  
  // 仅处理 Markdown 文件的模板应用
  if (ext === '.md') {
    // 生成输出路径
    const outputPath = path.join(OUTPUT_DIR, relativePath.replace(/\.md$/, '.html'));
    const outputDir = path.dirname(outputPath);
    
    // 创建输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 应用模板
    const dateHtml = date ? `<time datetime="${date}">${date}</time>` : '';
    const html = template
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DATE_HTML\}\}/g, dateHtml)
      .replace(/\{\{DESCRIPTION\}\}/g, description || title)
      .replace(/\{\{CONTENT\}\}/g, content);
    
    // 写入文件
    fs.writeFileSync(outputPath, html, 'utf-8');
    
    // 添加到文章列表
    articles.push({
      title,
      date: date || '',
      url: '/' + relativePath.replace(/\.md$/, '.html'),
      description: description || extractFirstParagraph(content)
    });
  }
}

// 从文件名提取日期 (YYYY-MM-DD-title.md)
function extractDateFromFilename(filename) {
  const basename = path.basename(filename);
  const match = basename.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

// 提取第一段作为摘要
function extractFirstParagraph(html) {
  const match = html.match(/<p>(.*?)<\/p>/i);
  if (match) {
    const text = match[1].replace(/<[^>]*>/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }
  return '';
}

// 生成首页
function generateIndex() {
  // 按日期排序（最新的在前）
  articles.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.localeCompare(dateA);
  });
  
  let articlesHtml = '';
  for (const article of articles) {
    articlesHtml += `
    <article>
      <h2><a href="${article.url}">${article.title}</a></h2>
      ${article.date ? `<time datetime="${article.date}">${article.date}</time>` : ''}
      ${article.description ? `<p>${article.description}</p>` : ''}
    </article>
    `;
  }
  
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>思考集</title>
  <meta name="description" content="个人数字花园，记录有价值的思考与感受">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 18px;
      line-height: 1.7;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #000;
      background: #fff;
      padding: 4rem 2rem;
      max-width: 650px;
      margin: 0 auto;
    }

    nav {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      margin-bottom: 3rem;
      font-size: 1rem;
    }

    nav a {
      color: #000;
      text-decoration: none;
      margin-right: 1rem;
    }

    nav a:hover {
      text-decoration: underline;
    }

    header h1 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    header p {
      color: #666;
      margin-bottom: 3rem;
    }

    article {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e0e0e0;
    }

    article:last-child {
      border-bottom: none;
    }

    article h2 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    article h2 a {
      color: #000;
      text-decoration: none;
    }

    article h2 a:hover {
      text-decoration: underline;
    }

    time {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 0.9rem;
      color: #666;
      display: block;
      margin-bottom: 0.5rem;
    }

    article p {
      color: #333;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      html {
        font-size: 17px;
      }

      body {
        padding: 3rem 1.5rem;
      }

      header h1 {
        font-size: 1.75rem;
      }

      article h2 {
        font-size: 1.25rem;
      }
    }
  </style>
</head>
<body>
  <nav>
    <a href="/">首页</a>
    <a href="/about.html">关于</a>
  </nav>
  <header>
    <h1>思考集</h1>
    <p>一座宁静的数字花园，记录有价值的思考与感受</p>
  </header>
  <main>
    ${articlesHtml}
  </main>
</body>
</html>`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8');
  console.log('✓ 生成首页');
}

// 生成关于页面
function generateAbout() {
  const aboutMdPath = '_content/about.md';
  
  if (!fs.existsSync(aboutMdPath)) {
    console.log('⚠ 未找到 about.md，跳过生成关于页面');
    return;
  }
  
  const fileContent = fs.readFileSync(aboutMdPath, 'utf-8');
  const parsed = matter(fileContent);
  const content = marked(parsed.content);
  
  const html = template
    .replace(/\{\{TITLE\}\}/g, '关于')
    .replace(/\{\{DATE_HTML\}\}/g, '')
    .replace(/\{\{DESCRIPTION\}\}/g, '关于本站')
    .replace(/\{\{CONTENT\}\}/g, content);
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'about.html'), html, 'utf-8');
  console.log('✓ 生成关于页面');
}

// 主流程
console.log('开始构建...\n');

// 扫描并处理所有文件
scanDirectory('.');

// 生成首页
generateIndex();

// 生成关于页面
generateAbout();

console.log(`\n✓ 构建完成！共处理 ${articles.length} 篇文章`);
console.log(`✓ 输出目录: ${OUTPUT_DIR}/`);

