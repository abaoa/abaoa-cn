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
 *   IconBake 仓库（默认 /path/to/IconBake）用 `vite build --base /iconbake/`
 *   构建后的 `dist/` 会被原样拷贝到本仓库 `public/iconbake/`。
 *   若 IconBake 不在默认位置，用环境变量指定其 dist 目录：
 *       ICONBAKE_DIST=D:/path/to/IconBake/dist npm run sync:iconbake
 *   注意：public/iconbake 需提交进 Git（Vercel 构建时拉取的是本仓库）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const DEST = path.join(REPO_ROOT, 'public', 'iconbake');
const SRC = path.resolve(
  process.env.ICONBAKE_DIST || path.join(REPO_ROOT, '..', 'ImageToFont', 'dist')
);

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`x 未找到 IconBake 构建产物：${SRC}`);
    console.error('  请先在 /path/to/IconBake 运行 vite build --base /iconbake/');
    process.exit(1);
  }

  console.log(`IconBake : ${SRC}`);
  console.log(`目标     : ${DEST}\n`);

  fs.rmSync(DEST, { recursive: true, force: true });
  fs.cpSync(SRC, DEST, { recursive: true });

  console.log(`已同步 ${SRC} -> ${DEST}`);
  console.log('提示：public/iconbake 需提交进 Git（Vercel 构建时拉取的是本仓库）。');
}

main();
