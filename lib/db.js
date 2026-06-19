const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Resolve from project cwd (overridable via LEGACY_DB_PATH) so the app runs on any machine
const DB_PATH = process.env.LEGACY_DB_PATH || path.join(process.cwd(), 'data', 'legacy.db');
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db;
function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  init(_db);
  migrate(_db);
  return _db;
}

function init(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('guest','member','admin')),
      person_id INTEGER REFERENCES people(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birth_year INTEGER,
      death_year INTEGER,
      role_in_family TEXT,
      bio_public TEXT,
      bio_private TEXT,
      photo_url TEXT,
      visibility TEXT NOT NULL DEFAULT 'public',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER,
      day INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      person_id INTEGER REFERENCES people(id),
      evidence_status TEXT DEFAULT 'attributed',
      visibility TEXT NOT NULL DEFAULT 'public',
      owner_user_id INTEGER REFERENCES users(id),
      published_to_main INTEGER DEFAULT 1,
      approval_status TEXT DEFAULT 'approved',
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      review_note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS archive_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT,
      date_taken TEXT,
      location TEXT,
      file_url TEXT,
      thumb_url TEXT,
      visibility TEXT NOT NULL DEFAULT 'member',
      owner_user_id INTEGER REFERENCES users(id),
      person_id INTEGER REFERENCES people(id),
      published_to_main INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS oral_histories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      speaker TEXT,
      recorded_date TEXT,
      duration_minutes INTEGER,
      transcript TEXT,
      audio_url TEXT,
      visibility TEXT NOT NULL DEFAULT 'member',
      owner_user_id INTEGER REFERENCES users(id),
      person_id INTEGER REFERENCES people(id),
      published_to_main INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS personal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL REFERENCES users(id),
      person_id INTEGER REFERENCES people(id),
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      year INTEGER,
      month INTEGER,
      day INTEGER,
      media_url TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      published_to_main INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

// ----------- Migration: 把旧表升级到新 schema -----------
function migrate(db) {
  // 1. users 表加 person_id
  if (!hasColumn(db, 'users', 'person_id')) {
    db.exec(`ALTER TABLE users ADD COLUMN person_id INTEGER REFERENCES people(id)`);
  }

  // 2. timeline_events / archive_items / oral_histories 加 owner_user_id, published_to_main
  for (const t of ['timeline_events', 'archive_items', 'oral_histories']) {
    if (!hasColumn(db, t, 'owner_user_id')) {
      db.exec(`ALTER TABLE ${t} ADD COLUMN owner_user_id INTEGER REFERENCES users(id)`);
    }
    if (!hasColumn(db, t, 'published_to_main')) {
      db.exec(`ALTER TABLE ${t} ADD COLUMN published_to_main INTEGER DEFAULT 1`);
    }
  }

  // archive_items / oral_histories 加 person_id（如果没有）
  for (const t of ['archive_items', 'oral_histories']) {
    if (!hasColumn(db, t, 'person_id')) {
      db.exec(`ALTER TABLE ${t} ADD COLUMN person_id INTEGER REFERENCES people(id)`);
    }
  }

  // timeline_events 审核列
  if (!hasColumn(db, 'timeline_events', 'approval_status')) {
    db.exec(`ALTER TABLE timeline_events ADD COLUMN approval_status TEXT DEFAULT 'approved'`);
  }
  if (!hasColumn(db, 'timeline_events', 'reviewed_by')) {
    db.exec(`ALTER TABLE timeline_events ADD COLUMN reviewed_by INTEGER REFERENCES users(id)`);
  }
  if (!hasColumn(db, 'timeline_events', 'reviewed_at')) {
    db.exec(`ALTER TABLE timeline_events ADD COLUMN reviewed_at TEXT`);
  }
  if (!hasColumn(db, 'timeline_events', 'review_note')) {
    db.exec(`ALTER TABLE timeline_events ADD COLUMN review_note TEXT`);
  }

  // 2.5 英文翻译列（i18n）：为可翻译字段补 *_en 列
  const enCols = {
    users: ['display_name_en'],
    people: ['name_en', 'role_in_family_en', 'bio_public_en', 'bio_private_en'],
    timeline_events: ['title_en', 'description_en'],
    archive_items: ['title_en', 'description_en', 'location_en'],
    oral_histories: ['title_en', 'speaker_en', 'transcript_en'],
  };
  for (const [table, cols] of Object.entries(enCols)) {
    for (const col of cols) {
      if (!hasColumn(db, table, col)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT`);
      }
    }
  }

  // 3. 重建表来删除 visibility CHECK 约束、支持 private
  //    SQLite 重建表时需暂时关闭外键检查
  db.pragma('foreign_keys = OFF');
  try {
    rebuildIfHasCheck(db, 'timeline_events');
    rebuildIfHasCheck(db, 'archive_items');
    rebuildIfHasCheck(db, 'oral_histories');
    rebuildIfHasCheck(db, 'people');
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

function hasColumn(db, table, col) {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return rows.some((r) => r.name === col);
  } catch {
    return false;
  }
}

function rebuildIfHasCheck(db, table) {
  // 检测 sqlite_master 里是否有 CHECK(visibility IN(...)) 约束
  const meta = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(table);
  if (!meta || !meta.sql) return;
  // 如果没有 visibility CHECK 约束，跳过
  if (!/visibility[^,]*CHECK\s*\(/i.test(meta.sql)) return;

  // 获取列名
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  const colsCsv = cols.join(', ');

  const newName = `${table}__new`;

  db.exec('BEGIN');
  try {
    // 根据 table 重建（无 CHECK）
    if (table === 'timeline_events') {
      db.exec(`
        CREATE TABLE ${newName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          year INTEGER NOT NULL,
          month INTEGER,
          day INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          person_id INTEGER REFERENCES people(id),
          evidence_status TEXT DEFAULT 'attributed',
          visibility TEXT NOT NULL DEFAULT 'public',
          owner_user_id INTEGER REFERENCES users(id),
          published_to_main INTEGER DEFAULT 1,
          approval_status TEXT DEFAULT 'approved',
          reviewed_by INTEGER REFERENCES users(id),
          reviewed_at TEXT,
          review_note TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
    } else if (table === 'archive_items') {
      db.exec(`
        CREATE TABLE ${newName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          kind TEXT NOT NULL,
          description TEXT,
          date_taken TEXT,
          location TEXT,
          file_url TEXT,
          thumb_url TEXT,
          visibility TEXT NOT NULL DEFAULT 'member',
          owner_user_id INTEGER REFERENCES users(id),
          person_id INTEGER REFERENCES people(id),
          published_to_main INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
    } else if (table === 'oral_histories') {
      db.exec(`
        CREATE TABLE ${newName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          speaker TEXT,
          recorded_date TEXT,
          duration_minutes INTEGER,
          transcript TEXT,
          audio_url TEXT,
          visibility TEXT NOT NULL DEFAULT 'member',
          owner_user_id INTEGER REFERENCES users(id),
          person_id INTEGER REFERENCES people(id),
          published_to_main INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
    } else if (table === 'people') {
      db.exec(`
        CREATE TABLE ${newName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          birth_year INTEGER,
          death_year INTEGER,
          role_in_family TEXT,
          bio_public TEXT,
          bio_private TEXT,
          photo_url TEXT,
          visibility TEXT NOT NULL DEFAULT 'public',
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
    }

    // 只拷新表也有的列
    const newCols = db.prepare(`PRAGMA table_info(${newName})`).all().map((c) => c.name);
    const sharedCols = cols.filter((c) => newCols.includes(c));
    const sharedCsv = sharedCols.join(', ');

    db.exec(`INSERT INTO ${newName} (${sharedCsv}) SELECT ${sharedCsv} FROM ${table};`);
    db.exec(`DROP TABLE ${table};`);
    db.exec(`ALTER TABLE ${newName} RENAME TO ${table};`);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { getDb };
