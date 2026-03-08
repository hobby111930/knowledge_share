# 数据库层设计 (Prisma + SQLite)

## 1. 概述
本项目根据 `back-end-specs.md` 规范，以“无独立后端”思想，采用 SQLite 作为本地数据库，使用 Prisma 作为强类型 ORM。

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  // 默认使用本地文件存储
  url      = env("DATABASE_URL") 
}

// -----------------------------------------------------------------
// 会议分组表 (Group)
// -----------------------------------------------------------------
model Group {
  id          String     @id @default(uuid())
  name        String     // 分组名称 (如 "2024年度战略会议")
  color       String     // UI 颜色主题标识 (如 "bg-blue-500 text-blue-500")
  thumbnail   String?    // 封面缩略图路径或 URL，可为空
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  files       FileItem[] // 关联的文件列表

  @@index([createdAt(sort: Desc)])
}

// -----------------------------------------------------------------
// 文件管理表 (FileItem)
// 统一管理分组下的 Markdown 文档和图片素材
// -----------------------------------------------------------------
model FileItem {
  id          String     @id @default(uuid())
  name        String     // 文件名 (包含后缀)
  type        String     // 文件类型限定: "markdown" | "image"
  size        Int        // 文件大小 (单位: bytes)
  url         String     // 文件实际存放地址结构或本地相对路径
  sortOrder   Int        @default(0) // 排序字段，用于前端拖拽重排后持久化存储顺序
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  groupId     String
  group       Group      @relation(fields: [groupId], references: [id], onDelete: Cascade)

  // 优化按组、按类型查找和排序时的性能
  @@index([groupId, type, sortOrder])
}
```

## 3. 模型设计说明

1. **Group (会议分组)**:
   - 储存会议的元数据。
   - `markdownCount` 和 `imageCount` 这类前端需要的统计数据，不采用在数据表中维护冗余计数器的方式存储，而是在数据查询时借助 Prisma 的 `_count` 聚合功能动态返回。

2. **FileItem (会议文件)**:
   - 涵盖了文字文档（`.md`）和包含演示界面的图片素材。通过 `type` 字段进行类型区分。
   - 核心字段 `sortOrder` 为了支持基于 `dnd-kit` 的任意拖拽调整排序实现。
   - 对外键 `groupId` 设置了 `@relation(..., onDelete: Cascade)`，在直接删除分组时能由数据库底层自动级联清理相应的文件记录，保证记录的整洁。
