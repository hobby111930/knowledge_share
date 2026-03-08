// src/app/actions/group.ts
'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Group } from "@/types"

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const CreateGroupSchema = z.object({
  name: z.string().min(1, "分组名称不能为空"),
  meetingTime: z.string().optional(),
})

export async function getGroups(): Promise<ActionResponse<Group[]>> {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: {
            files: true,
          }
        },
        files: {
          select: {
            type: true,
            url: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const data: Group[] = groups.map(g => {
      const images = g.files.filter(f => f.type === 'image');
      const firstImage = images.length > 0 ? images[0].url : undefined;
      
      return {
        id: g.id,
        name: g.name,
        markdownCount: g.files.filter(f => f.type === 'markdown').length,
        imageCount: images.length,
        meetingTime: (g as any).meetingTime ? new Date((g as any).meetingTime).toLocaleString('zh-CN') : (g.updatedAt?.toLocaleString('zh-CN') || ''),
        updatedAt: g.updatedAt?.toLocaleString('zh-CN') || '',
        color: g.color,
        thumbnail: g.thumbnail || firstImage,
      };
    })

    return { success: true, data }
  } catch (error) {
    console.error("Failed to fetch groups:", error)
    return { success: false, error: "获取分组列表失败" }
  }
}

export async function createGroup(data: z.infer<typeof CreateGroupSchema>): Promise<ActionResponse<any>> {
  const validatedFields = CreateGroupSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.flatten().fieldErrors.name?.[0] || "输入不符合规范" }
  }

  const colors = [
    'bg-blue-100 text-blue-500',
    'bg-emerald-100 text-emerald-500',
    'bg-purple-100 text-purple-500',
    'bg-amber-100 text-amber-500',
    'bg-pink-100 text-pink-500',
    'bg-indigo-100 text-indigo-500'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  try {
    const group = await prisma.group.create({
      data: {
        name: validatedFields.data.name,
        color,
        ...(validatedFields.data.meetingTime ? { meetingTime: new Date(validatedFields.data.meetingTime) } : {}),
      }
    })
    revalidatePath('/')
    return { success: true, data: group }
  } catch (error) {
    console.error("Failed to create group:", error)
    return { success: false, error: "新建分组失败" }
  }
}

export async function deleteGroup(id: string): Promise<ActionResponse<boolean>> {
  try {
    await prisma.group.delete({
      where: { id }
    })
    revalidatePath('/')
    return { success: true, data: true }
  } catch (error) {
    console.error("Failed to delete group:", error)
    return { success: false, error: "删除分组失败" }
  }
}

const UpdateGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "分组名称不能为空"),
  meetingTime: z.string().optional(),
})

export async function updateGroup(data: z.infer<typeof UpdateGroupSchema>): Promise<ActionResponse<any>> {
  const validatedFields = UpdateGroupSchema.safeParse(data)
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.flatten().fieldErrors.name?.[0] || "输入不符合规范" }
  }

  try {
    const group = await prisma.group.update({
      where: { id: validatedFields.data.id },
      data: {
        name: validatedFields.data.name,
        ...(validatedFields.data.meetingTime ? { meetingTime: new Date(validatedFields.data.meetingTime) } : {}),
      }
    })
    revalidatePath('/')
    return { success: true, data: group }
  } catch (error) {
    console.error("Failed to update group:", error)
    return { success: false, error: "编辑分组失败" }
  }
}
