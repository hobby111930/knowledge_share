# 接口层设计 (Server Actions)

## 1. 概述
根据本项目的后端技术规范，后端层将剥离传统的 REST API，改用 Next.js 的 **Server Actions**，搭配 **Zod** 进行严谨的入参校验。所有 Action 函数需统一返回以下标准对象：

```typescript
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## 2. Server Actions 设计定义

### 2.1 会议分组管理 (Group Actions)

建议文件位置: `src/app/actions/group.ts` 或根据特征模块存放。

#### 1. `getGroups`
- **功能**: 获取所有会议分组的列表，并同时返回统计信息（以供主界面卡片展示）。
- **入参**: 无
- **出参**: `ActionResponse<GroupWithCounts[]>`
- **说明**: 会使用 Prisma 获取，连同 `_count: { files: true }` 按类型分类，为每个组附带 `markdownCount` 和 `imageCount`。

#### 2. `createGroup`
- **功能**: 新建会议分组。
- **入参**: 
  - `name`: string (必须验证 `min(1)`)
- **出参**: `ActionResponse<Group>`
- **说明**: 内部会随机分配或根据一定规则指派默认 `color`，写表完成后执行 `revalidatePath('/')` 使前端卡片即刻更新。

#### 3. `deleteGroup`
- **功能**: 删除指定的会议分组（级联删除内部文件）。
- **入参**: 
  - `id`: string
- **出参**: `ActionResponse<boolean>`
- **说明**: 删除执行完毕后，执行 `revalidatePath` 更新界面。

---

### 2.2 文件内容与顺序管理 (File Actions)

建议文件位置: `src/app/actions/file.ts`

#### 1. `getFilesByGroup`
- **功能**: 依据文件类型与所属组拉取有序文件列表。
- **入参**:
  - `groupId`: string
  - `type`?: 'markdown' | 'image' (可选，供不同面板筛选)
- **出参**: `ActionResponse<FileItem[]>`
- **说明**: 在数据库查询中必须追加 `orderBy: { sortOrder: 'asc' }` 保证顺序输出给前端播放或显示。

#### 2. `createFileRecord`
- **功能**: 用户上传完物理文件后，在数据库落库生成文件记录。
- **入参**:
  - 包含: `groupId`, `name`, `type`, `size(number)`, `url` 的扁平对象。
- **出参**: `ActionResponse<FileItem>`
- **说明**: 必须验证目标分组是否存在。文件默认追加至末尾，其 `sortOrder` 在创建时计算得出（取当前分组该类型文件的 `max(sortOrder) + 1`）。

#### 3. `deleteFile`
- **功能**: 移除单条文件记录。
- **入参**:
  - `fileId`: string
- **出参**: `ActionResponse<boolean>`

#### 4. `updateFileOrders`
- **功能**: 批量更新文件排序结果。针对拖放排序(`dnd-kit`)修改后点击“保存修改”时所用的接口。
- **入参**: 
  - `updates`: Array<{ id: string, sortOrder: number }> (通过 Zod 的 array schema 校验)
- **出参**: `ActionResponse<boolean>`
- **说明**: 利用 `prisma.$transaction()` 包裹循环层面的 `prisma.fileItem.update` 以达到原子化执行，确保所有排序一次性无误存储，执行后调用 `revalidatePath` 以清除缓存刷新列表。
