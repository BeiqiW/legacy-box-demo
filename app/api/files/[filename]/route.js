import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.LEGACY_UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.mp4': 'video/mp4', '.txt': 'text/plain',
};

export async function GET(req, { params }) {
  const filename = params.filename;
  // 防御路径穿越
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Bad filename', { status: 400 });
  }

  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const buf = fs.readFileSync(filepath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  return new NextResponse(buf, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
