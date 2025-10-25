const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const CryptoJS = require('crypto-js');

// 配置
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', '_templates', '_content', '.history'];
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
  let tag = '';
  let password = '';
  let needsPassword = false;
  
  // 从目录名提取 tag（对所有文件类型通用）
  const pathParts = relativePath.split(path.sep);
  tag = pathParts.length > 1 ? pathParts[0] : '';
  
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
    password = parsed.data.password || '';
    
    // 检查是否需要密码保护
    if (password) {
      // 加密内容
      const encryptedContent = CryptoJS.AES.encrypt(parsed.content, password).toString();
      content = encryptedContent;
      needsPassword = true;
    } else {
      content = marked(parsed.content);
    }
    
  } else if (ext === '.html') {
    // 处理 HTML 文件
    let fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 提取标题（用于首页列表）
    const titleMatch = fileContent.match(/<title>(.*?)<\/title>/i);
    title = titleMatch ? titleMatch[1] : path.basename(filePath, '.html');
    
    // 提取日期（用于首页列表），优先级：
    // 1. <meta name="date" content="YYYY-MM-DD">
    // 2. 自动生成当前日期（如果没有日期标签）
    const dateMetaMatch = fileContent.match(/<meta\s+name=["']date["']\s+content=["'](.*?)["']/i);
    if (dateMetaMatch) {
      date = dateMetaMatch[1];
    } else {
      // 没有日期meta标签，自动添加当前日期
      date = new Date().toISOString().split('T')[0];
      
      // 在<title>标签后插入日期meta标签
      const titleRegex = /(<title>.*?<\/title>)/i;
      if (titleRegex.test(fileContent)) {
        const updatedContent = fileContent.replace(
          titleRegex,
          `$1\n<meta name="date" content="${date}">`
        );
        
        // 写回源文件
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        fileContent = updatedContent;
        console.log(`  ✓ 已添加日期标签: ${date}`);
      }
    }
    
    // 提取描述（用于首页列表）
    const descMatch = fileContent.match(/<meta name="description" content="(.*?)"/i);
    description = descMatch ? descMatch[1] : '';
    
    // 检查是否有密码保护
    const passwordMatch = fileContent.match(/<meta name="password" content="(.*?)"/i);
    if (passwordMatch) {
      password = passwordMatch[1];
      needsPassword = true;
      
      // 提取 body 内容并加密
      const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        const bodyContent = bodyMatch[1];
        const encryptedBody = CryptoJS.AES.encrypt(bodyContent, password).toString();
        
        // 替换 body 内容为加密版本
        const passwordProtectedBody = `<body>
  <div id="encrypted-content" style="display: none;">${encryptedBody}</div>
  <div id="article-content" style="display: none;"></div>
  
  <div id="password-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.98); display: flex; align-items: center; justify-content: center; z-index: 1000;">
    <div class="password-modal" style="text-align: center; max-width: 400px; padding: 2rem;">
      <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin-bottom: 1rem;">此文章需要密码</h2>
      <input type="password" id="password-input" placeholder="请输入密码" style="width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #ddd; border-radius: 3px; margin-bottom: 1rem;" onkeypress="if(event.key === 'Enter') decryptArticle()">
      <button onclick="decryptArticle()" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: #000; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">解锁</button>
      <p id="password-error" style="display: none; color: red; margin-top: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">密码错误，请重试</p>
    </div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
  <script>
    const encryptedContent = document.getElementById('encrypted-content').textContent.trim();
    
    function decryptArticle() {
      const password = document.getElementById('password-input').value;
      const errorMsg = document.getElementById('password-error');
      
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (plaintext && plaintext.length > 0) {
          document.getElementById('article-content').innerHTML = plaintext;
          document.getElementById('article-content').style.display = 'block';
          document.getElementById('password-overlay').style.display = 'none';
          errorMsg.style.display = 'none';
        } else {
          errorMsg.style.display = 'block';
        }
      } catch (e) {
        errorMsg.style.display = 'block';
      }
    }
    
    // 自动聚焦密码输入框
    document.getElementById('password-input').focus();
  </script>
</body>`;
        
        fileContent = fileContent.replace(/<body[^>]*>[\s\S]*<\/body>/i, passwordProtectedBody);
        
        // 移除密码 meta 标签（避免泄露）
        fileContent = fileContent.replace(/<meta name="password"[^>]*>/i, '');
      }
    }
    
    // 写入输出文件
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
      description: description || extractFirstParagraph(fileContent),
      tag: tag
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
    let html = template
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DATE_HTML\}\}/g, dateHtml)
      .replace(/\{\{DESCRIPTION\}\}/g, description || title);
    
    // 如果需要密码保护，替换为加密版本
    if (needsPassword) {
      const passwordProtectedContent = `
    <div id="encrypted-content" style="display: none;">${content}</div>
    <section id="article-content" style="display: none;"></section>
  </article>
  
  <div id="password-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.98); display: flex; align-items: center; justify-content: center; z-index: 1000;">
    <div class="password-modal" style="text-align: center; max-width: 400px; padding: 2rem;">
      <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin-bottom: 1rem;">此文章需要密码</h2>
      <input type="password" id="password-input" placeholder="请输入密码" style="width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #ddd; border-radius: 3px; margin-bottom: 1rem;" onkeypress="if(event.key === 'Enter') decryptArticle()">
      <button onclick="decryptArticle()" style="width: 100%; padding: 0.75rem; font-size: 1rem; background: #000; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">解锁</button>
      <p id="password-error" style="display: none; color: red; margin-top: 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">密码错误，请重试</p>
    </div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    const encryptedContent = document.getElementById('encrypted-content').textContent.trim();
    
    function decryptArticle() {
      const password = document.getElementById('password-input').value;
      const errorMsg = document.getElementById('password-error');
      
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (plaintext && plaintext.length > 0) {
          document.getElementById('article-content').innerHTML = marked.parse(plaintext);
          document.getElementById('article-content').style.display = 'block';
          document.getElementById('password-overlay').style.display = 'none';
          errorMsg.style.display = 'none';
        } else {
          errorMsg.style.display = 'block';
        }
      } catch (e) {
        errorMsg.style.display = 'block';
      }
    }
    
    // 自动聚焦密码输入框
    document.getElementById('password-input').focus();
  </script>`;
      html = html.replace(/\{\{CONTENT\}\}/g, passwordProtectedContent);
    } else {
      html = html.replace(/\{\{CONTENT\}\}/g, `<section>${content}</section>`);
    }
    
    // 写入文件
    fs.writeFileSync(outputPath, html, 'utf-8');
    
    // 添加到文章列表
    articles.push({
      title,
      date: date || '',
      url: '/' + relativePath.replace(/\.md$/, '.html'),
      description: description || extractFirstParagraph(content),
      tag: tag
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
    const tagHtml = article.tag ? `<span class="tag">${article.tag}</span>` : '';
    const year = article.date ? article.date.split('-')[0] : '';
    
    articlesHtml += `
    <article class="article-item" data-tag="${article.tag || ''}" data-year="${year}">
      <h2><a href="${article.url}">${article.title}</a></h2>
      <div class="meta">
        ${article.date ? `<time datetime="${article.date}">${article.date}</time>` : ''}
        ${tagHtml}
      </div>
      ${article.description ? `<p>${article.description}</p>` : ''}
    </article>
    `;
  }
  
  // 收集所有唯一的 tags 和年份
  const allTags = [...new Set(articles.map(a => a.tag).filter(Boolean))].sort();
  const allYears = [...new Set(articles.map(a => {
    if (!a.date) return null;
    return a.date.split('-')[0];
  }).filter(Boolean))].sort().reverse();
  
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>思考集</title>
  <meta name="description" content="个人数字花园，记录有价值的思考与感受">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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

    .meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    time {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 0.9rem;
      color: #666;
    }

    .tag {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 0.8rem;
      padding: 0.15rem 0.5rem;
      background: #f0f0f0;
      border-radius: 3px;
      color: #666;
      text-decoration: none;
      display: inline-block;
    }

    article p {
      color: #333;
      margin-top: 0.5rem;
    }

    .filters {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #fff;
      border: 1px solid #000;
      padding: 1rem;
      max-width: 280px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 100;
    }

    .filter-section {
      margin-bottom: 1rem;
    }

    .filter-section:last-child {
      margin-bottom: 0;
    }

    .filter-label {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 0.9rem;
      color: #000;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: block;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-btn {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 0.85rem;
      padding: 0.3rem 0.75rem;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 3px;
      color: #666;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }

    .filter-btn:hover {
      background: #f5f5f5;
      border-color: #000;
    }

    .filter-btn.active {
      background: #000;
      color: #fff;
      border-color: #000;
    }

    .article-item {
      display: block;
    }

    .article-item.hidden {
      display: none;
    }

    @media (max-width: 768px) {
      html {
        font-size: 17px;
      }

      body {
        padding: 3rem 1.5rem 12rem 1.5rem;
      }

      header h1 {
        font-size: 1.75rem;
      }

      article h2 {
        font-size: 1.25rem;
      }

      .filters {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: none;
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
    <div class="filters">
      <div class="filter-section">
        <span class="filter-label">标签：</span>
        <div class="filter-buttons">
          <button class="filter-btn active" data-filter-type="tag" data-filter-value="all">全部</button>
          ${allTags.map(tag => `<button class="filter-btn" data-filter-type="tag" data-filter-value="${tag}">${tag}</button>`).join('\n          ')}
        </div>
      </div>
      <div class="filter-section">
        <span class="filter-label">时间：</span>
        <div class="filter-buttons">
          <button class="filter-btn active" data-filter-type="year" data-filter-value="all">全部</button>
          ${allYears.map(year => `<button class="filter-btn" data-filter-type="year" data-filter-value="${year}">${year}</button>`).join('\n          ')}
        </div>
      </div>
    </div>
    ${articlesHtml}
  </main>
  <script>
    // 简单的筛选功能
    let currentTag = 'all';
    let currentYear = 'all';

    function updateFilters() {
      const articles = document.querySelectorAll('.article-item');
      
      articles.forEach(article => {
        const articleTag = article.dataset.tag;
        const articleYear = article.dataset.year;
        
        const tagMatch = currentTag === 'all' || articleTag === currentTag;
        const yearMatch = currentYear === 'all' || articleYear === currentYear;
        
        if (tagMatch && yearMatch) {
          article.classList.remove('hidden');
        } else {
          article.classList.add('hidden');
        }
      });
    }

    // 绑定筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterType = e.target.dataset.filterType;
        const filterValue = e.target.dataset.filterValue;
        
        // 更新按钮状态
        document.querySelectorAll(\`[data-filter-type="\${filterType}"]\`).forEach(b => {
          b.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // 更新筛选条件
        if (filterType === 'tag') {
          currentTag = filterValue;
        } else if (filterType === 'year') {
          currentYear = filterValue;
        }
        
        updateFilters();
      });
    });
  </script>
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

// 复制静态资源
function copyStaticAssets() {
  // 复制 favicon
  const faviconSrc = '_templates/favicon.svg';
  const faviconDest = path.join(OUTPUT_DIR, 'favicon.svg');
  
  if (fs.existsSync(faviconSrc)) {
    fs.copyFileSync(faviconSrc, faviconDest);
    console.log('✓ 复制 favicon');
  }
}

// 主流程
console.log('开始构建...\n');

// 扫描并处理所有文件
scanDirectory('.');

// 生成首页
generateIndex();

// 生成关于页面
generateAbout();

// 复制静态资源
copyStaticAssets();

console.log(`\n✓ 构建完成！共处理 ${articles.length} 篇文章`);
console.log(`✓ 输出目录: ${OUTPUT_DIR}/`);

