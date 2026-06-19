import Link from 'next/link';
import { getCurrentUser, visibilityForRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getLocale, pick, loc } from '@/lib/server-i18n';
import Particles from '@/components/Particles';
import PageEnter from '@/components/PageEnter';

export default async function Home() {
  const user = await getCurrentUser();
  const vis = visibilityForRole(user.role);
  const db = getDb();
  const locale = getLocale();

  const stats = {
    people: db.prepare(
      `SELECT COUNT(*) c FROM people WHERE visibility IN (${vis.map(() => '?').join(',')})`
    ).get(...vis).c,
    events: db.prepare(
      `SELECT COUNT(*) c FROM timeline_events WHERE visibility IN (${vis.map(() => '?').join(',')})
         AND (owner_user_id IS NULL OR (published_to_main = 1 AND approval_status = 'approved'))`
    ).get(...vis).c,
    archive: db.prepare(
      `SELECT COUNT(*) c FROM archive_items WHERE visibility IN (${vis.map(() => '?').join(',')})
         AND (owner_user_id IS NULL OR published_to_main = 1)`
    ).get(...vis).c,
    oral: db.prepare(
      `SELECT COUNT(*) c FROM oral_histories WHERE visibility IN (${vis.map(() => '?').join(',')})
         AND (owner_user_id IS NULL OR published_to_main = 1)`
    ).get(...vis).c,
  };

  const totalEvents = db.prepare('SELECT COUNT(*) c FROM timeline_events').get().c;
  const totalArchive = db.prepare('SELECT COUNT(*) c FROM archive_items').get().c;
  const hiddenEvents = totalEvents - stats.events;
  const hiddenArchive = totalArchive - stats.archive;

  return (
    <PageEnter>
      {/* === HERO === */}
      <section className="relative hero-bg text-parchment overflow-hidden">
        <Particles count={18} />

        {/* Decorative corners */}
        <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-gold/40"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-gold/40"></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-gold/40"></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-gold/40"></div>

        <div className="relative min-h-[680px] flex items-center justify-center px-6 py-32">
          <div className="text-center max-w-4xl">
            <div className="animate-fade-in">
              <div className="text-[10px] tracking-[0.6em] text-gold-bright uppercase mb-2">
                A Private Family Archive
              </div>
              <div className="text-[10px] tracking-[0.6em] text-gold/60 uppercase">
                Est. MDCCCXCVIII · Four Generations
              </div>
            </div>

            <div className="my-12 animate-fade-up delay-1">
              <div className="seal mx-auto animate-drift">
                <div>
                  陈<br />
                  <span className="text-[8px]">FAMILY</span>
                </div>
              </div>
            </div>

            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[1.05] hero-text-glow animate-fade-up delay-2">
              <span className="font-display-cn">陈氏家族</span>
              <br />
              <span className="text-gold-gradient italic font-light">Legacy</span>
            </h1>

            <div className="my-10 flex items-center justify-center gap-4 animate-fade-up delay-3">
              <div className="h-px w-16 bg-gold/40"></div>
              <span className="text-gold text-xl">◈</span>
              <div className="h-px w-16 bg-gold/40"></div>
            </div>

            <p className="text-lg md:text-xl leading-relaxed text-parchment/80 max-w-2xl mx-auto font-light italic animate-fade-up delay-3">
              {pick(
                locale,
                <>
                  从江南书香门第，到联大物理实验室，
                  <br className="hidden md:block" />
                  再到改革开放后的归国创业。
                </>,
                <>
                  From a scholarly household in the Jiangnan region, to the physics
                  laboratories of the National Southwestern Associated University,
                  <br className="hidden md:block" />
                  and home again to build anew after the Reform and Opening-Up.
                </>
              )}
            </p>

            <p className="mt-5 text-sm text-parchment/60 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-4">
              A century of memory, evidence, and inheritance — preserved with care.
            </p>

            <div className="mt-14 flex items-center justify-center gap-4 flex-wrap animate-fade-up delay-5">
              <Link href="/timeline" className="btn-primary">
                {pick(locale, '进入时间线', 'Enter Timeline')} <span className="text-gold-bright">→</span>
              </Link>
              <Link href="/people" className="btn-ghost">
                {pick(locale, '家族人物', 'Family Profiles')}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-parchment/40 text-xs animate-fade-in delay-6">
          <div className="flex flex-col items-center gap-2">
            <span className="tracking-[0.3em]">SCROLL</span>
            <span className="text-base">↓</span>
          </div>
        </div>
      </section>

      {/* === STATUS BANNER === */}
      <section className="bg-gradient-to-r from-transparent via-gold/10 to-transparent border-y border-gold/20">
        <div className="max-w-7xl mx-auto px-8 py-4 text-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-gold text-base">◇</span>
            <span>{pick(locale, '当前访问权限', 'Current access level')}</span>
            <span className="font-display-cn text-sepia">{roleLabel(user.role, locale)}</span>
          </div>
          {(hiddenEvents > 0 || hiddenArchive > 0) && (
            <div className="text-muted">
              <span className="text-sepia">⚿</span>&nbsp; {pick(
                locale,
                `${hiddenEvents} 条时间线 · ${hiddenArchive} 件档案受限`,
                `${hiddenEvents} timeline ${hiddenEvents === 1 ? 'entry' : 'entries'} · ${hiddenArchive} archive ${hiddenArchive === 1 ? 'item' : 'items'} restricted`
              )}
              {user.role === 'guest' && (
                <Link href="/login" className="ml-3 text-sepia hover:text-gold-deep transition underline-offset-4 hover:underline">
                  {pick(locale, '登录以解锁 →', 'Login to unlock →')}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* === STATS === */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16 reveal">
          <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">{pick(locale, '数字中的档案', 'The Archive in Numbers')}</div>
          <div className="gold-line w-24 mx-auto mt-4"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gold/20">
          <StatCard label={pick(locale, '家族成员', 'People')} en="People" value={stats.people} href="/people" delay={0} />
          <StatCard label={pick(locale, '历史事件', 'Events')} en="Events" value={stats.events} href="/timeline" delay={1} />
          <StatCard label={pick(locale, '档案资料', 'Archive')} en="Archive" value={stats.archive} href="/archive" delay={2} />
          <StatCard label={pick(locale, '口述记录', 'Oral History')} en="Oral History" value={stats.oral} href="/oral-history" delay={3} />
        </div>
      </section>

      {/* === FEATURED QUOTE === */}
      <section className="max-w-4xl mx-auto px-8 py-16 reveal">
        <div className="frame-gold text-center py-16">
          <p className="quote-mark font-display text-2xl md:text-3xl italic leading-relaxed text-ink-soft">
            {pick(
              locale,
              <>
                那时候大家什么都没有，
                <br />
                但什么都不缺。
                <br />
                <span className="text-base text-muted not-italic">
                  物质极简，精神极丰。
                </span>
              </>,
              <>
                Back then we had nothing at all,
                <br />
                and yet we lacked for nothing.
                <br />
                <span className="text-base text-muted not-italic">
                  Spare in possessions, rich in spirit.
                </span>
              </>
            )}
          </p>
          <div className="gold-line w-16 mx-auto my-6"></div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-muted">
            {pick(locale, '陈守仁 · 2005 · 关于西南联大岁月', 'Chen Shouren · 2005 · On the Lianda years')}
          </div>
        </div>
      </section>

      {/* === SECTIONS === */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16 reveal">
          <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">{pick(locale, '探索档案', 'Explore the Archive')}</div>
          <h2 className="font-display text-4xl mt-3">{pick(locale, '七个进入家族的入口', 'Seven Ways Into the Family')}</h2>
          <div className="gold-line w-24 mx-auto mt-4"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <SectionCard
            num="01"
            title={pick(locale, '家族时间线', 'Timeline')}
            en="Timeline"
            desc={pick(locale, '以年表的方式串联起四代人的关键时刻。每一条事件标注证据状态。', 'A chronology threading together the pivotal moments of four generations. Every entry is tagged with its evidence status.')}
            href="/timeline"
          />
          <SectionCard
            num="02"
            title={pick(locale, '世系图', 'Lineage')}
            en="Lineage"
            desc={pick(locale, '四代人物的关系图谱，清晰呈现婚姻、生育与传承。', 'A relationship chart of four generations, mapping marriage, birth, and inheritance.')}
            href="/family-tree"
          />
          <SectionCard
            num="03"
            title={pick(locale, '人物志', 'People')}
            en="People"
            desc={pick(locale, '家族成员档案，包括奠基人、第二代、第三代的生平脉络。', 'Profiles of family members, tracing the lives of the founders and the second and third generations.')}
            href="/people"
          />
          <SectionCard
            num="04"
            title={pick(locale, '档案馆', 'Archive')}
            en="Archive"
            desc={pick(locale, '照片、手稿、信件、学籍证件——家族物证。', 'Photographs, manuscripts, letters, school records — the family’s physical evidence.')}
            href="/archive"
          />
          <SectionCard
            num="05"
            title={pick(locale, '口述历史', 'Oral History')}
            en="Oral History"
            desc={pick(locale, '家族长辈的访谈录音与转录，让记忆以原声留存。', 'Recorded interviews and transcripts from the family elders, preserving memory in their own voices.')}
            href="/oral-history"
          />
          <SectionCard
            num="06"
            title={pick(locale, '访问权限', 'Access')}
            en="Access"
            desc={pick(locale, '三级访问：访客可见公开层，家族成员可见私密档案，管理员可编辑。', 'Three access levels: guests see the public layer, family members see private records, and administrators can edit.')}
            href="/login"
          />
          <SectionCard
            num="06"
            title={pick(locale, '关于本盒子', 'Legacy Box')}
            en="Legacy Box"
            desc={pick(locale, '所有数据存储在客户自己的硬件上，不依赖外部云服务。', 'All data is stored on the client’s own hardware, with no reliance on external cloud services.')}
            href="/about"
          />
        </div>
      </section>

      {/* === BOTTOM ORNAMENT === */}
      <section className="text-center py-24 reveal">
        <div className="flex items-center justify-center gap-6">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/40"></div>
          <span className="text-3xl text-gold-gradient animate-drift">◈</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/40"></div>
        </div>
        <div className="mt-6 text-[10px] tracking-[0.6em] uppercase text-muted">
          Preserving Human Legacy
        </div>
      </section>
    </PageEnter>
  );
}

function StatCard({ label, en, value, href, delay }) {
  return (
    <Link
      href={href}
      className={`block bg-parchment hover:bg-parchment-dark/50 p-10 text-center transition-all duration-700 card-premium group reveal delay-${delay + 1}`}
    >
      <div className="text-[10px] tracking-[0.4em] uppercase text-gold-deep">{en}</div>
      <div className="text-6xl font-display text-ink mt-4 mb-2 group-hover:text-sepia transition-colors duration-500">
        {String(value).padStart(2, '0')}
      </div>
      <div className="gold-line w-8 mx-auto my-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="text-xs font-display-cn text-muted">{label}</div>
    </Link>
  );
}

function SectionCard({ num, title, en, desc, href }) {
  return (
    <Link
      href={href}
      className="block bg-parchment/40 backdrop-blur-sm border border-gold/15 p-8 card-premium reveal group"
    >
      <div className="flex items-start justify-between mb-6">
        <span className="font-display text-3xl text-gold-gradient">{num}</span>
        <span className="text-gold/60 group-hover:translate-x-1 transition-transform">→</span>
      </div>
      <div className="text-[10px] tracking-[0.4em] uppercase text-gold-deep mb-2">{en}</div>
      <div className="font-display-cn text-xl mb-3 group-hover:text-sepia transition-colors">{title}</div>
      <div className="text-sm text-muted leading-relaxed">{desc}</div>
    </Link>
  );
}

function roleLabel(role, locale) {
  return {
    admin: pick(locale, '管理员 · Admin', 'Administrator'),
    member: pick(locale, '家族成员 · Member', 'Family Member'),
    guest: pick(locale, '访客 · Guest', 'Guest'),
  }[role];
}
