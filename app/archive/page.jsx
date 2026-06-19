import { getCurrentUser, visibilityForRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import PageEnter from '@/components/PageEnter';
import { getLocale, pick, loc } from '@/lib/server-i18n';

const KIND_META = {
  photo:    { icon: '📷', label: 'Photograph', cn: '照片', tint: 'from-amber-100 via-orange-100 to-amber-200' },
  document: { icon: '📜', label: 'Document',   cn: '文档', tint: 'from-stone-100 via-amber-50 to-stone-200' },
  audio:    { icon: '🎵', label: 'Audio',      cn: '录音', tint: 'from-rose-50 via-amber-50 to-rose-100' },
  video:    { icon: '🎞', label: 'Film',       cn: '影像', tint: 'from-stone-200 via-stone-100 to-stone-300' },
  artifact: { icon: '⚱', label: 'Artifact',   cn: '实物', tint: 'from-amber-50 via-stone-100 to-amber-100' },
};

export default async function ArchivePage() {
  const user = await getCurrentUser();
  const vis = visibilityForRole(user.role);
  const db = getDb();

  const items = db.prepare(`
    SELECT * FROM archive_items
    WHERE visibility IN (${vis.map(() => '?').join(',')})
      AND (owner_user_id IS NULL OR published_to_main = 1)
    ORDER BY CASE WHEN date_taken IS NULL THEN 1 ELSE 0 END, date_taken DESC, id DESC
  `).all(...vis);

  const totalItems = db.prepare('SELECT COUNT(*) c FROM archive_items').get().c;
  const hidden = totalItems - items.length;
  const locale = getLocale();

  return (
    <PageEnter>
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-20">
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Family Archive · {pick(locale, '档案馆', 'Archive')}</div>
          <h1 className="font-display-cn text-5xl md:text-6xl mt-4">{pick(locale, '档案馆', 'Archive')}</h1>
          <div className="gold-line w-24 mx-auto mt-6"></div>
          <p className="text-sm text-muted mt-8 max-w-2xl mx-auto leading-relaxed">
            {pick(locale, '家族物证：照片、信件、手稿、证件。', 'Family records: photographs, letters, manuscripts, and documents.')}
            <br className="hidden md:block" />
            {pick(locale, '每一件均标注来源、日期与访问权限。', 'Each item is labeled with its source, date, and access level.')}
          </p>
        </div>

        {hidden > 0 && (
          <div className="border border-sepia/20 bg-sepia/5 px-6 py-4 mb-12 text-xs text-sepia text-center reveal">
            <span className="text-base">⚿</span>&nbsp;&nbsp;
            {pick(locale, '您当前权限下有 ', 'There are ')}<span className="font-display-cn text-base">{hidden}</span>{pick(locale, ' 件档案不可见', ` archive item${hidden === 1 ? '' : 's'} hidden at your current access level`)}
            {user.role !== 'admin' && (
              <Link href="/login" className="ml-3 underline underline-offset-4">
                {user.role === 'guest' ? 'Login →' : 'Need admin →'}
              </Link>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => {
            const meta = KIND_META[item.kind] || KIND_META.photo;
            return (
              <article key={item.id} className={`reveal delay-${(i % 4) + 1}`}>
                <div className="card-premium border border-gold/20 bg-parchment/60 backdrop-blur-sm h-full flex flex-col">
                  <div className="archive-frame mx-4 mt-4">
                    <div className={`aspect-[4/3] bg-gradient-to-br ${meta.tint} flex items-center justify-center thumb-zoom relative`}>
                      <div className="text-7xl opacity-70 drop-shadow-sm">{meta.icon}</div>
                      <div className="absolute top-2 right-2 text-[9px] tracking-[0.3em] uppercase bg-parchment/80 text-ink-soft px-2 py-1">
                        {meta.label}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] text-muted mb-3 tracking-wider">
                      {item.date_taken && <span>{item.date_taken}</span>}
                      {item.date_taken && item.location && <span>·</span>}
                      {item.location && <span>{loc(item, 'location', locale)}</span>}
                    </div>
                    <h3 className="font-display-cn text-lg mb-3">{loc(item, 'title', locale)}</h3>
                    {item.description && (
                      <p className="text-sm text-ink-soft leading-relaxed flex-1">
                        {loc(item, 'description', locale)}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gold/15">
                      <VisibilityBadge v={item.visibility} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-24 text-muted text-sm">
            <div className="text-5xl mb-4 opacity-30">◇</div>
            {pick(locale, '您当前权限下没有可查看的档案。', 'There are no archive items available at your current access level.')}
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
