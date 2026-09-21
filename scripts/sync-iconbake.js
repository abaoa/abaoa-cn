/**
 * scripts/sync-iconbake.js — 把 IconBake 前端构建产物同步到本站 public/iconbake/
 *
 * 用途
 *   本站是 Vite 静态站点：`public/` 下的内容会在构建时原样拷贝到 `dist/`，
 *   因此把 IconBake 的前端目录同步进来，即可通过
 *   https://abaoa.cn/iconbake/ 访问，与 React SPA 路由互不干扰。
 *
 * 用法
 *   npm run sync:iconbake
 *
 * 说明
 *   本脚本会先在 IconBake 仓库里执行 `vite build --base /iconbake/`，
 *   再把产物拷贝到本仓库 `public/iconbake/`。
 *   若 IconBake 不在默认位置，用环境变量指定：
 *       ICONBAKE_ROOT=/path/to/IconBake npm run sync:iconbake
 *   注意：public/iconbake 需提交进 Git（Vercel 构建时拉取的是本仓库）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const DEST = path.join(REPO_ROOT, 'public', 'iconbake');
const ICONBAKE_ROOT = path.resolve(
  process.env.ICONBAKE_ROOT || path.join(REPO_ROOT, '..', 'ImageToFont')
);
const NODE = process.execPath;
const VITE = path.join(ICONBAKE_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

function main() {
  if (!fs.existsSync(ICONBAKE_ROOT)) {
    console.error(`x 未找到 IconBake 仓库：${ICONBAKE_ROOT}`);
    console.error('  请设置 ICONBAKE_ROOT 环境变量指向 IconBake 根目录。');
    process.exit(1);
  }

  if (!fs.existsSync(VITE)) {
    console.error(`x 未找到 vite：${VITE}`);
    console.error('  请先在 IconBake 仓库运行 npm install。');
    process.exit(1);
  }

  // 1. 在 IconBake 仓库里以 /iconbake/ 为 base 构建到临时目录
  const tmpDir = fs.mkdtempSync(path.join(REPO_ROOT, 'tmp-iconbake-'));
  console.log(`IconBake : ${ICONBAKE_ROOT}`);
  console.log(`构建目标 : ${tmpDir} (base=/iconbake/)\n`);

  execFileSync(NODE, [VITE, 'build', '--base', '/iconbake/', '--outDir', tmpDir], {
    cwd: ICONBAKE_ROOT,
    stdio: 'inherit',
  });

  // 2. 清空并同步到 public/iconbake/
  console.log(`\n目标     : ${DEST}`);
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.cpSync(tmpDir, DEST, { recursive: true });

  // 3. 清理临时目录
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n已同步 ${ICONBAKE_ROOT} -> ${DEST}`);
  console.log('提示：public/iconbake 需提交进 Git（Vercel 构建时拉取的是本仓库）。');
}

main();
