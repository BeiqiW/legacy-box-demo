import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import PageEnter from '@/components/PageEnter';
import { getLocale, pick } from '@/lib/server-i18n';

export default async function MyLayout({ children, current }) {
  const locale = getLocale();
  const user = await getCurrentUser();

  // 个人内容（自由编辑）
  const PERSONAL_TABS = [
    { href: '/my', label: pick(locale, '总览', 'Overview'), en: 'Overview' },
    { href: '/my/milestones', label: pick(locale, '生平时刻', 'Milestones'), en: 'Milestones' },
    { href: '/my/personal', label: pick(locale, '个人记述', 'Personal Notes'), en: 'Journal' },
    { href: '/my/files', label: pick(locale, '我的档案', 'My Files'), en: 'Files' },
  ];

  // 家族共享内容（需审核或同步到主页）
  const FAMILY_TABS = [
    { href: '/my/timeline', label: pick(locale, '家族时间线', 'Family Timeline'), en: 'Family Timeline', needsReview: true },
    { href: '/my/archive', label: pick(locale, '家族档案库', 'Family Archive'), en: 'Family Archive' },
    { href: '/my/oral-history', label: pick(locale, '家族口述', 'Family Oral History'), en: 'Family Oral' },
  ];

  if (user.role === 'guest') {
    return (
      <PageEnter>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6 opacity-40">⚿</div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-vintage-red mb-3">Members Only</div>
            <h1 className="font-display-cn text-4xl mb-4">{pick(locale, '我的卷宗', 'My Records')}</h1>
            <p className="text-muted mb-8 leading-relaxed">{pick(locale, '请登录家族成员账号。', 'Please log in with a family member account.')}</p>
            <Link href="/login" className="btn-primary">{pick(locale, '登录 →', 'Login →')}</Link>
          </div>
        </div>
      </PageEnter>
    );
  }

  return (
    <PageEnter>
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-10 border-b border-gold/20 pb-5">
          <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep mb-4">
            Legacy Box · My Studio
          </div>

          {/* 两组：个人 | 家族 */}
          <div className="flex items-center gap-6 flex-wrap">
            <NavGroup label={pick(locale, '个人', 'Personal')} en="Personal" tabs={PERSONAL_TABS} current={current} />
            <div className="w-px h-8 bg-gold/20 hidden md:block"></div>
            <NavGroup label={pick(locale, '家族共享', 'Family Shared')} en="Shared" tabs={FAMILY_TABS} current={current} />
          </div>
        </div>

        {children}
      </div>
    </PageEnter>
  );
}

function NavGroup({ label, en, tabs, current }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[9px] tracking-[0.35em] uppercase text-muted mr-2 hidden md:inline">
        {label} · {en}
      </span>
      {tabs.map((t) => {
        const active = t.href === current;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 text-xs tracking-widest transition border-b-2 ${
              active
                ? 'border-gold text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <span className="font-display-cn text-sm">{t.label}</span>
            {t.needsReview && (
              <span className="ml-1.5 text-[9px] text-sepia">◐</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
