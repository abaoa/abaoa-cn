/**
 * 自动生成 manifest.json
 * 从各个作品的 info.json 中提取信息
 * 
 * 使用方法:
 * node scripts/generate-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKS_DIR = path.join(__dirname, '../public/works');
const MANIFEST_PATH = path.join(WORKS_DIR, 'manifest.json');

function generateManifest() {
  const works = [];
  
  // 读取所有作品文件夹
  const items = fs.readdirSync(WORKS_DIR);
  
  for (const item of items) {
    const itemPath = path.join(WORKS_DIR, item);
    const stat = fs.statSync(itemPath);
    
    // 跳过文件和模板文件夹
    if (!stat.isDirectory() || item.startsWith('_') || item.startsWith('.')) {
      continue;
    }
    
    // 读取 info.json
    const infoPath = path.join(itemPath, 'info.json');
    if (!fs.existsSync(infoPath)) {
      console.warn(`⚠️  跳过 ${item}: 未找到 info.json`);
      continue;
    }
    
    try {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

      // 自动探测封面扩展名（jpg / jpeg / png / webp），避免写死 .jpg 导致图片 404
      const coverExts = ['jpg', 'jpeg', 'png', 'webp'];
      let coverExt = 'jpg';
      for (const ext of coverExts) {
        if (fs.existsSync(path.join(itemPath, `cover.${ext}`))) {
          coverExt = ext;
          break;
        }
      }
      const coverImage = info.coverImage || `/works/${item}/cover.${coverExt}`;
      
      // 提取 manifest 需要的字段
      const work = {
        id: info.id,
        slug: info.slug,
        title: info.title,
        description: info.description,
        icon: info.icon || 'simple-icons:qt',
        tags: info.tags || [],
        platforms: info.platforms || [],
        latestVersion: info.latestVersion,
        coverImage
      };
      
      works.push(work);
      console.log(`✅ 已添加: ${info.title}`);
      
    } catch (error) {
      console.error(`❌ 解析失败 ${item}:`, error.message);
    }
  }
  
  // 按 id 排序
  works.sort((a, b) => a.id - b.id);
  
  // 生成 manifest
  const manifest = { works };
  
  // 写入文件
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  
  console.log(`\n🎉 成功生成 manifest.json，共 ${works.length} 个作品`);
}

generateManifest();
