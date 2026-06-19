import { getDb } from '@/lib/db';
import { getCurrentUser, ROLE_LEVEL } from '@/lib/auth';
import { getLocale, pick, loc } from '@/lib/server-i18n';
import Link from 'next/link';
import PageEnter from '@/components/PageEnter';
import FamilyTreeChart from '@/components/FamilyTreeChart';

export const dynamic = 'force-dynamic';

export default async function FamilyTreePage() {
  const user = await getCurrentUser();
  const db = getDb();
  const userLevel = ROLE_LEVEL[user.role] ?? 0;
  const locale = getLocale();

  // 取所有人物（按权限过滤 bio）
  const allPeople = db.prepare('SELECT * FROM people ORDER BY birth_year ASC').all();

  // 族谱节点（包含展示用字段；私密人物对访客显示为「家族成员可见」）
  const people = allPeople.map((p) => {
    const visibility = p.visibility || 'public';
    const visLevel = ROLE_LEVEL[visibility] ?? 0;
    const canSee = userLevel >= visLevel;
    const displayName = loc(p, 'name', locale);
    return {
      id: p.id,
      name: canSee ? displayName : '⚿',
      fullName: displayName,
      nameZh: p.name, // stable key for chart node matching (never localized)
      visible: canSee,
      birth_year: p.birth_year,
      death_year: p.death_year,
      role_in_family: loc(p, 'role_in_family', locale),
      visibility,
    };
  });

  // 隐藏的人物数量
  const hiddenCount = people.filter((p) => !p.visible).length;

  return (
    <PageEnter>
      <div className="max-w-7xl mx-auto px-8 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">
            {pick(locale, 'Lineage · 世系', 'Lineage')}
          </div>
          <h1 className="font-display-cn text-5xl md:text-6xl mt-4">{pick(locale, '家族关系图谱', 'Family Lineage Chart')}</h1>
          <div className="gold-line w-24 mx-auto mt-6"></div>
          <p className="text-sm text-muted mt-8 max-w-2xl mx-auto leading-relaxed">
            {pick(
              locale,
              <>
                以视觉方式呈现陈氏家族四代的人物关系。<br className="hidden md:block" />
                每一条连接线均基于已核实的婚姻、生育与监护记录。
              </>,
              <>
                A visual portrait of four generations of the Chen family.<br className="hidden md:block" />
                Every connecting line is grounded in verified records of marriage, birth, and guardianship.
              </>
            )}
          </p>

          {hiddenCount > 0 && (
            <div className="mt-8 inline-block border border-sepia/20 bg-sepia/5 px-6 py-3 text-xs text-sepia">
              <span className="text-base">⚿</span>
              &nbsp;&nbsp; {pick(
                locale,
                <>您当前权限下有{' '}<span className="font-display-cn text-base">{hiddenCount}</span>{' '}位人物的姓名与传记不可见</>,
                <>The names and biographies of <span className="font-display-cn text-base">{hiddenCount}</span> {hiddenCount === 1 ? 'person are' : 'people are'} hidden at your current access level</>
              )}
              {!user.id && (
                <Link href="/login" className="ml-3 underline underline-offset-4">
                  {pick(locale, '登录 →', 'Login →')}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-8 mb-12 text-[11px] tracking-wider flex-wrap">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-gold-bright border-2 border-parchment shadow-[0_0_8px_rgba(184,150,91,0.5)]"></span>
            <span className="text-ink-soft uppercase">{pick(locale, '已故', 'Deceased')}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-parchment border-2 border-gold"></span>
            <span className="text-ink-soft uppercase">{pick(locale, '在世', 'Living')}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-gold-deep"></span>
            <span className="text-ink-soft uppercase">{pick(locale, '血缘', 'Bloodline')}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 border-t border-dashed border-gold-deep"></span>
            <span className="text-ink-soft uppercase">{pick(locale, '婚姻', 'Marriage')}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sepia/20 border border-sepia/40"></span>
            <span className="text-ink-soft uppercase">{pick(locale, '受限', 'Restricted')}</span>
          </span>
        </div>

        {/* SVG 族谱 */}
        <div className="reveal">
          <div className="archive-frame bg-parchment/40 backdrop-blur-sm p-6 md:p-10">
            <FamilyTreeChart people={people} userRole={user.role} locale={locale} />
          </div>
        </div>

        {/* 注释 */}
        <div className="mt-12 max-w-3xl mx-auto reveal">
          <div className="border-l-2 border-gold/40 pl-6 py-2 text-xs text-muted leading-relaxed">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold-deep mb-2">
              {pick(locale, 'Note · 注', 'Note')}
            </div>
            {pick(
              locale,
              <>
                次女 <span className="font-display-cn text-ink-soft">陈宛芳</span>（1932 – ?）
                于 1937 年逃难途中在浙赣边界走失，时年五岁，至今下落不明。家族每年清明仍在祠堂为她立位。
                <br />
                另有四子二女中尚未完成档案整理的人物若干，将在后续阶段补入。
              </>,
              <>
                The second daughter, <span className="font-display-cn text-ink-soft">Chen Wanfang</span> (1932 – ?),
                was lost at the age of five along the Zhejiang–Jiangxi border while the family fled in 1937, and has never been found. Each year at the Qingming festival the family still keeps a place for her in the ancestral hall.
                <br />
                Several other figures among the four sons and two daughters whose records are not yet complete will be added in later stages.
              </>
            )}
          </div>
        </div>

        {/* End */}
        <div className="text-center mt-20 reveal">
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-16 bg-gold/30"></div>
            <span className="text-gold text-xl">◈</span>
            <div className="h-px w-16 bg-gold/30"></div>
          </div>
          <div className="text-[10px] tracking-[0.5em] uppercase text-muted mt-4">
            Four Generations · 1898 – Present
          </div>
        </div>
      </div>
    </PageEnter>
  );
}
