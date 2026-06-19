import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 家族成员可以管理的表：含 owner_user_id 字段
const TABLES = {
  timeline_events: {
    fields: ['year', 'month', 'day', 'title', 'description', 'person_id', 'evidence_status', 'visibility', 'published_to_main'],
    required: ['year', 'title'],
  },
  archive_items: {
    fields: ['title', 'kind', 'description', 'date_taken', 'location', 'file_url', 'thumb_url', 'visibility', 'person_id', 'published_to_main'],
    required: ['title', 'kind'],
  },
  oral_histories: {
    fields: ['title', 'speaker', 'recorded_date', 'duration_minutes', 'transcript', 'audio_url', 'visibility', 'person_id', 'published_to_main'],
    required: ['title'],
  },
  personal_entries: {
    fields: ['person_id', 'kind', 'title', 'body', 'year', 'month', 'day', 'media_url', 'visibility', 'published_to_main'],
    required: ['title', 'kind'],
  },
};

async function checkMember() {
  const u = await getCurrentUser();
  if (u.role !== 'member' && u.role !== 'admin') {
    return { error: NextResponse.json({ ok: false, error: '需要登录家族成员账号' }, { status: 403 }) };
  }
  return { user: u };
}

function validateTable(table) {
  if (!TABLES[table]) {
    return NextResponse.json({ ok: false, error: '未知表名' }, { status: 400 });
  }
  return null;
}

function normalizeValue(v) {
  if (v === '') return null;
  if (typeof v === 'string') return v.trim();
  return v;
}

export async function POST(req, { params }) {
  const { error, user } = await checkMember();
  if (error) return error;

  const { table } = params;
  const v = validateTable(table); if (v) return v;

  const body = await req.json();
  const def = TABLES[table];

  for (const k of def.required) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      return NextResponse.json({ ok: false, error: `字段 ${k} 必填` }, { status: 400 });
    }
  }

  const db = getDb();
  const cols = def.fields.filter((f) => body[f] !== undefined);
  const values = cols.map((c) => normalizeValue(body[c]));

  // 加 owner_user_id
  cols.push('owner_user_id');
  values.push(user.id);

  // timeline_events 审核：成员提交强制 pending，admin 默认 approved
  if (table === 'timeline_events') {
    cols.push('approval_status');
    values.push(user.role === 'admin' ? 'approved' : 'pending');
  }

  const placeholders = cols.map(() => '?').join(', ');

  try {
    const result = db
      .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`)
      .run(...values);
    return NextResponse.json({
      ok: true,
      id: result.lastInsertRowid,
      pendingReview: table === 'timeline_events' && user.role !== 'admin',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  const { error, user } = await checkMember();
  if (error) return error;

  const { table } = params;
  const v = validateTable(table); if (v) return v;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ ok: false, error: '缺少 id' }, { status: 400 });

  const db = getDb();
  // 校验所属
  const existing = db.prepare(`SELECT owner_user_id FROM ${table} WHERE id = ?`).get(body.id);
  if (!existing) return NextResponse.json({ ok: false, error: '记录不存在' }, { status: 404 });

  if (user.role !== 'admin' && existing.owner_user_id !== user.id) {
    return NextResponse.json({ ok: false, error: '无权修改他人的内容' }, { status: 403 });
  }

  const def = TABLES[table];
  const cols = def.fields.filter((f) => body[f] !== undefined);
  if (!cols.length) return NextResponse.json({ ok: false, error: '没有可更新字段' }, { status: 400 });

  const setClause = cols.map((c) => `${c} = ?`).join(', ');
  const values = cols.map((c) => normalizeValue(body[c]));

  // 成员修改自己的 timeline_events 后需重新审核
  let extra = '';
  if (table === 'timeline_events' && user.role !== 'admin') {
    extra = `, approval_status = 'pending', reviewed_by = NULL, reviewed_at = NULL, review_note = NULL`;
  }

  values.push(body.id);

  try {
    db.prepare(`UPDATE ${table} SET ${setClause}${extra} WHERE id = ?`).run(...values);
    return NextResponse.json({
      ok: true,
      pendingReview: table === 'timeline_events' && user.role !== 'admin',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const { error, user } = await checkMember();
  if (error) return error;

  const { table } = params;
  const v = validateTable(table); if (v) return v;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: '缺少 id' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare(`SELECT owner_user_id FROM ${table} WHERE id = ?`).get(id);
  if (!existing) return NextResponse.json({ ok: false, error: '记录不存在' }, { status: 404 });

  if (user.role !== 'admin' && existing.owner_user_id !== user.id) {
    return NextResponse.json({ ok: false, error: '无权删除他人的内容' }, { status: 403 });
  }

  try {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}
