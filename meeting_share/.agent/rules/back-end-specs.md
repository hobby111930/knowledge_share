---
trigger: model_decision
description: 本规范旨在定义如何在 Next.js 框架内，以“无独立后端”的思想，利用 Node.js 和 SQLite 构建高效、类型安全的数据处理层。
---

# 后端技术规约 (v1.0)

本规范旨在定义如何在 Next.js 框架内，以“无独立后端”的思想，利用 Node.js 和 SQLite 构建高效、类型安全的数据处理层。

## 1. 核心技术栈 (Tech Stack)

* **框架:** Next.js (App Router)
* **数据库:** SQLite (本地文件存储)
* **ORM (对象关系映射):** Prisma
* **数据校验:** Zod
* **逻辑触发:** Server Actions (首选) & Route Handlers (备选)

---

## 2. 目录结构规范

为了保证前后端逻辑不混乱，采用 **功能导向** 的目录结构：

```text
/src
  /app
    /api                # 仅用于外部调用或特殊 Webhook 的 Route Handlers
    /posts
      page.tsx          # 前端页面
      actions.ts        # 【关键】该模块对应的后端逻辑 (Server Actions)
  /lib
    prisma.ts           # Prisma Client 单例封装
    validations.ts      # 全局 Zod 校验 Schema
  /prisma
    schema.prisma       # 数据库模型定义
    dev.db              # SQLite 数据库文件 (本地)

```

---

## 3. 数据库开发规范 (Prisma + SQLite)

### 3.1 客户端单例

在 Next.js 开发环境下，为了防止 HMR (热更新) 导致创建过多的数据库连接，必须使用单例模式：

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

```

### 3.2 变更流程

1. 修改 `prisma/schema.prisma` 中的模型。
2. 执行 `npx prisma migrate dev --name <描述>` 同步数据库。
3. **禁止直接修改数据库文件**，必须通过 Prisma Schema 驱动变更。

---

## 4. 数据交互规范 (Server Actions)

在 Antigravity 项目中，**Server Actions 是替代传统 API 接口的首选方案。**

### 4.1 编写规范

* **文件位置:** 放在对应业务目录下的 `actions.ts` 中。
* **强制标记:** 文件顶部必须声明 `'use server'`。
* **安全性:** 即使是本地项目，也要使用 **Zod** 进行输入校验。

**代码示例：**

```typescript
// src/app/posts/actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const PostSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string().optional(),
})

export async function createPost(data: z.infer<typeof PostSchema>) {
  // 1. 校验数据
  const validatedFields = PostSchema.safeParse(data)
  if (!validatedFields.success) return { error: "数据格式错误" }

  try {
    // 2. 写入 SQLite
    await prisma.post.create({ data: validatedFields.data })
    
    // 3. 刷新前端缓存
    revalidatePath('/posts') 
    return { success: true }
  } catch (e) {
    return { error: "数据库写入失败" }
  }
}

```

---

## 5. 错误处理与响应规范

为了保持前后端一致性，所有后端函数（Actions）应返回统一的 JSON 对象：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `success` | boolean | 操作是否成功 |
| `data` | object/array | 返回的数据 (可选) |
| `error` | string | 错误提示信息 (可选) |

---

## 6. 开发环境约束

* **本地存储:** `.db` 文件必须列入 `.gitignore`（除非你需要提交初始种子数据）。
* **性能监控:** SQLite 在本地非常快，但涉及大量写入时（如循环写入），请使用 `prisma.createMany()` 以减少 I/O 压力。
* **调试工具:** 使用 `npx prisma studio` 开启可视化控制台，直接在浏览器查看和修改本地数据。