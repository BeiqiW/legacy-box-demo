import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// 表名白名单 - 防止 SQL 注入
const TABLES = {
  people: {
    fields: ['name', 'birth_year', 'death_year', 'role_in_family', 'bio_public', 'bio_private', 'photo_url', 'visibility'],
    required: ['name'],
  },
  timeline_events: {
    fields: ['year', 'month', 'day', 'title', 'description', 'person_id', 'evidence_status', 'visibility', 'published_to_main'],
    required: ['year', 'title'],
  },
  archive_items: {
    fields: ['title', 'kind', 'description', 'date_taken', 'location', 'file_url', 'thumb_url', 'person_id', 'visibility', 'published_to_main'],
    required: ['title', 'kind'],
  },
  oral_histories: {
    fields: ['title', 'speaker', 'recorded_date', 'duration_minutes', 'transcript', 'audio_url', 'person_id', 'visibility', 'published_to_main'],
    required: ['title'],
  },
  users: {
    fields: ['username', 'display_name', 'role'],
    required: ['username', 'role'],
    special: 'users',
  },
};

async function checkAdmin() {
  const user = await getCurrentUser();
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ ok: false, error: '需要管理员权限' }, { status: 403 }) };
  }
  return { user };
}

function validateTable(table) {
  if (!TABLES[table]) {
    return NextResponse.json({ ok: false, error: '未知表名' }, { status: 400 });
  }
  return null;
}

// POST = create, PUT = update, DELETE = remove
export async function POST(req, { params }) {
  const { error } = await checkAdmin();
  if (error) return error;

  const { table } = params;
  const v = validateTable(table); if (v) return v;

  const body = await req.json();
  const def = TABLES[table];

  // 检查必填
  for (const k of def.required) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      return NextResponse.json({ ok: false, error: `字段 ${k} 必填` }, { status: 400 });
    }
  }

  const db = getDb();
  const cols = def.fields.filter((f) => body[f] !== undefined);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map((c) => normalizeValue(body[c]));

  // 特殊处理 users 表的密码
  if (def.special === 'users') {
    if (!body.password) {
      return NextResponse.json({ ok: false, error: '新建用户必须设置密码' }, { status: 400 });
    }
    cols.push('password_hash');
    placeholders.split(', ');
    values.push(hashPassword(body.password));
    try {
      const result = db.prepare(
        `INSERT INTO users (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
      ).run(...values);
      return NextResponse.json({ ok: true, id: result.lastInsertRowid });
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
    }
  }

  try {
    const result = db
      .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`)
      .run(...values);
    return NextResponse.json({ ok: true, id: result.lastInsertRowid });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  const { error } = await checkAdmin();
  if (error) return error;

  const { table } = params;
  const v = validateTable(table); if (v) return v;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ ok: false, error: '缺少 id' }, { status: 400 });

  const def = TABLES[table];
  const db = getDb();
  const cols = def.fields.filter((f) => body[f] !== undefined);

  // 特殊处理 users 的密码更新（可选）
  const extraSets = [];
  const extraVals = [];
  if (def.special === 'users' && body.password) {
    extraSets.push('password_hash = ?');
    extraVals.push(hashPassword(body.password));
  }

  if (!cols.length && !extraSets.length) {
    return NextResponse.json({ ok: false, error: '没有可更新字段' }, { status: 400 });
  }

  const setClause = [...cols.map((c) => `${c} = ?`), ...extraSets].join(', ');
  const values = [...cols.map((c) => normalizeValue(body[c])), ...extraVals];
  values.push(body.id);

  try {
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await checkAdmin();
  if (error) return error;

  const { table } = params;
  const v = validateTable(table); if (v) return v;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: '缺少 id' }, { status: 400 });

  // 不允许删除自己
  if (table === 'users') {
    const me = (await getCurrentUser()).id;
    if (Number(id) === me) {
      return NextResponse.json({ ok: false, error: '不能删除当前登录的管理员账号' }, { status: 400 });
    }
  }

  const db = getDb();
  try {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 400 });
  }
}

function normalizeValue(v) {
  if (v === '') return null;
  if (typeof v === 'string') return v.trim();
  return v;
}
