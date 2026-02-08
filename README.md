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

public/works/           # 作品数据
├── manifest.json       # 作品列表（自动生成）
├── __template__/       # 作品模板
└── [作品文件夹]/       # 单个作品数据
```
