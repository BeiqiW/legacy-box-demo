const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');
const { cookies } = require('next/headers');
const { getDb } = require('./db');

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'legacy-labs-demo-secret-change-me-in-production'
);
const COOKIE_NAME = 'legacy_session';

// Role hierarchy: admin > member > guest
const ROLE_LEVEL = { guest: 0, member: 1, admin: 2 };

function canAccess(userRole, requiredRole) {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[requiredRole] ?? 0);
}

function visibilityForRole(role) {
  // Returns SQL placeholders for which visibility tiers this role can see
  if (role === 'admin') return ['public', 'member', 'admin'];
  if (role === 'member') return ['public', 'member'];
  return ['public'];
}

/**
 * 检查用户是否能看到某条记录
 * - admin: 看一切
 * - member: 看 public/member 、以及所有 owner_user_id == 自己的记录（含 private）
 * - guest: 只看 public
 */
function canSeeRecord(user, record) {
  if (user.role === 'admin') return true;
  if (record.owner_user_id && record.owner_user_id === user.id) return true;
  if (record.visibility === 'public') return true;
  if (record.visibility === 'member' && user.role === 'member') return true;
  return false;
}

/**
 * 检查用户是否能编辑某条记录
 * - admin: 任意编辑
 * - member: 只能编辑 owner_user_id == 自己 的记录
 * - guest: 不能
 */
function canEditRecord(user, record) {
  if (user.role === 'admin') return true;
  if (user.role !== 'member') return false;
  return record.owner_user_id === user.id;
}

async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearSession() {
  cookies().delete(COOKIE_NAME);
}

async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return { id: null, username: null, display_name: 'Guest', role: 'guest', person_id: null };
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const db = getDb();
    const user = db.prepare(
      'SELECT id, username, display_name, display_name_en, role, person_id FROM users WHERE id = ?'
    ).get(payload.uid);
    if (!user) return { id: null, username: null, display_name: 'Guest', role: 'guest', person_id: null };
    return user;
  } catch {
    return { id: null, username: null, display_name: 'Guest', role: 'guest', person_id: null };
  }
}

async function login(username, password) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return { ok: false, error: '账号或密码错误' };
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return { ok: false, error: '账号或密码错误' };
  await createSession(user.id);
  return { ok: true, user: { id: user.id, username: user.username, role: user.role } };
}

function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

module.exports = {
  canAccess,
  visibilityForRole,
  canSeeRecord,
  canEditRecord,
  createSession,
  clearSession,
  getCurrentUser,
  login,
  hashPassword,
  ROLE_LEVEL,
};
