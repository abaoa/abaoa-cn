/**
 * scripts/sync-tabpilot.js — 把 TabPilot 网页版同步到本站 public/tabpilot/
 *
 * 用途
 *   本站是 Vite 静态站点：`public/` 下的内容会在构建时原样拷贝到 `dist/`，
 *   因此把 TabPilot 的前端目录同步进来，即可通过
 *   https://www.abaoa.cn/tabpilot/ 访问，且与 React SPA 路由互不干扰。
 *
 * 用法
 *   npm run sync:tabpilot
 *
 * 说明
 *   · 本脚本只是薄封装：真正的导出逻辑（拷贝 + manifest 改写 + 注入主站入口）
 *     由 TabPilot 仓库的 scripts/export-web.mjs 实现，CI 也调用同一个脚本，
 *     避免两份逻辑漂移。
 *   · 正常情况下无需手动执行：TabPilot 仓库推送后，其 GitHub Actions 会自动
 *     导出并推送到本仓库，Vercel 随即部署。手动执行仅用于本地预览或 CI 未配置时。
 *   · 若 TabPilot 不在默认位置，用环境变量指定其仓库根目录：
 *       TABPILOT_REPO=D:/code/TabPilot npm run sync:tabpilot
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const DEST = path.join(REPO_ROOT, 'public', 'tabpilot');
/** TabPilot 仓库根目录（默认：上级目录的 Guitar/tab-follower） */
const TABPILOT_REPO = path.resolve(
  process.env.TABPILOT_REPO || path.join(REPO_ROOT, '..', 'Guitar', 'tab-follower')
);
const EXPORT_SCRIPT = path.join(TABPILOT_REPO, 'scripts', 'export-web.mjs');

function main() {
  if (!fs.existsSync(EXPORT_SCRIPT)) {
    console.error(`x 未找到 TabPilot 导出脚本：${EXPORT_SCRIPT}`);
    console.error('  请用 TABPILOT_REPO 指定 TabPilot 仓库根目录，例如：');
    console.error('    TABPILOT_REPO=D:/code/TabPilot npm run sync:tabpilot');
    process.exit(1);
  }

  console.log(`TabPilot : ${TABPILOT_REPO}`);
  console.log(`目标     : ${DEST}\n`);

  execFileSync(process.execPath, [EXPORT_SCRIPT, '--out', DEST, '--base', '/tabpilot'], {
    stdio: 'inherit',
  });

  console.log('\n提示：public/tabpilot 需提交进 Git（Vercel 构建时拉取的是本仓库）。');
}

main();
