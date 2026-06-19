// Client-safe i18n helpers (NO next/headers import here — this module is
// imported by client components too). Server-only getLocale lives in lib/server-i18n.js.

// Pick a static UI string by locale: pick(locale, '中文', 'English')
export function pick(locale, zh, en) {
  return locale === 'en' ? en : zh;
}

// Pick a DB field by locale, falling back to the base (Chinese) when the
// English column is empty: loc(row, 'bio_public', locale) -> row.bio_public_en || row.bio_public
export function loc(row, field, locale) {
  if (!row) return '';
  if (locale === 'en') {
    const en = row[field + '_en'];
    if (en != null && String(en).trim() !== '') return en;
  }
  return row[field];
}

// Shared chrome strings (nav, footer, roles, common buttons).
export const COMMON = {
  brand:        { zh: '陈氏家族传承',  en: 'The Chen Family Legacy' },
  brandSub:     { zh: 'The Chen Family Legacy · Est. 1898', en: 'The Chen Family Legacy · Est. 1898' },
  nav_home:     { zh: '首页',       en: 'Home' },
  nav_timeline: { zh: '家族时间线', en: 'Timeline' },
  nav_tree:     { zh: '世系图',     en: 'Family Tree' },
  nav_people:   { zh: '人物志',     en: 'People' },
  nav_archive:  { zh: '档案馆',     en: 'Archive' },
  nav_oral:     { zh: '口述历史',   en: 'Oral History' },
  nav_my:       { zh: '我的卷宗',   en: 'My Records' },
  nav_admin:    { zh: '管理后台',   en: 'Admin' },
  login:        { zh: '登录',       en: 'Login' },
  logout:       { zh: '登出',       en: 'Logout' },
  role_admin:   { zh: '档案管理员', en: 'Administrator' },
  role_member:  { zh: '家族成员',   en: 'Family Member' },
  role_guest:   { zh: '访客',       en: 'Guest' },
  foot_tagline: { zh: '守护人类传承 · 以 AI、叙事与技术', en: 'Preserving Human Legacy · Through AI, Storytelling and Technology' },
  foot_sov_h:   { zh: '数据主权',   en: 'Data Sovereignty' },
  foot_sov_p:   { zh: '本站完整运行于客户本地设备，所有数据存储于客户掌控范围内', en: 'Runs entirely on the client’s own device — all data stays within the family’s control' },
  foot_demo_h:  { zh: '演示',       en: 'Demonstration' },
  foot_demo_p:  { zh: '陈氏家族档案 · 演示站', en: 'The Chen Family Archive · Demo' },
  foot_private: { zh: '一座私人档案馆', en: 'A Private Archive' },
};

export function c(locale, key) {
  const e = COMMON[key];
  return e ? (locale === 'en' ? e.en : e.zh) : key;
}
