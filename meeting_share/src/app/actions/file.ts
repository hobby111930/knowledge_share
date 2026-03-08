// src/app/actions/file.ts
'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import path from "path"
import { promises as fs } from "fs"
import type { FileItem } from "@/types"

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateFileSchema = z.object({
  groupId: z.string(),
  name: z.string().min(1),
  type: z.enum(['markdown', 'image']),
  size: z.number(),
  url: z.string(),
})

const UpdateOrdersSchema = z.array(z.object({
  id: z.string(),
  sortOrder: z.number(),
}))

export async function getFilesByGroup(groupId: string, type?: 'markdown' | 'image'): Promise<ActionResponse<FileItem[]>> {
  try {
    const files = await prisma.fileItem.findMany({
      where: {
        groupId,
        ...(type ? { type } : {})
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    const data: FileItem[] = files.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type as 'markdown' | 'image',
      size: (f.size / 1024).toFixed(1) + ' KB',
      status: 'uploaded',
      url: f.url,
      date: f.updatedAt.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      sortOrder: f.sortOrder
    }))

    return { success: true, data }
  } catch (error) {
    console.error("Failed to fetch files:", error)
    return { success: false, error: "获取文件列表失败" }
  }
}

export async function createFileRecord(data: z.infer<typeof CreateFileSchema>): Promise<ActionResponse<any>> {
  const validatedFields = CreateFileSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, error: "输入不符合规范" }
  }

  try {
    const { groupId, name, type, size, url } = validatedFields.data;
    
    // Calculate sortOrder
    const maxSortOrderFile = await prisma.fileItem.findFirst({
      where: { groupId, type },
      orderBy: { sortOrder: 'desc' }
    })
    const nextSortOrder = (maxSortOrderFile?.sortOrder ?? -1) + 1;

    const file = await prisma.fileItem.create({
      data: {
        groupId,
        name,
        type,
        size,
        url,
        sortOrder: nextSortOrder
      }
    })
    
    // Also update group updatedAt
    await prisma.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() }
    })

    revalidatePath('/')
    return { success: true, data: file }
  } catch (error) {
    console.error("Failed to create file record:", error)
    return { success: false, error: "保存文件记录失败" }
  }
}

export async function deleteFile(fileId: string): Promise<ActionResponse<boolean>> {
  try {
    const file = await prisma.fileItem.findUnique({
      where: { id: fileId }
    });

    if (file && file.url) {
      try {
        const relativeUrl = file.url.startsWith('/') ? file.url.slice(1) : file.url;
        const filePath = path.join(process.cwd(), 'public', relativeUrl);
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Failed to delete physical file:", err);
      }
    }

    await prisma.fileItem.delete({
      where: { id: fileId }
    })
    revalidatePath('/')
    return { success: true, data: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "删除文件失败" }
  }
}

export async function updateFileOrders(updates: z.infer<typeof UpdateOrdersSchema>): Promise<ActionResponse<boolean>> {
  const validatedFields = UpdateOrdersSchema.safeParse(updates)
  if (!validatedFields.success) {
    return { success: false, error: "数据格式错误" }
  }

  try {
    await prisma.$transaction(
      validatedFields.data.map((u) =>
        prisma.fileItem.update({
          where: { id: u.id },
          data: { sortOrder: u.sortOrder },
        })
      )
    )
    revalidatePath('/')
    return { success: true, data: true }
  } catch (error) {
    console.error("Failed to update file orders:", error)
    return { success: false, error: "更新排序失败" }
  }
}
