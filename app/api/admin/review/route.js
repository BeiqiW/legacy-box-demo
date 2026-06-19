import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req) {
  const user = await getCurrentUser();
  if (user.role !== 'admin') {
    return NextResponse.json({ ok: false, error: '需要管理员权限' }, { status: 403 });
  }

  const { id, action, note } = await req.json();
  if (!id || !['approve', 'reject', 'reset'].includes(action)) {
    return NextResponse.json({ ok: false, error: '参数错误' }, { status: 400 });
  }

  const db = getDb();
  const statusMap = { approve: 'approved', reject: 'rejected', reset: 'pending' };
  const status = statusMap[action];

  try {
    db.prepare(
      `UPDATE timeline_events
       SET approval_status = ?, reviewed_by = ?, reviewed_at = datetime('now'), review_note = ?
       WHERE id = ?`
    ).run(status, user.id, note || null, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}
