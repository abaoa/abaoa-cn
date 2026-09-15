/**
 * scripts/sync-tabpilot.js — 把 TabPilot 网页版同步到本站 public/tabpilot/
 *
 * 用途
 *   本站是 Vite 静态站点：`public/` 下的内容会在构建时原样拷贝到 `dist/`，
 *   因此把 TabPilot 的整个前端目录同步进来，即可通过
 *   https://www.abaoa.cn/tabpilot/ 访问，且与 React SPA 路由互不干扰。
 *
 * 用法
 *   node scripts/sync-tabpilot.js [源目录]
 *   npm run sync:tabpilot
 *
 * 源目录（按优先级）
 *   1. 命令行参数          node scripts/sync-tabpilot.js /path/to/tab-follower/public
 *   2. 环境变量            TABPILOT_SRC=... npm run sync:tabpilot
 *   3. 默认值              上级目录的 Guitar/tab-follower/public
 *
 * 同步时做的三件事
 *   1. 全量拷贝（先清空目标目录，避免残留旧文件）
 *   2. manifest.json 改为站点绝对前缀（/tabpilot/...），让 PWA 的
 *      start_url / scope / icons 在子路径部署下解析正确
 *   3. 在模式切换导航里注入「主站」入口，方便从应用回到 abaoa.cn
 *
 * 注意
 *   · 目标目录是"生成物"，但必须提交进 Git —— Vercel 构建时拉取的是本站仓库，
 *     拿不到 TabPilot 的源码目录，所以不能把它写进 .gitignore。
 *   · 升级 TabPilot 后重新执行本脚本，并检查 git diff 是否需要一并提交。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const DEST = path.join(REPO_ROOT, 'public', 'tabpilot');
const DEFAULT_SRC = path.join(REPO_ROOT, '..', 'Guitar', 'tab-follower', 'public');
const SRC = path.resolve(process.argv[2] || process.env.TABPILOT_SRC || DEFAULT_SRC);

/** 站点上的部署前缀 */
const BASE = '/tabpilot';

/** 不参与同步的文件（README 预览图、调试用临时页、系统垃圾文件） */
const EXCLUDE = [/assets[\\/]preview-.*\.png$/, /_probe.*\.html$/, /(^|[\\/])(\.DS_Store|Thumbs\.db)$/];

const isExcluded = (rel) => EXCLUDE.some((re) => re.test(rel));

function copyTree(from, to) {
  let count = 0;
  let bytes = 0;

  const walk = (srcDir, dstDir) => {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const srcPath = path.join(srcDir, entry.name);
      const dstPath = path.join(dstDir, entry.name);
      const rel = path.relative(SRC, srcPath).split(path.sep).join('/');

      if (entry.isDirectory()) {
        walk(srcPath, dstPath);
      } else if (entry.isFile()) {
        if (isExcluded(rel)) {
          console.log(`⏭  跳过 ${rel}`);
          continue;
        }
        fs.mkdirSync(path.dirname(dstPath), { recursive: true });
        fs.copyFileSync(srcPath, dstPath);
        count += 1;
        bytes += fs.statSync(dstPath).size;
        console.log(`✅ ${rel}`);
      }
    }
  };

  walk(from, to);
  return { count, bytes };
}

/** manifest.json：改写为站点绝对前缀 */
function adaptManifest() {
  const file = path.join(DEST, 'manifest.json');
  if (!fs.existsSync(file)) return;

  const m = JSON.parse(fs.readFileSync(file, 'utf-8'));
  m.start_url = `${BASE}/index.html`;
  m.scope = `${BASE}/`;
  if (Array.isArray(m.icons)) {
    m.icons = m.icons.map((it) => ({ ...it, src: `${BASE}/${String(it.src).replace(/^\.?\//, '')}` }));
  }
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n', 'utf-8');
  console.log(`🔧 manifest.json → start_url=${m.start_url} scope=${m.scope}`);
}

/** HTML：在模式切换导航里注入「主站」入口（幂等，重复执行不会叠加） */
function injectHomeLink() {
  for (const name of ['index.html', 'image-tab.html']) {
    const file = path.join(DEST, name);
    if (!fs.existsSync(file)) continue;

    let html = fs.readFileSync(file, 'utf-8');
    if (html.includes('data-site-home')) {
      console.log(`⏭  ${name} 已注入主站入口`);
      continue;
    }
    if (!html.includes('</nav>')) {
      console.warn(`⚠️  ${name} 未找到 </nav>，跳过注入`);
      continue;
    }
    html = html.replace('</nav>', `      <a href="/" data-site-home>🏠 主站</a>\n    </nav>`);
    fs.writeFileSync(file, html, 'utf-8');
    console.log(`🔧 ${name} 注入主站入口`);
  }
}

function main() {
  console.log(`源目录 : ${SRC}`);
  console.log(`目标   : ${DEST}\n`);

  if (!fs.existsSync(path.join(SRC, 'index.html'))) {
    console.error(`❌ 源目录无效（未找到 index.html）：${SRC}`);
    console.error('   请通过命令行参数或 TABPILOT_SRC 指定 TabPilot 的 public 目录。');
    process.exit(1);
  }

  fs.rmSync(DEST, { recursive: true, force: true });
  const { count, bytes } = copyTree(SRC, DEST);
  adaptManifest();
  injectHomeLink();

  console.log(`\n🎉 同步完成：${count} 个文件，${(bytes / 1024 / 1024).toFixed(2)} MB → public/tabpilot/`);
  console.log(`   构建后访问路径：https://www.abaoa.cn${BASE}/`);
}

main();
