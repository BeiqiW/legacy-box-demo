import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// 上传到项目根 /data/uploads
const UPLOAD_DIR = process.env.LEGACY_UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');

// Next.js 不要试图解析 body。默认有 1MB 限制，这里提高
// Next 14+ 采用 segment config。请用 Vercel-style 运行环境变量或 next.config bodySizeLimit。
export const runtime = 'nodejs';
export const maxDuration = 60;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (user.role !== 'admin' && user.role !== 'member') {
    return NextResponse.json({ ok: false, error: '需要登录家族成员账号' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ ok: false, error: '没有上传文件' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '';
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${hash}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, buf);

    // 返回的 URL 通过我们的 /api/files/[filename] 路由提供
    return NextResponse.json({
      ok: true,
      url: `/api/files/${filename}`,
      filename,
      size: buf.length,
      type: file.type,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}
