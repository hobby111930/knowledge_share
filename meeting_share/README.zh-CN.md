<div align="center">

[English](./README.md) | [简体中文](./README.zh-CN.md)
</div>

# 会议报告 / OpenClaw Share

一个现代化的全栈 Next.js 应用程序，旨在管理、展示和分享会议报告及相关媒体内容。该平台允许用户创建美观的会议分组，上传相关文件（图片和文档），通过拖拽直观地重新排序内容，并在媒体旁边显示沉浸式的 AI 辅助摘要面板进行对照查看。

## ✨ 主要特性

- **分组管理**：创建、编辑和组织会议分组。支持自定义具有特定颜色、缩略图和会议时间的分组。
- **内容管理**：向分组上传图像和文件。通过拖拽（Drag-and-Drop）直观地对内容进行自由排序。在前端页面删除文件时会安全地与本地文件系统保持同步。
- **沉浸式分享与播放视图**：用于展示和播放报告的独立视图页面。用户可以将图片与通过 Markdown 渲染的 AI 总结报告并排对照查看。自带图片导航切换和可折叠的 Markdown 内容面板。
- **AI 集成**：由 Google 的 Gemini AI 驱动，用于生成具有深度见解与结构的会议内容及纪要汇总。

## 🛠️ 技术栈

- **前端框架**: Next.js (App Router), React 19
- **数据库 ORM**: Prisma + SQLite (`better-sqlite3`)
- **UI 样式**: Tailwind CSS v4
- **动画引擎**: Motion (Framer Motion)
- **拖拽组件**: `@dnd-kit`
- **Markdown 渲染**: `react-markdown`
- **图标库**: `lucide-react`
- **AI 服务**: `@google/genai` (Gemini SDK)

## 🚀 快速开始

### 依赖环境
- Node.js (推荐 v18+)
- npm 或 yarn

### 1. 安装依赖
```bash
npm install
```

### 2. 环境变量
在项目根目录下创建一个 `.env` 文件，并添加以下参数：
```env
# SQLite 数据库文件路径
DATABASE_URL="file:./dev.db"

# Gemini AI 密钥
GEMINI_API_KEY="your_api_key_here"
```

### 3. 初始化数据库
将 Prisma Schema 模型同步至 SQLite 本地数据库文件：
```bash
npx prisma db push
```

### 4. 启动本地开发服务
```bash
npm run dev
```
在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可预览。

## 📁 目录结构

```text
meeting_share/
├── prisma/               # Prisma 数据库 schema (schema.prisma)
├── public/               # 静态资源 (图片等)
├── docs/                 # 项目文档
├── src/
│   ├── app/              # Next.js App Router 结构 (路由页面, 布局)
│   │   └── actions/      # Next.js Server Actions 接口后端 (例如: group.ts)
│   ├── components/       # 可复用的 React UI 组件 (顶部导航栏、卡片、拖拽项等)
│   ├── data/             # Mock 数据及工具
│   ├── lib/              # 库封装模块及公共函数
│   ├── views/            # 高阶视图组件和页面组合板块
│   └── types/            # TypeScript 类型声明定义层
├── .env                  # 环境变量配置
└── package.json          # 项目依赖和配置信息
```
