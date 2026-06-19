import { getCurrentUser, visibilityForRole, canAccess, canSeeRecord } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageEnter from '@/components/PageEnter';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function PersonDetail({ params }) {
  const id = parseInt(params.id, 10);
  if (!id) notFound();

  const user = await getCurrentUser();
  const vis = visibilityForRole(user.role);
  const db = getDb();
  const locale = getLocale();

  const p = db.prepare(
    `SELECT * FROM people WHERE id = ? AND visibility IN (${vis.map(() => '?').join(',')})`
  ).get(id, ...vis);

  if (!p) {
    return (
      <PageEnter>
        <div className="max-w-2xl mx-auto px-8 py-32 text-center">
          <div className="text-6xl text-sepia/30 mb-6">⚿</div>
          <h1 className="font-display-cn text-3xl">{pick(locale, '人物档案不可见', 'Profile not visible')}</h1>
          <div className="gold-line w-16 mx-auto my-6"></div>
          <p className="text-sm text-muted leading-relaxed">
            {pick(locale, '此位家族成员的档案当前对您不可见。', "This family member's profile is not visible to you right now.")}
            <br />{pick(locale, '如您是家族成员，请登录后查看。', 'If you are a family member, please sign in to view it.')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login" className="btn-primary text-xs">{pick(locale, '登录家族账号 →', 'Sign in to family account →')}</Link>
            <Link href="/people" className="text-xs tracking-widest uppercase text-muted hover:text-ink transition">{pick(locale, '← 返回人物志', '← Back to profiles')}</Link>
          </div>
        </div>
      </PageEnter>
    );
  }

  // 加载该人物的所有相关内容
  const userId = user.id || -1;

  const timeline = filterByAccess(db.prepare(
    `SELECT t.*, u.display_name AS owner_name FROM timeline_events t
     LEFT JOIN users u ON u.id = t.owner_user_id
     WHERE t.person_id = ?
       AND (t.owner_user_id IS NULL OR t.owner_user_id = ? OR (t.published_to_main = 1 AND t.approval_status = 'approved'))
     ORDER BY year ASC, month ASC, day ASC`
  ).all(p.id, userId), user);

  const archive = filterByAccess(db.prepare(
    `SELECT a.*, u.display_name AS owner_name FROM archive_items a
     LEFT JOIN users u ON u.id = a.owner_user_id
     WHERE a.person_id = ? AND (a.owner_user_id IS NULL OR a.owner_user_id = ? OR a.published_to_main = 1)
     ORDER BY CASE WHEN date_taken IS NULL THEN 1 ELSE 0 END, date_taken DESC`
  ).all(p.id, userId), user);

  const oral = filterByAccess(db.prepare(
    `SELECT o.*, u.display_name AS owner_name FROM oral_histories o
     LEFT JOIN users u ON u.id = o.owner_user_id
     WHERE o.person_id = ? AND (o.owner_user_id IS NULL OR o.owner_user_id = ? OR o.published_to_main = 1)
     ORDER BY id DESC`
  ).all(p.id, userId), user);

  const personal = filterByAccess(db.prepare(
    `SELECT p.*, u.display_name AS owner_name FROM personal_entries p
     LEFT JOIN users u ON u.id = p.owner_user_id
     WHERE p.person_id = ? AND (p.owner_user_id IS NULL OR p.owner_user_id = ? OR p.published_to_main = 1)
     ORDER BY CASE WHEN year IS NULL THEN 1 ELSE 0 END, year DESC, id DESC`
  ).all(p.id, userId), user);

  const total = timeline.length + archive.length + oral.length + personal.length;

  return (
    <PageEnter>
      <div className="max-w-5xl mx-auto px-8 py-16">
        {/* 顶部面包屑 */}
        <div className="mb-12 flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase text-muted">
          <Link href="/people" className="hover:text-gold-deep transition">{pick(locale, '人物志', 'Profiles')}</Link>
          <span>/</span>
          <span className="text-gold-deep">{loc(p, 'name', locale)}</span>
        </div>

        {/* 顶部档案卡 */}
        <header className="grid md:grid-cols-[260px_1fr] gap-10 mb-16 reveal">
          {/* 照片 */}
          <div>
            <div className="archive-frame aspect-[3/4] w-full">
              {p.photo_url ? (
                <img src={p.photo_url} alt={loc(p, 'name', locale)} className="w-full h-full object-cover" />
              ) : (
                <div className="bg-gradient-to-br from-sepia/20 via-gold/10 to-sepia/30 w-full h-full flex items-center justify-center">
                  <span className="text-7xl font-display-cn text-sepia">{loc(p, 'name', locale)[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* 介绍 */}
          <div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">{loc(p, 'role_in_family', locale) || pick(locale, '家族成员', 'Family member')}</div>
            <h1 className="font-display-cn text-5xl mt-2">{loc(p, 'name', locale)}</h1>
            <div className="font-display text-base text-muted italic mt-2 tracking-wider">
              {p.birth_year || '?'}{p.death_year ? ` – ${p.death_year}` : ' – Present'}
              {p.birth_place && <span className="ml-3 not-italic text-xs">· {p.birth_place}</span>}
            </div>

            <div className="gold-line w-16 my-6"></div>

            {p.bio_public ? (
              <p className="text-[15px] leading-loose text-ink-soft whitespace-pre-wrap">{loc(p, 'bio_public', locale)}</p>
            ) : (
              <p className="text-sm text-muted italic">{pick(locale, '官方传记尚在整理中。', 'The official biography is still being compiled.')}</p>
            )}

            {p.bio_private && canAccess(user.role, 'member') && (
              <div className="mt-6 border-l-2 border-sepia/40 pl-5 bg-sepia/5 py-4 pr-4">
                <div className="text-[10px] tracking-[0.3em] uppercase text-sepia mb-2 flex items-center gap-2">
                  <span>🔒</span> Family Members Only
                </div>
                <p className="text-sm text-ink-soft leading-relaxed italic whitespace-pre-wrap">{loc(p, 'bio_private', locale)}</p>
              </div>
            )}

            {p.bio_private && !canAccess(user.role, 'member') && (
              <div className="mt-6 border border-dashed border-muted/30 px-5 py-4 bg-muted/5">
                <div className="text-xs text-muted italic flex items-center gap-3">
                  <span className="text-base">🔒</span>
                  <span>
                    {pick(locale, '此人物档案还包含家族内部内容', 'This profile also contains family-only content')}
                    <Link href="/login" className="ml-2 text-sepia hover:text-gold-deep underline underline-offset-4 not-italic">
                      {pick(locale, '登录家族账号 →', 'Sign in to family account →')}
                    </Link>
                  </span>
                </div>
              </div>
            )}

            {/* 锚点导航 */}
            {total > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 text-[10px] tracking-widest uppercase">
                {timeline.length > 0 && <AnchorPill href="#timeline" label={`${pick(locale, '生平时刻', 'Timeline')} · ${timeline.length}`} />}
                {personal.length > 0 && <AnchorPill href="#personal" label={`${pick(locale, '家族记述', 'Family notes')} · ${personal.length}`} />}
                {archive.length > 0 && <AnchorPill href="#archive" label={`${pick(locale, '档案', 'Archive')} · ${archive.length}`} />}
                {oral.length > 0 && <AnchorPill href="#oral" label={`${pick(locale, '口述', 'Oral')} · ${oral.length}`} />}
              </div>
            )}
          </div>
        </header>

        {/* 生平时刻 */}
        {timeline.length > 0 && (
          <Section id="timeline" no="01" title={pick(locale, '生平时刻', 'Timeline')} en="Timeline">
            <div className="relative pl-6 border-l border-gold/30 space-y-6">
              {timeline.map((e) => (
                <div key={e.id} className="relative">
                  <div className="absolute -left-[27px] top-2 w-2.5 h-2.5 rounded-full bg-gold border-2 border-parchment"></div>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="font-mono text-lg text-gold-deep tabular-nums">
                      {e.year}{e.month ? `.${String(e.month).padStart(2, '0')}` : ''}{e.day ? `.${String(e.day).padStart(2, '0')}` : ''}
                    </span>
                    <h3 className="font-display-cn text-lg flex-1">{loc(e, 'title', locale)}</h3>
                    {e.owner_name && (
                      <span className="text-[10px] tracking-widest text-muted italic">— {e.owner_name}</span>
                    )}
                    <EvidenceTag s={e.evidence_status} locale={locale} />
                  </div>
                  {e.description && (
                    <p className="text-sm text-ink-soft leading-loose mt-2 whitespace-pre-wrap">{loc(e, 'description', locale)}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 家族成员记述 */}
        {personal.length > 0 && (
          <Section id="personal" no="02" title={pick(locale, '家族成员的记述', 'Family Members’ Notes')} en="Personal Entries">
            <div className="grid md:grid-cols-2 gap-6">
              {personal.map((entry) => (
                <article key={entry.id} className="border border-gold/15 bg-parchment/60 p-5 card-premium">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="font-display-cn text-base flex-1">{entry.title}</h3>
                    <VisBadge v={entry.visibility} locale={locale} />
                  </div>
                  {entry.year && (
                    <div className="font-mono text-xs text-gold-deep tabular-nums mb-2">
                      {entry.year}{entry.month ? `.${String(entry.month).padStart(2, '0')}` : ''}
                    </div>
                  )}
                  {entry.body && (
                    <p className="text-sm text-ink-soft leading-loose whitespace-pre-wrap line-clamp-6">{entry.body}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gold/10 text-[10px] tracking-widest uppercase text-muted">
                    {pick(locale, `— ${entry.owner_name || '匿名'} 贡献`, `— Contributed by ${entry.owner_name || 'Anonymous'}`)}
                  </div>
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* 档案 */}
        {archive.length > 0 && (
          <Section id="archive" no="03" title={pick(locale, '相关档案', 'Related Archive')} en="Archive">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {archive.map((a) => (
                <div key={a.id} className="group">
                  <div className="archive-frame aspect-square mb-2">
                    {a.thumb_url || a.file_url ? (
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(a.thumb_url || a.file_url || '') ? (
                        <img src={a.thumb_url || a.file_url} alt={loc(a, 'title', locale)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="bg-gold/10 w-full h-full flex flex-col items-center justify-center text-xs text-muted p-2 text-center">
                          <div className="text-3xl mb-2 opacity-50">{kindIcon(a.kind)}</div>
                          <div className="line-clamp-2 leading-tight">{loc(a, 'title', locale)}</div>
                        </div>
                      )
                    ) : (
                      <div className="bg-gold/10 w-full h-full flex flex-col items-center justify-center text-xs text-muted p-2 text-center">
                        <div className="text-3xl mb-2 opacity-50">{kindIcon(a.kind)}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-display-cn line-clamp-2 mt-2">{loc(a, 'title', locale)}</div>
                  {a.date_taken && (
                    <div className="text-[10px] text-muted font-mono mt-1">{a.date_taken}</div>
                  )}
                  {a.owner_name && (
                    <div className="text-[10px] text-muted italic mt-1">— {a.owner_name}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 口述 */}
        {oral.length > 0 && (
          <Section id="oral" no="04" title={pick(locale, '口述记忆', 'Oral Memories')} en="Oral History">
            <div className="space-y-5">
              {oral.map((o) => (
                <article key={o.id} className="border-l-2 border-gold/40 pl-5 py-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-gold-deep">🎙</span>
                    <h3 className="font-display-cn text-base">{loc(o, 'title', locale)}</h3>
                    {o.speaker && <span className="text-xs text-muted">— {loc(o, 'speaker', locale)}</span>}
                    {o.recorded_at && <span className="text-[10px] font-mono text-muted">{o.recorded_at}</span>}
                  </div>
                  {o.transcript_excerpt && (
                    <blockquote className="text-sm text-ink-soft italic mt-3 leading-loose line-clamp-4">
                      "{o.transcript_excerpt}"
                    </blockquote>
                  )}
                  {o.owner_name && (
                    <div className="text-[10px] tracking-widest uppercase text-muted mt-2">{pick(locale, `— ${o.owner_name} 贡献`, `— Contributed by ${o.owner_name}`)}</div>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        {total === 0 && (
          <div className="border border-gold/20 bg-parchment/40 p-16 text-center text-muted">
            <div className="text-4xl text-gold/30 mb-4">◈</div>
            <div className="font-display-cn text-lg mb-2">{pick(locale, '尚无附加档案', 'No additional records yet')}</div>
            <div className="text-sm">{pick(locale, '这位家族成员的生平时刻、档案、口述等内容仍在补充中', "This family member's timeline, archive, and oral history are still being added")}</div>
          </div>
        )}

        {/* 返回 */}
        <div className="mt-20 pt-8 border-t border-gold/15 text-center">
          <Link href="/people" className="text-xs tracking-[0.4em] uppercase text-muted hover:text-gold-deep transition">
            {pick(locale, '← 返回人物志', '← Back to profiles')}
          </Link>
        </div>
      </div>
    </PageEnter>
  );
}

function filterByAccess(rows, user) {
  return rows.filter((r) => canSeeRecord(user, r));
}

function Section({ id, no, title, en, children }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24 reveal">
      <div className="flex items-baseline gap-4 mb-6">
        <span className="font-display text-3xl text-gold-gradient tabular-nums">{no}</span>
        <h2 className="font-display-cn text-2xl">{title}</h2>
        <span className="text-[10px] tracking-[0.4em] uppercase text-gold-deep">{en}</span>
        <div className="gold-line flex-1"></div>
      </div>
      {children}
    </section>
  );
}

function AnchorPill({ href, label }) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 border border-gold/30 text-gold-deep hover:bg-gold/10 transition"
    >
      {label}
    </a>
  );
}

function EvidenceTag({ s, locale }) {
  const map = {
    verified: { label: pick(locale, '已核实', 'Verified'), c: 'text-vintage-green' },
    attributed: { label: pick(locale, '口述', 'Attributed'), c: 'text-sepia' },
    inferred: { label: pick(locale, '推断', 'Inferred'), c: 'text-muted' },
    unresolved: { label: pick(locale, '待解决', 'Unresolved'), c: 'text-vintage-red' },
  };
  const m = map[s];
  if (!m) return null;
  return <span className={`text-[9px] tracking-widest ${m.c}`}>● {m.label}</span>;
}

function VisBadge({ v, locale }) {
  const map = {
    private: { label: pick(locale, '仅自己', 'Private'), c: 'text-ink/50 border-ink/20' },
    member: { label: pick(locale, '家族', 'Family'), c: 'text-sepia border-sepia/30' },
    public: { label: pick(locale, '公开', 'Public'), c: 'text-vintage-green border-vintage-green/30' },
    admin: { label: pick(locale, '管理员', 'Admin'), c: 'text-vintage-red border-vintage-red/30' },
  };
  const m = map[v] || map.public;
  return <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${m.c}`}>{m.label}</span>;
}

function kindIcon(k) {
  return { photo: '📷', document: '📄', audio: '🎵', video: '🎬', artifact: '🏺' }[k] || '◈';
}
