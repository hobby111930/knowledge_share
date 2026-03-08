<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/948e749a-8d10-46b5-844f-897004695c1e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# 工程目录
```
src/
├── types/
│   └── index.ts          # 类型定义
├── data/
│   └── mockData.ts       # Mock 数据
├── components/
│   ├── SortableItem.tsx   # 拖拽排序组件
│   └── Header.tsx         # 页头组件
├── pages/
│   ├── GroupManagement.tsx # 分组管理页面
│   ├── ContentUpload.tsx  # 内容上传页面
│   └── ContentShare.tsx   # 内容分享页面
├── App.tsx                # 根组件（路由+状态）
├── main.tsx               # 入口文件
└── index.css              # 全局样式

```