import { getCurrentUser, visibilityForRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import PageEnter from '@/components/PageEnter';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const user = await getCurrentUser();
  const vis = visibilityForRole(user.role);
  const db = getDb();

  const people = db.prepare(`
    SELECT * FROM people
    WHERE visibility IN (${vis.map(() => '?').join(',')})
    ORDER BY birth_year ASC
  `).all(...vis);

  const totalPeople = db.prepare('SELECT COUNT(*) c FROM people').get().c;
  const hidden = totalPeople - people.length;
  const locale = getLocale();

  // 每个人的简单统计（已发布 + 已审核）
  const stats = {};
  for (const p of people) {
    stats[p.id] = {
      timeline: db.prepare(
        `SELECT COUNT(*) c FROM timeline_events
         WHERE person_id = ? AND (owner_user_id IS NULL OR (published_to_main = 1 AND approval_status = 'approved'))`
      ).get(p.id).c,
      archive: db.prepare(
        `SELECT COUNT(*) c FROM archive_items
         WHERE person_id = ? AND (owner_user_id IS NULL OR published_to_main = 1)`
      ).get(p.id).c,
      oral: db.prepare(
        `SELECT COUNT(*) c FROM oral_histories
         WHERE person_id = ? AND (owner_user_id IS NULL OR published_to_main = 1)`
      ).get(p.id).c,
      personal: db.prepare(
        `SELECT COUNT(*) c FROM personal_entries
         WHERE person_id = ? AND (owner_user_id IS NULL OR published_to_main = 1)`
      ).get(p.id).c,
    };
  }

  return (
    <PageEnter>
      <div className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-20">
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Family Profiles · {pick(locale, '人物志', 'People')}</div>
          <h1 className="font-display-cn text-5xl md:text-6xl mt-4">{pick(locale, '人物志', 'Family Profiles')}</h1>
          <div className="gold-line w-24 mx-auto mt-6"></div>
          <p className="text-sm text-muted mt-8 max-w-xl mx-auto leading-relaxed">
            {pick(locale, '四代核心人物 · 点击人物卡片，进入完整档案', 'Four generations of key figures · Tap a card to open the full profile')}
          </p>
        </div>

        {hidden > 0 && (
          <div className="text-xs text-center text-muted mb-12 reveal">
            <span className="text-sepia text-base">⚿</span>&nbsp;&nbsp;
            {pick(locale, `您当前权限下有 ${hidden} 位人物档案不可见`, `${hidden} profile${hidden === 1 ? '' : 's'} are hidden at your current access level`)}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {people.map((p, i) => (
            <PersonCard key={p.id} person={p} index={i} stats={stats[p.id]} locale={locale} />
          ))}
        </div>

        <div className="mt-20 pt-8 border-t border-gold/15 text-center">
          <Link
            href="/family-tree"
            className="text-xs tracking-[0.4em] uppercase text-gold-deep hover:text-ink transition"
          >
            {pick(locale, '查阅家族世系图 →', 'View the family tree →')}
          </Link>
        </div>
      </div>
    </PageEnter>
  );
}

function PersonCard({ person: p, index: i, stats, locale }) {
  const total = stats.timeline + stats.archive + stats.oral + stats.personal;

  return (
    <Link
      href={`/people/${p.id}`}
      className="group block bg-parchment/70 backdrop-blur-sm border border-gold/20 card-premium reveal hover:border-gold/50 transition relative overflow-hidden"
    >
      {/* 装饰角 */}
      <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-gold/30 group-hover:border-gold transition"></div>
      <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-gold/30 group-hover:border-gold transition"></div>

      <div className="p-8 flex gap-6">
        {/* 头像 */}
        <div className="shrink-0">
          <div className="archive-frame w-28 h-36">
            {p.photo_url ? (
              <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="bg-gradient-to-br from-sepia/20 via-gold/10 to-sepia/30 w-full h-full flex items-center justify-center">
                <span className="text-4xl font-display-cn text-sepia">{loc(p, 'name', locale)[0]}</span>
              </div>
            )}
          </div>
          <div className="text-center mt-3 text-[9px] tracking-[0.4em] uppercase text-gold-deep">
            Gen {generationLabel(i)}
          </div>
        </div>

        {/* 简介 */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display-cn text-2xl group-hover:text-gold-deep transition">{loc(p, 'name', locale)}</h2>
          <div className="font-display text-xs text-muted italic mt-1 tracking-wider">
            {p.birth_year}{p.death_year ? ` – ${p.death_year}` : ' – Present'}
          </div>
          <div className="text-xs text-gold-deep tracking-wider mt-1">{loc(p, 'role_in_family', locale)}</div>

          <div className="gold-line w-12 my-3"></div>

          {p.bio_public && (
            <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">
              {loc(p, 'bio_public', locale)}
            </p>
          )}

          {/* 内容统计 */}
          <div className="mt-5 pt-4 border-t border-gold/15 flex items-center gap-4 text-[10px] tracking-widest uppercase">
            {stats.timeline > 0 && <StatItem icon="◈" v={stats.timeline} label={pick(locale, '时刻', 'Moments')} />}
            {stats.personal > 0 && <StatItem icon="✎" v={stats.personal} label={pick(locale, '记述', 'Notes')} />}
            {stats.archive > 0 && <StatItem icon="◇" v={stats.archive} label={pick(locale, '档案', 'Archive')} />}
            {stats.oral > 0 && <StatItem icon="🎙" v={stats.oral} label={pick(locale, '口述', 'Oral')} />}
            {total === 0 && <span className="text-muted italic">{pick(locale, '暂无附加档案', 'No additional records yet')}</span>}
          </div>
        </div>
      </div>

      {/* 底部 hover 提示 */}
      <div className="px-8 py-3 border-t border-gold/15 bg-gold/5 text-[10px] tracking-[0.4em] uppercase text-gold-deep flex items-center justify-between">
        <span>{pick(locale, '查阅完整档案', 'View full profile')}</span>
        <span className="group-hover:translate-x-1 transition">→</span>
      </div>
    </Link>
  );
}

function StatItem({ icon, v, label }) {
  return (
    <span className="text-muted">
      <span className="text-gold-deep mr-1">{icon}</span>
      <span className="font-display text-base text-ink-soft mr-1">{v}</span>
      <span>{label}</span>
    </span>
  );
}

function generationLabel(i) {
  return ['I', 'II', 'III', 'IV', 'V'][i] || (i + 1);
}
