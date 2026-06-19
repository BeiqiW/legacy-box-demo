import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import PageEnter from '@/components/PageEnter';
import Link from 'next/link';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function MyHome() {
  const locale = getLocale();
  const user = await getCurrentUser();

  if (user.role === 'guest') {
    return (
      <PageEnter>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6 opacity-40">⚿</div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-vintage-red mb-3">Members Only</div>
            <h1 className="font-display-cn text-4xl mb-4">{pick(locale, '我的卷宗', 'My Records')}</h1>
            <div className="gold-line w-16 mx-auto mb-6"></div>
            <p className="text-muted mb-8 leading-relaxed">
              {pick(locale, '个人卷宗仅家族成员可用。请登录家族账号。', 'Personal records are available to family members only. Please log in with your family account.')}
            </p>
            <Link href="/login" className="btn-primary">{pick(locale, '登录 →', 'Login →')}</Link>
          </div>
        </div>
      </PageEnter>
    );
  }

  const db = getDb();

  // 我关联的家族成员
  const me = user.person_id
    ? db.prepare('SELECT * FROM people WHERE id = ?').get(user.person_id)
    : null;

  // 我的贡献统计
  const stats = {
    timeline: db.prepare('SELECT COUNT(*) c FROM timeline_events WHERE owner_user_id = ?').get(user.id).c,
    archive: db.prepare('SELECT COUNT(*) c FROM archive_items WHERE owner_user_id = ? AND published_to_main = 1').get(user.id).c,
    files: db.prepare('SELECT COUNT(*) c FROM archive_items WHERE owner_user_id = ? AND (published_to_main = 0 OR published_to_main IS NULL)').get(user.id).c,
    oral: db.prepare('SELECT COUNT(*) c FROM oral_histories WHERE owner_user_id = ?').get(user.id).c,
    personal: db.prepare('SELECT COUNT(*) c FROM personal_entries WHERE owner_user_id = ?').get(user.id).c,
  };

  // 我提交却还在审核 / 被驳回的
  const reviewStats = {
    pending: db.prepare("SELECT COUNT(*) c FROM timeline_events WHERE owner_user_id = ? AND approval_status = 'pending'").get(user.id).c,
    rejected: db.prepare("SELECT COUNT(*) c FROM timeline_events WHERE owner_user_id = ? AND approval_status = 'rejected'").get(user.id).c,
  };

  // 最近五条我的贡献（合并）
  const recent = db.prepare(`
    SELECT 'timeline' kind, id, title, year, visibility, published_to_main, created_at FROM timeline_events WHERE owner_user_id = ?
    UNION ALL
    SELECT 'archive' kind, id, title, NULL year, visibility, published_to_main, created_at FROM archive_items WHERE owner_user_id = ?
    UNION ALL
    SELECT 'oral' kind, id, title, NULL year, visibility, published_to_main, created_at FROM oral_histories WHERE owner_user_id = ?
    UNION ALL
    SELECT 'personal' kind, id, title, year, visibility, published_to_main, created_at FROM personal_entries WHERE owner_user_id = ?
    ORDER BY created_at DESC LIMIT 8
  `).all(user.id, user.id, user.id, user.id);

  return (
    <PageEnter>
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* 头部 */}
        <div className="mb-12 border-b border-gold/20 pb-8">
          <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">My Personal Studio</div>
          <h1 className="font-display-cn text-4xl mt-3">{pick(locale, '我的家族卷宗', 'My Family Records')}</h1>
          <div className="gold-line w-16 mt-4"></div>
          <p className="text-muted text-sm leading-loose max-w-2xl mt-6">
            {pick(locale,
              <>在这里整理属于你的记忆、照片、时刻与成就。
              你可以将它们保留为<span className="text-vintage-red"> 私密 </span>仅自己可见，
              分享给<span className="text-sepia"> 家族 </span>，
              或选择<span className="text-vintage-green"> 公开 </span>到家族主页让访客看到。</>,
              <>Here you can organize your own memories, photos, milestones and achievements.
              You can keep them<span className="text-vintage-red"> private </span>for your eyes only,
              share them with the<span className="text-sepia"> family</span>,
              or choose to make them<span className="text-vintage-green"> public </span>on the family homepage for visitors to see.</>
            )}
          </p>
        </div>

        {/* 关联的家族身份 */}
        {me ? (
          <section className="mb-12 reveal">
            <div className="flex items-center gap-6 border border-gold/30 bg-parchment/60 p-6 card-premium">
              <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center font-display-cn text-2xl text-gold-deep flex-shrink-0">
                {loc(me, 'name', locale).charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep mb-1">In the Family</div>
                <div className="font-display-cn text-2xl">{loc(me, 'name', locale)}</div>
                <div className="text-sm text-muted mt-1">
                  {loc(me, 'role_in_family', locale)}
                  {me.birth_year && (
                    <span className="ml-3 font-mono text-xs">
                      {me.birth_year}{me.death_year ? `–${me.death_year}` : ' –'}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/people/${me.id}`} className="text-xs tracking-widest uppercase text-gold-deep hover:text-gold-bright">
                {pick(locale, '看我的公开档案 →', 'View my public profile →')}
              </Link>
            </div>
          </section>
        ) : user.role === 'member' && (
          <section className="mb-12 reveal">
            <div className="border border-vintage-red/30 bg-vintage-red/5 p-6 text-sm">
              <div className="text-[10px] tracking-[0.5em] uppercase text-vintage-red mb-2">Not Linked</div>
              <p>{pick(locale, '当前账号尚未关联到家族中具体的人物。请联系管理员在「账号管理」中将你绑定到一位家族成员。', 'This account is not yet linked to a specific person in the family. Please ask an administrator to bind you to a family member under "Account Management".')}</p>
            </div>
          </section>
        )}

        {/* 审核状态提醒 */}
        {(reviewStats.pending > 0 || reviewStats.rejected > 0) && (
          <section className="mb-10 reveal">
            <Link href="/my/timeline" className="block border border-sepia/30 bg-sepia/5 p-5 hover:bg-sepia/10 transition group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-sepia">◐</span>
                  <div>
                    <div className="text-[10px] tracking-[0.5em] uppercase text-sepia">Submission Status</div>
                    <div className="text-sm font-display-cn mt-1">
                      {reviewStats.pending > 0 && (
                        <span>{pick(locale, <>你提交的 <span className="text-sepia text-lg">{reviewStats.pending}</span> 条时间线事件正在审核</>, <><span className="text-sepia text-lg">{reviewStats.pending}</span> timeline {reviewStats.pending === 1 ? 'event you submitted is' : 'events you submitted are'} under review</>)}</span>
                      )}
                      {reviewStats.pending > 0 && reviewStats.rejected > 0 && <span>{pick(locale, '、', '; ')}</span>}
                      {reviewStats.rejected > 0 && (
                        <span>{pick(locale, <><span className="text-vintage-red text-lg">{reviewStats.rejected}</span> 条被驳回，请查看意见</>, <><span className="text-vintage-red text-lg">{reviewStats.rejected}</span> rejected — please review the feedback</>)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sepia group-hover:translate-x-1 transition text-sm">{pick(locale, '查看 →', 'View →')}</span>
              </div>
            </Link>
          </section>
        )}

        {/* 统计 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-gold/20 mb-12 reveal">
          <Stat label="Milestones" cn={pick(locale, '生平时刻', 'Milestones')} v={db.prepare("SELECT COUNT(*) c FROM personal_entries WHERE owner_user_id = ? AND kind IN ('milestone','achievement')").get(user.id).c} />
          <Stat label="Journal" cn={pick(locale, '个人记述', 'Personal Notes')} v={stats.personal} />
          <Stat label="My Files" cn={pick(locale, '我的档案', 'My Files')} v={stats.files} />
          <Stat label="Family Archive" cn={pick(locale, '家族档案库', 'Family Archive')} v={stats.archive} />
          <Stat label="Oral" cn={pick(locale, '家族口述', 'Family Oral History')} v={stats.oral} />
        </div>

        {/* 个人内容 —— 自由编辑 */}
        <section className="mb-14 reveal">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="font-display text-3xl text-gold-gradient">01</span>
            <h2 className="font-display-cn text-2xl">{pick(locale, '个人内容', 'Personal Content')}</h2>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gold-deep">{pick(locale, 'Personal · 自由编辑', 'Personal · Free to Edit')}</span>
            <div className="gold-line flex-1"></div>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-6 max-w-3xl">
            {pick(locale, '这些是你自己的空间 —— 不需要经过任何人审核，默认仅你可见。', 'This is your own space — no review by anyone is needed, and it is visible only to you by default.')}
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            <Card
              href="/my/milestones"
              num="❶"
              title={pick(locale, '我的生平时刻', 'My Milestones')}
              en="My Milestones"
              desc={pick(locale, '求学、工作、婚姻、为人父母、重要决定与成就—— 你人生中的重要节点。', 'Schooling, work, marriage, parenthood, key decisions and achievements — the important milestones of your life.')}
              accent="gold"
            />
            <Card
              href="/my/personal"
              num="❷"
              title={pick(locale, '个人记述', 'Personal Notes')}
              en="Personal Journal"
              desc={pick(locale, '日记、回忆、思考、旅行笔记—— 任何你想留下的文字。', 'Diaries, memories, reflections, travel notes — any words you want to leave behind.')}
              accent="gold"
            />
            <Card
              href="/my/files"
              num="❸"
              title={pick(locale, '我的档案', 'My Files')}
              en="My Files"
              desc={pick(locale, '个人照片、证件、凭证、视频、录音…… 任何文件格式。默认仅你可见。', 'Personal photos, documents, certificates, videos, recordings… any file format. Visible only to you by default.')}
              accent="gold"
            />
          </div>
        </section>

        {/* 家族共享内容 —— 需审核 / 发布到主页 */}
        <section className="mb-14 reveal">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="font-display text-3xl text-gold-gradient">02</span>
            <h2 className="font-display-cn text-2xl">{pick(locale, '家族共享内容', 'Family Shared Content')}</h2>
            <span className="text-[10px] tracking-[0.3em] uppercase text-sepia">{pick(locale, 'Shared · 家族可见或需审核', 'Shared · Family-visible or Needs Review')}</span>
            <div className="gold-line flex-1"></div>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-6 max-w-3xl">
            {pick(locale, '关于整个家族的事件、照片、口述记录。', 'Events, photos and oral records about the whole family.')}
            <span className="text-sepia">{pick(locale, '· “家族时间线”需要管理员审核后才会出现在公开时间线上。', ' · "Family Timeline" entries appear on the public timeline only after an administrator reviews them.')}</span>
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            <Card
              href="/my/timeline"
              num="❸"
              title={pick(locale, '家族时间线', 'Family Timeline')}
              en="Family Timeline"
              desc={pick(locale, '提交家族大事件。需管理员审核。', 'Submit major family events. Requires administrator review.')}
              accent="sepia"
              needsReview
              reviewLabel={pick(locale, '◐ 需审核', '◐ Needs Review')}
            />
            <Card
              href="/my/archive"
              num="❺"
              title={pick(locale, '家族档案库', 'Family Archive')}
              en="Family Archive"
              desc={pick(locale, '贡献照片、家书、契约、影像、实物…… 任何文件格式。', 'Contribute photos, family letters, deeds, footage, artifacts… any file format.')}
              accent="sepia"
            />
            <Card
              href="/my/oral-history"
              num="❻"
              title={pick(locale, '家族口述', 'Family Oral History')}
              en="Family Oral"
              desc={pick(locale, '记录长辈的讲述与口述访谈。', 'Record the accounts and oral-history interviews of your elders.')}
              accent="sepia"
            />
          </div>
        </section>

        {/* 最近 */}
        {recent.length > 0 && (
          <section className="reveal">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-display text-3xl text-gold-gradient">03</span>
              <h2 className="font-display-cn text-2xl">{pick(locale, '最近的贡献', 'Recent Contributions')}</h2>
              <div className="gold-line flex-1"></div>
            </div>
            <div className="border border-gold/20 bg-parchment/60 backdrop-blur-sm card-premium">
              {recent.map((r, i) => (
                <RecentRow key={`${r.kind}-${r.id}`} r={r} last={i === recent.length - 1} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageEnter>
  );
}

function Stat({ label, cn, v }) {
  return (
    <div className="bg-parchment p-8 text-center">
      <div className="text-[10px] tracking-[0.4em] uppercase text-gold-deep">{label}</div>
      <div className="text-5xl font-display text-ink mt-3">{String(v).padStart(2, '0')}</div>
      <div className="gold-line w-6 mx-auto my-2 opacity-50"></div>
      <div className="text-xs font-display-cn text-muted">{cn}</div>
    </div>
  );
}

function Card({ href, num, title, en, desc, accent, needsReview, reviewLabel }) {
  const accentColor = accent === 'gold' ? 'text-gold-deep' : 'text-sepia';
  return (
    <Link href={href} className="border border-gold/20 bg-parchment/60 backdrop-blur-sm p-7 card-premium group block">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-2xl ${accentColor}`}>{num}</span>
        <span className="text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all">→</span>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="font-display-cn text-xl">{title}</div>
        {needsReview && (
          <span className="text-[9px] tracking-widest text-sepia">{reviewLabel}</span>
        )}
      </div>
      <div className="text-[10px] tracking-[0.3em] uppercase text-gold-deep mb-3 mt-0.5">{en}</div>
      <div className="text-xs text-muted leading-relaxed">{desc}</div>
    </Link>
  );
}

function RecentRow({ r, last, locale }) {
  const kindLabel = {
    timeline: pick(locale, '时间线', 'Timeline'),
    archive: pick(locale, '档案', 'Archive'),
    oral: pick(locale, '口述', 'Oral'),
    personal: pick(locale, '个人', 'Personal'),
  }[r.kind];
  const kindHref = {
    timeline: '/my/timeline',
    archive: '/my/archive',
    oral: '/my/oral-history',
    personal: '/my/personal',
  }[r.kind];
  return (
    <Link href={kindHref} className={`flex items-center gap-5 px-6 py-4 ${last ? '' : 'border-b border-gold/10'} hover:bg-gold/5 transition`}>
      <span className="text-[10px] tracking-widest uppercase text-gold-deep w-20">{kindLabel}</span>
      <span className="font-display-cn flex-1 truncate">{r.title}</span>
      {r.year && <span className="font-mono text-xs text-muted">{r.year}</span>}
      <VisBadge v={r.visibility} />
      {r.published_to_main ? (
        <span className="text-[9px] tracking-widest uppercase text-vintage-green">{pick(locale, '● 已公开', '● Public')}</span>
      ) : (
        <span className="text-[9px] tracking-widest uppercase text-muted">{pick(locale, '○ 草稿', '○ Draft')}</span>
      )}
    </Link>
  );
}

function VisBadge({ v }) {
  const map = {
    public: { label: 'Public', color: 'text-vintage-green border-vintage-green/30' },
    member: { label: 'Family', color: 'text-sepia border-sepia/30' },
    admin: { label: 'Admin', color: 'text-vintage-red border-vintage-red/30' },
    private: { label: 'Private', color: 'text-ink/60 border-ink/30' },
  };
  const m = map[v] || map.public;
  return (
    <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${m.color}`}>{m.label}</span>
  );
}
