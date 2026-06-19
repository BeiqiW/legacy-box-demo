import { getCurrentUser, visibilityForRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getLocale, pick, loc } from '@/lib/server-i18n';
import Link from 'next/link';
import PageEnter from '@/components/PageEnter';

export default async function TimelinePage() {
  const user = await getCurrentUser();
  const vis = visibilityForRole(user.role);
  const db = getDb();
  const locale = getLocale();

  const events = db.prepare(`
    SELECT te.*, p.name AS person_name, p.name_en AS person_name_en, u.display_name AS owner_name
    FROM timeline_events te
    LEFT JOIN people p ON p.id = te.person_id
    LEFT JOIN users u ON u.id = te.owner_user_id
    WHERE te.visibility IN (${vis.map(() => '?').join(',')})
      AND (te.owner_user_id IS NULL OR (te.published_to_main = 1 AND te.approval_status = 'approved'))
    ORDER BY te.year ASC, te.month ASC, te.day ASC
  `).all(...vis);

  const totalEvents = db.prepare('SELECT COUNT(*) c FROM timeline_events').get().c;
  const hiddenCount = totalEvents - events.length;

  return (
    <PageEnter>
      <div className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-20">
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">{pick(locale, 'Chronology · 编年', 'Chronology')}</div>
          <h1 className="font-display-cn text-5xl md:text-6xl mt-4">{pick(locale, '家族时间线', 'Family Timeline')}</h1>
          <div className="gold-line w-24 mx-auto mt-6"></div>
          <p className="text-sm text-muted mt-8 max-w-2xl mx-auto leading-relaxed">
            {pick(
              locale,
              <>
                以年表方式串联起家族四代的关键事件。每一项均标注证据状态——
                <br className="hidden md:block" />
                这是 Legacy Labs 的核心档案纪律。
              </>,
              <>
                A chronology threading together the key events of four generations. Every entry is tagged with its evidence status —
                <br className="hidden md:block" />
                the core archival discipline of Legacy Labs.
              </>
            )}
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-[11px] flex-wrap">
            <span className="evidence-verified">{pick(locale, '● 已核实', '● Verified')}</span>
            <span className="evidence-attributed">{pick(locale, '◆ 有出处的口述', '◆ Attributed')}</span>
            <span className="evidence-inferred">{pick(locale, '◇ 推断', '◇ Inferred')}</span>
            <span className="evidence-unresolved">{pick(locale, '? 待解决', '? Unresolved')}</span>
          </div>
        </div>

        {hiddenCount > 0 && (
          <div className="border border-sepia/20 bg-sepia/5 px-6 py-4 mb-12 text-xs text-sepia text-center reveal">
            <span className="text-base">⚿</span>&nbsp;&nbsp;
            {pick(
              locale,
              <>您当前权限下有 <span className="font-display-cn text-base">{hiddenCount}</span> 条事件不可见</>,
              <><span className="font-display-cn text-base">{hiddenCount}</span> {hiddenCount === 1 ? 'event is' : 'events are'} hidden at your current access level</>
            )}
            {user.role === 'guest' && (
              <Link href="/login" className="ml-3 underline underline-offset-4">
                {pick(locale, '登录 →', 'Login →')}
              </Link>
            )}
          </div>
        )}

        <div className="relative">
          {/* Central line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px timeline-line"></div>

          {events.map((e, i) => (
            <div
              key={e.id}
              className={`relative mb-16 md:flex reveal ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              <div className="md:w-1/2 md:pr-16 md:pl-0 pl-20">
                <article
                  className={`bg-parchment/70 backdrop-blur-sm border border-gold/20 p-8 card-premium ${
                    i % 2 === 0 ? 'md:text-right' : 'md:text-left'
                  }`}
                >
                  <div className="flex items-baseline gap-3 mb-3 flex-wrap"
                       style={{ justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                    <span className="font-display text-4xl text-gold-gradient">{e.year}</span>
                    {(e.month || e.day) && (
                      <span className="text-xs text-muted tracking-widest">
                        {e.month && String(e.month).padStart(2, '0')}
                        {e.day && '.' + String(e.day).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display-cn text-xl mb-3">{loc(e, 'title', locale)}</h3>
                  {e.description && (
                    <p className="text-sm text-ink-soft leading-relaxed">{loc(e, 'description', locale)}</p>
                  )}
                  <div className={`mt-4 pt-4 border-t border-gold/15 flex items-center gap-3 text-[11px] flex-wrap ${
                    i % 2 === 0 ? 'md:justify-end' : 'md:justify-start'
                  }`}>
                    <span className={`evidence-${e.evidence_status} tracking-wider uppercase`}>
                      {evidenceLabel(e.evidence_status)}
                    </span>
                    {e.person_name && <span className="text-muted">· {loc(e, 'person_name', locale)}</span>}
                    {e.visibility !== 'public' && (
                      <span className="text-sepia">· 🔒 {visLabel(e.visibility, locale)}</span>
                    )}
                  </div>
                </article>
              </div>

              {/* Center dot */}
              <div className="timeline-dot absolute left-8 md:left-1/2 top-6 -translate-x-1/2 w-3 h-3 rounded-full bg-gold-bright border-2 border-parchment shadow-[0_0_12px_rgba(184,150,91,0.6)]"></div>

              <div className="hidden md:block md:w-1/2"></div>
            </div>
          ))}
        </div>

        {/* End ornament */}
        <div className="text-center mt-16 reveal">
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-16 bg-gold/30"></div>
            <span className="text-gold text-xl">◈</span>
            <div className="h-px w-16 bg-gold/30"></div>
          </div>
          <div className="text-[10px] tracking-[0.5em] uppercase text-muted mt-4">
            End of Chronology
          </div>
        </div>
      </div>
    </PageEnter>
  );
}

function evidenceLabel(s) {
  return {
    verified: '● Verified',
    attributed: '◆ Attributed',
    inferred: '◇ Inferred',
    unresolved: '? Unresolved',
  }[s] || s;
}
function visLabel(v, locale) {
  return {
    public: pick(locale, '公开', 'Public'),
    member: pick(locale, '仅家族成员', 'Member only'),
    admin: pick(locale, '仅管理员', 'Admin only'),
  }[v];
}
