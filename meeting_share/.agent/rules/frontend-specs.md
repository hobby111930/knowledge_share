---
trigger: model_decision
description: 当进行项目的前端开发，且涉及 TypeScript、Next.js、Tailwind CSS 相关的 UI 优化或组件构建任务时应用。
---

# 前端技术规范

## 1. 代码风格
- 使用 TypeScript，严格模式开启。
- 样式：必须使用 Tailwind CSS。避免在 `globals.css` 中写长段 CSS。
- 响应式：优先使用 `sm:`, `md:`, `lg:` 等断点，禁止硬编码像素值。

## 2. Gemini 3.1 专用指令
- **Vibe Coding**: 当我要求“优化 UI 质感”时，优先使用 Tailwind 的混合模式 (mix-blend-mode) 和 Gemini 3.1 擅长的 SVG 动画。
- **Context Awareness**: 在生成新组件前，必须先读取 `@/components/ui` 下的相关 shadcn 组件作为参考，确保设计语言统一。
- **Error Handling**: 所有异步操作必须包含 `try-catch` 和友好的用户提示 UI。

## 3. 性能约束
- 优先使用 Server Components 减少 Bundle Size。
- 所有的图片必须使用 `next/image` 进行 AI 自动优化。
- 交互复杂的组件必须使用 `use client` 并在文件开头明确标注。