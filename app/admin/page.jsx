import { getCurrentUser, canAccess } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import PageEnter from '@/components/PageEnter';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export default async function AdminPage() {
  const locale = getLocale();
  const user = await getCurrentUser();
  if (!canAccess(user.role, 'admin')) {
    return (
      <PageEnter>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6 opacity-40">⚿</div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-vintage-red mb-3">Restricted</div>
            <h1 className="font-display-cn text-4xl mb-4">{pick(locale, '访问受限', 'Access Restricted')}</h1>
            <div className="gold-line w-16 mx-auto mb-6"></div>
            <p className="text-muted mb-8 leading-relaxed">
              {pick(locale, '管理后台仅限管理员访问。', 'The admin console is restricted to administrators.')}
              {user.role === 'guest'
                ? pick(locale, '请登录管理员账号。', ' Please sign in with an administrator account.')
                : pick(locale, '您当前以「' + roleLabel(user.role, locale) + '」身份访问。', ' You are currently signed in as “' + roleLabel(user.role, locale) + '”.')}
            </p>
            <Link href="/login" className="btn-primary">
              {pick(locale, '切换账号 →', 'Switch Account →')}
            </Link>
          </div>
        </div>
      </PageEnter>
    );
  }

  const db = getDb();
  const counts = {
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    people: db.prepare('SELECT COUNT(*) c FROM people').get().c,
    events: db.prepare('SELECT COUNT(*) c FROM timeline_events').get().c,
    archive: db.prepare('SELECT COUNT(*) c FROM archive_items').get().c,
    oral: db.prepare('SELECT COUNT(*) c FROM oral_histories').get().c,
    pendingReview: db.prepare("SELECT COUNT(*) c FROM timeline_events WHERE approval_status = 'pending'").get().c,
  };

  const users = db.prepare('SELECT id, username, display_name, display_name_en, role, created_at FROM users ORDER BY id').all();
  const visBreakdown = {
    people: groupBy(db.prepare('SELECT visibility, COUNT(*) c FROM people GROUP BY visibility').all()),
    events: groupBy(db.prepare('SELECT visibility, COUNT(*) c FROM timeline_events GROUP BY visibility').all()),
    archive: groupBy(db.prepare('SELECT visibility, COUNT(*) c FROM archive_items GROUP BY visibility').all()),
    oral: groupBy(db.prepare('SELECT visibility, COUNT(*) c FROM oral_histories GROUP BY visibility').all()),
  };

  return (
    <PageEnter>
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-12 flex items-end justify-between border-b border-gold/20 pb-6">
          <div>
            <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Admin Console</div>
            <h1 className="font-display-cn text-4xl mt-2">{pick(locale, '管理后台', 'Admin Console')}</h1>
          </div>
          <div className="text-[10px] text-muted text-right tracking-widest uppercase">
            {pick(locale, '欢迎，', 'Welcome,')}<br />
            <span className="font-display-cn text-base text-sepia normal-case">{loc(user, 'display_name', locale)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-gold/20 mb-12 reveal">
          <Stat label="Users" cn={pick(locale, '用户', 'Users')} v={counts.users} />
          <Stat label="People" cn={pick(locale, '人物', 'People')} v={counts.people} />
          <Stat label="Events" cn={pick(locale, '事件', 'Events')} v={counts.events} />
          <Stat label="Archive" cn={pick(locale, '档案', 'Archive')} v={counts.archive} />
          <Stat label="Oral" cn={pick(locale, '口述', 'Oral')} v={counts.oral} />
        </div>

        {counts.pendingReview > 0 && (
          <div className="reveal mb-12">
            <Link href="/admin/review" className="block border border-sepia/40 bg-sepia/5 p-5 hover:bg-sepia/10 transition group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-sepia">◐</span>
                  <div>
                    <div className="text-[10px] tracking-[0.5em] uppercase text-sepia">Pending Review</div>
                    <div className="font-display-cn text-lg mt-1">
                      {pick(locale, '有 ', '')}<span className="text-sepia text-2xl font-display">{counts.pendingReview}</span>{pick(locale, ' 条家族成员提交的时间线事件待审核', ' timeline event(s) submitted by family members awaiting review')}
                    </div>
                  </div>
                </div>
                <span className="text-sepia group-hover:translate-x-1 transition">{pick(locale, '进入审核 →', 'Go to Review →')}</span>
              </div>
            </Link>
          </div>
        )}

        <section className="mb-16 reveal">
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-display text-3xl text-gold-gradient">01</span>
            <h2 className="font-display-cn text-2xl">{pick(locale, '用户列表', 'User List')}</h2>
            <div className="gold-line flex-1"></div>
          </div>
          <div className="border border-gold/20 bg-parchment/60 backdrop-blur-sm overflow-x-auto card-premium">
            <table className="w-full text-sm">
              <thead className="bg-gold/10 text-left">
                <tr>
                  <th className="p-4 text-[10px] tracking-widest uppercase text-gold-deep">ID</th>
                  <th className="p-4 text-[10px] tracking-widest uppercase text-gold-deep">Account</th>
                  <th className="p-4 text-[10px] tracking-widest uppercase text-gold-deep">Display Name</th>
                  <th className="p-4 text-[10px] tracking-widest uppercase text-gold-deep">Role</th>
                  <th className="p-4 text-[10px] tracking-widest uppercase text-gold-deep">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gold/10 hover:bg-gold/5 transition">
                    <td className="p-4 font-mono text-muted">{u.id}</td>
                    <td className="p-4 font-mono">{u.username}</td>
                    <td className="p-4 font-display-cn">{loc(u, 'display_name', locale)}</td>
                    <td className="p-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="p-4 text-muted text-[11px]">{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-16 reveal">
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-display text-3xl text-gold-gradient">02</span>
            <h2 className="font-display-cn text-2xl">{pick(locale, '权限分布', 'Visibility Breakdown')}</h2>
            <div className="gold-line flex-1"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <VisBreakdown title={pick(locale, '人物档案', 'People')} en="People" data={visBreakdown.people} locale={locale} />
            <VisBreakdown title={pick(locale, '时间线事件', 'Timeline Events')} en="Timeline" data={visBreakdown.events} locale={locale} />
            <VisBreakdown title={pick(locale, '档案资料', 'Archive')} en="Archive" data={visBreakdown.archive} locale={locale} />
            <VisBreakdown title={pick(locale, '口述历史', 'Oral History')} en="Oral History" data={visBreakdown.oral} locale={locale} />
          </div>
        </section>

        <section className="reveal">
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-display text-3xl text-gold-gradient">03</span>
            <h2 className="font-display-cn text-2xl">{pick(locale, '内容管理', 'Content Management')}</h2>
            <div className="gold-line flex-1"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <AdminLink num="①" title={pick(locale, '人物档案', 'People')} en="People" desc={pick(locale, `${counts.people} 位家族成员 · 编辑 / 新增 / 删除`, `${counts.people} family members · Edit / Add / Delete`)} href="/admin/people" />
            <AdminLink num="②" title={pick(locale, '时间线事件', 'Timeline')} en="Timeline" desc={pick(locale, `${counts.events} 条事件 · 编年与证据状态管理`, `${counts.events} events · Chronology & evidence status`)} href="/admin/timeline" />
            <AdminLink num="③" title={pick(locale, '档案资料', 'Archive')} en="Archive" desc={pick(locale, `${counts.archive} 件物证 · 上传 / 描述 / 分类`, `${counts.archive} items · Upload / Describe / Categorize`)} href="/admin/archive" />
            <AdminLink num="④" title={pick(locale, '口述历史', 'Oral History')} en="Oral History" desc={pick(locale, `${counts.oral} 段访谈 · 转录与音频管理`, `${counts.oral} interviews · Transcripts & audio`)} href="/admin/oral-history" />
            <AdminLink num="⑤" title={pick(locale, '账号与权限', 'Users & Roles')} en="Users" desc={pick(locale, `${counts.users} 个账号 · 访问级别分配`, `${counts.users} accounts · Access level assignment`)} href="/admin/users" />
            <AdminLink num="⑥" title={pick(locale, '返回站点', 'Back to Site')} en="Back" desc={pick(locale, '返回公开站点预览内容', 'Return to the public site to preview content')} href="/" />
          </div>
        </section>
      </div>
    </PageEnter>
  );
}

function Stat({ label, cn, v }) {
  return (
    <div className="bg-parchment p-8 text-center hover:bg-parchment-dark/30 transition group">
      <div className="text-[10px] tracking-[0.4em] uppercase text-gold-deep">{label}</div>
      <div className="text-5xl font-display text-ink mt-3 group-hover:text-sepia transition-colors">
        {String(v).padStart(2, '0')}
      </div>
      <div className="gold-line w-6 mx-auto my-2 opacity-50"></div>
      <div className="text-xs font-display-cn text-muted">{cn}</div>
    </div>
  );
}

function VisBreakdown({ title, en, data, locale }) {
  const total = (data.public || 0) + (data.member || 0) + (data.admin || 0);
  return (
    <div className="border border-gold/20 bg-parchment/60 backdrop-blur-sm p-6 card-premium">
      <div className="flex items-baseline justify-between mb-5">
        <span className="font-display-cn text-lg">{title}</span>
        <span className="text-[10px] tracking-[0.3em] uppercase text-gold-deep">{en}</span>
      </div>
      <div className="space-y-3">
        <Bar label={pick(locale, '公开', 'Public')} en="Public" v={data.public || 0} total={total} color="bg-vintage-green" />
        <Bar label={pick(locale, '家族成员', 'Family')} en="Family" v={data.member || 0} total={total} color="bg-sepia" />
        <Bar label={pick(locale, '仅管理员', 'Admin')} en="Admin" v={data.admin || 0} total={total} color="bg-vintage-red" />
      </div>
    </div>
  );
}

function Bar({ label, en, v, total, color }) {
  const pct = total > 0 ? (v / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5 text-xs">
        <span className="flex items-baseline gap-2">
          <span className="font-display-cn">{label}</span>
          <span className="text-[10px] tracking-widest uppercase text-muted">{en}</span>
        </span>
        <span className="text-muted font-mono">{v} / {total}</span>
      </div>
      <div className="h-1.5 bg-parchment-dark/40 overflow-hidden">
        <div
          className={color + ' h-full transition-all duration-1000 ease-out'}
          style={{ width: pct + '%' }}
        ></div>
      </div>
    </div>
  );
}

function AdminLink({ num, title, en, desc, href }) {
  return (
    <Link href={href} className="border border-gold/20 bg-parchment/60 backdrop-blur-sm p-6 card-premium group block">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl text-gold-gradient">{num}</span>
        <span className="text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all">→</span>
      </div>
      <div className="font-display-cn text-lg">{title}</div>
      <div className="text-[10px] tracking-[0.3em] uppercase text-gold-deep mt-1 mb-2">{en}</div>
      <div className="text-xs text-muted leading-relaxed">{desc}</div>
    </Link>
  );
}

function ActionCard({ num, title, desc }) {
  return (
    <div className="border border-gold/20 bg-parchment/60 backdrop-blur-sm p-6 card-premium cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl text-gold-gradient">{num}</span>
        <span className="text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all">→</span>
      </div>
      <div className="font-display-cn text-lg mb-1">{title}</div>
      <div className="text-xs text-muted leading-relaxed">{desc}</div>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    admin: 'text-vintage-red border-vintage-red/30 bg-vintage-red/5',
    member: 'text-sepia border-sepia/30 bg-sepia/5',
    guest: 'text-muted border-muted/30 bg-muted/5',
  };
  const labels = { admin: 'Admin', member: 'Member', guest: 'Guest' };
  return (
    <span className={`text-[10px] tracking-widest uppercase px-3 py-1 border ${styles[role]}`}>
      {labels[role]}
    </span>
  );
}

function groupBy(rows) {
  const o = {};
  for (const r of rows) o[r.visibility] = r.c;
  return o;
}

function roleLabel(r, locale) {
  return locale === 'en'
    ? { admin: 'Administrator', member: 'Family Member', guest: 'Guest' }[r]
    : { admin: '管理员', member: '家族成员', guest: '访客' }[r];
}
