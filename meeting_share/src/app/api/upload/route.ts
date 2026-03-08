import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const UploadSchema = z.object({
  groupId: z.string().min(1, '分组ID不能为空'),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const groupId = formData.get('groupId') as string;
    const file = formData.get('file') as File | null;

    if (!groupId || !file) {
      return NextResponse.json({ success: false, error: '缺少必要参数 (groupId 或 file)' }, { status: 400 });
    }

    const validation = UploadSchema.safeParse({ groupId });
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0]?.message || '参数校验失败' }, { status: 400 });
    }

    const isMarkdown = file.name.toLowerCase().endsWith('.md');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    if (!isMarkdown && !isImage) {
      return NextResponse.json({ success: false, error: '不支持的文件类型，仅支持 MD 或图片文件' }, { status: 400 });
    }

    const fileTypeDir = isMarkdown ? 'markdown' : 'image';

    // 构建目标路径: [项目根目录]/public/uploads/[groupId]/[markdown|image]/[文件名]
    const targetDir = path.join(process.cwd(), 'public', 'uploads', groupId, fileTypeDir);

    // 确保目标目录存在
    await fs.mkdir(targetDir, { recursive: true });

    const targetFilePath = path.join(targetDir, file.name);

    // 将文件内容转换为 Buffer 并写入文件系统
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(targetFilePath, buffer);

    return NextResponse.json({
      success: true,
      data: {
        name: file.name,
        size: file.size,
        type: fileTypeDir
      }
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: '文件上传过程中发生服务器错误' }, { status: 500 });
  }
}
