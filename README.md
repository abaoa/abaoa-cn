# abaoa.cn

abaoa 的个人作品展示网站，使用 React + Vite + Tailwind CSS 构建。

## 🚀 在线访问

https://www.abaoa.cn

## 📦 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图标**: Iconify
- **部署**: Vercel

## 🖥️ 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🎸 子应用：TabPilot 网页版

本站的 `public/tabpilot/` 是独立的静态子应用「谱领航 TabPilot」（吉他谱自动跟随），
构建后通过 **https://www.abaoa.cn/tabpilot/** 访问，与本站的 React 路由完全隔离。

- **技术**：纯静态 HTML/CSS/JS + alphaTab（无构建步骤，Vite 会原样拷贝 `public/`）
- **两种模式**：`/tabpilot/` 谱面模式、`/tabpilot/image-tab.html` 图片谱模式
- **PWA**：可「添加到主屏幕」离线使用；Service Worker 作用域限定在 `/tabpilot/`，不影响主站
- **麦克风**：跟随功能依赖 `getUserMedia`，**必须 HTTPS**（本站已满足）

### 更新子应用

`public/tabpilot/` 是**生成物**，但必须提交进 Git —— Vercel 构建时只拉取本站仓库，
拿不到 TabPilot 的源码目录。同步命令：

```bash
# 默认从 ../Guitar/tab-follower/public 同步（可用参数或 TABPILOT_SRC 覆盖）
npm run sync:tabpilot

# 指定源目录
node scripts/sync-tabpilot.js /path/to/tab-follower/public
```

脚本会：清空目标目录后全量拷贝 → 把 `manifest.json` 改写为 `/tabpilot/` 绝对前缀
→ 在模式切换导航注入「🏠 主站」入口。同步后记得 `git add public/tabpilot` 并提交。

> 源应用改动后务必**重新同步**，否则站点上仍是旧版本。
> 另：`/tabpilot` 会 302 到 `/tabpilot/`（见 `vercel.json` 的 `redirects`）。

## 📝 新增作品

### 方式一：前端表单（推荐）

访问 `/admin` 页面，通过可视化表单编辑作品信息：

1. 打开 `/admin` 页面
2. 点击「新建作品」或编辑现有作品
3. 填写表单并下载 `info.json`
4. 放入作品文件夹，运行 `node scripts/generate-manifest.js`

### 方式二：手动编辑

查看 [新增作品说明书.md](./新增作品说明书.md) 了解详细步骤。

### 快速命令

```bash
# 自动生成作品列表（编辑后必须执行）
node scripts/generate-manifest.js
```

## 📁 项目结构

```
src/
├── components/          # 组件
├── contexts/           # 上下文
├── pages/              # 页面
└── App.jsx            # 主应用

public/
├── tabpilot/           # TabPilot 网页版（由 scripts/sync-tabpilot.js 生成）
└── works/              # 作品数据
    ├── manifest.json   # 作品列表（自动生成）
    ├── __template__/   # 作品模板
    └── [作品文件夹]/   # 单个作品数据

scripts/
├── generate-manifest.js  # 生成作品列表
└── sync-tabpilot.js      # 同步 TabPilot 子应用
```
