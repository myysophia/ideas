const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const buildScript = path.join(repoRoot, 'build.js');
const templatePath = path.join(repoRoot, '_templates', 'article.html');
const aboutPath = path.join(repoRoot, '_content', 'about.md');
const nodeModulesPath = path.join(repoRoot, 'node_modules');

function writeFile(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function createWorkspace(files) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ideas-build-test-'));

  writeFile(path.join(workspace, 'build.js'), fs.readFileSync(buildScript, 'utf8'));
  writeFile(
    path.join(workspace, '_templates', 'article.html'),
    fs.readFileSync(templatePath, 'utf8')
  );
  writeFile(path.join(workspace, '_content', 'about.md'), fs.readFileSync(aboutPath, 'utf8'));

  if (fs.existsSync(nodeModulesPath)) {
    fs.symlinkSync(nodeModulesPath, path.join(workspace, 'node_modules'), 'dir');
  }

  for (const [relativePath, content] of Object.entries(files)) {
    writeFile(path.join(workspace, relativePath), content);
  }

  return workspace;
}

function runBuild(workspace) {
  execFileSync(process.execPath, ['build.js'], {
    cwd: workspace,
    encoding: 'utf8'
  });
}

function readFile(workspace, relativePath) {
  return fs.readFileSync(path.join(workspace, relativePath), 'utf8');
}

function getArticleSection(indexHtml, articlePath, title) {
  const escapedPath = articlePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const match = indexHtml.match(
    new RegExp(
      `<article class="article-item"[\\s\\S]*?<h2><a href="${escapedPath}">${escapedTitle}<\\/a><\\/h2>([\\s\\S]*?)<\\/article>`
    )
  );

  assert.ok(match, `应在首页中找到文章：${title}`);
  return match[1];
}

test('HTML 文章只有 time datetime 时，应使用该日期且不改写源文件', () => {
  const sourceHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>只有 time 的文章</title>
  <meta name="description" content="测试文章">
</head>
<body>
  <article>
    <header>
      <h1>只有 time 的文章</h1>
      <time datetime="2024-06-18">2024-06-18</time>
    </header>
    <p>正文</p>
  </article>
</body>
</html>`;

  const workspace = createWorkspace({
    'posts/time-only.html': sourceHtml
  });

  runBuild(workspace);

  const indexHtml = readFile(workspace, 'dist/index.html');
  const sourceAfterBuild = readFile(workspace, 'posts/time-only.html');

  assert.match(indexHtml, /只有 time 的文章/);
  assert.match(indexHtml, /2024-06-18/);
  assert.equal(sourceAfterBuild, sourceHtml);
  assert.doesNotMatch(sourceAfterBuild, /<meta\s+name=["']date["']/);
});

test('HTML 文章没有元信息但文件名带日期前缀时，应回退到文件名日期', () => {
  const workspace = createWorkspace({
    'posts/2024-05-06-filename-date.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>文件名日期文章</title>
</head>
<body>
  <article><p>正文</p></article>
</body>
</html>`
  });

  runBuild(workspace);

  const indexHtml = readFile(workspace, 'dist/index.html');
  const section = getArticleSection(
    indexHtml,
    '/posts/2024-05-06-filename-date.html',
    '文件名日期文章'
  );

  assert.match(section, /<time datetime="2024-05-06">2024-05-06<\/time>/);
});

test('HTML 文章完全无日期时，应保持无日期而不是使用构建当天', () => {
  const workspace = createWorkspace({
    'posts/no-date.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>无日期文章</title>
</head>
<body>
  <article><p>正文</p></article>
</body>
</html>`
  });

  runBuild(workspace);

  const indexHtml = readFile(workspace, 'dist/index.html');
  const section = getArticleSection(indexHtml, '/posts/no-date.html', '无日期文章');

  assert.doesNotMatch(section, /<time datetime=/);
});
