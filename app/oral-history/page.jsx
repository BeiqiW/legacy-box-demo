import { getCurrentUser, visibilityForRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import PageEnter from '@/components/PageEnter';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export default async function OralHistoryPage() {
  const user = await getCurrentUser();
  const vis = visibilityForRole(user.role);
  const db = getDb();

  const records = db.prepare(`
    SELECT * FROM oral_histories
    WHERE visibility IN (${vis.map(() => '?').join(',')})
      AND (owner_user_id IS NULL OR published_to_main = 1)
    ORDER BY recorded_date DESC
  `).all(...vis);

  const total = db.prepare('SELECT COUNT(*) c FROM oral_histories').get().c;
  const hidden = total - records.length;
  const locale = getLocale();

  return (
    <PageEnter>
      <div className="max-w-4xl mx-auto px-8 py-24">
        <div className="text-center mb-20">
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Oral History · {pick(locale, '口述', 'Oral')}</div>
          <h1 className="font-display-cn text-5xl md:text-6xl mt-4">{pick(locale, '口述历史', 'Oral History')}</h1>
          <div className="gold-line w-24 mx-auto mt-6"></div>
          <p className="text-sm text-muted mt-8 max-w-2xl mx-auto leading-relaxed">
            {pick(locale, '家族长辈的原声访谈与转录文本。', 'Recorded interviews with family elders, with full transcripts.')}
            <br className="hidden md:block" />
            {pick(locale, '记忆以语气、停顿、用词的方式被完整保留。', 'Their memories are preserved intact — in tone, in pauses, in their own words.')}
          </p>
        </div>

        {hidden > 0 && (
          <div className="text-xs text-center text-muted mb-12 reveal">
            <span className="text-sepia text-base">⚿</span>&nbsp;&nbsp;
            {pick(locale, `您当前权限下有 ${hidden} 段口述记录不可见`, `${hidden} oral histor${hidden === 1 ? 'y is' : 'ies are'} hidden at your current access level`)}
          </div>
        )}

        <div className="space-y-10">
          {records.map((r, i) => (
            <article
              key={r.id}
              className={`bg-parchment/70 backdrop-blur-sm border border-gold/20 card-premium reveal delay-${(i % 3) + 1}`}
            >
              <div className="p-10">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                  <div>
                    <h2 className="font-display-cn text-2xl mb-2">{loc(r, 'title', locale)}</h2>
                    <div className="text-xs text-muted tracking-wider flex items-center gap-2 flex-wrap">
                      <span>Speaker:</span>
                      <span className="text-sepia font-display-cn text-sm">{loc(r, 'speaker', locale)}</span>
                      {r.recorded_date && (
                        <>
                          <span className="text-gold">·</span>
                          <span>{r.recorded_date}</span>
                        </>
                      )}
                      {r.duration_minutes && (
                        <>
                          <span className="text-gold">·</span>
                          <span>{r.duration_minutes} min</span>
                        </>
                      )}
                    </div>
                  </div>
                  <VisibilityBadge v={r.visibility} />
                </div>

                <div className="quote-mark border-l-2 border-gold/40 pl-6 py-4 my-6 bg-gradient-to-r from-gold/5 to-transparent">
                  <p className="text-base italic leading-relaxed text-ink-soft font-display">
                    {loc(r, 'transcript', locale)}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 text-[11px]">
                  <button className="px-4 py-2 border border-gold/30 text-ink-soft hover:border-gold hover:text-gold-deep transition-all tracking-wider">
                    <span className="text-gold">▶</span>&nbsp; PLAY AUDIO
                  </button>
                  <button className="px-4 py-2 border border-gold/30 text-ink-soft hover:border-gold hover:text-gold-deep transition-all tracking-wider">
                    DOWNLOAD TRANSCRIPT
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {records.length === 0 && (
          <div className="text-center py-24 text-muted text-sm">
            <div className="text-5xl mb-4 opacity-30">◇</div>
            {pick(locale, '您当前权限下没有可查看的口述记录。', 'There are no oral histories available at your current access level.')}
            <div className="mt-6">
              <Link href="/login" className="text-sepia hover:text-gold-deep underline underline-offset-4">
                {pick(locale, '登录查看更多 →', 'Sign in to see more →')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageEnter>
  );
}

function VisibilityBadge({ v }) {
  if (v === 'public') return <span className="text-[10px] tracking-widest uppercase text-vintage-green">● Public</span>;
  if (v === 'member') return <span className="text-[10px] tracking-widest uppercase text-sepia">🔒 Family</span>;
  if (v === 'admin') return <span className="text-[10px] tracking-widest uppercase text-vintage-red">🔒🔒 Admin</span>;
}
