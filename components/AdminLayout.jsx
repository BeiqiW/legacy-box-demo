import Link from 'next/link';
import PageEnter from '@/components/PageEnter';
import AdminGuard from '@/components/AdminGuard';
import { getLocale, pick, loc } from '@/lib/server-i18n';

const TABS = [
  { href: '/admin', label: '总览', labelEn: 'Overview', en: 'Overview' },
  { href: '/admin/review', label: '审核', labelEn: 'Review', en: 'Review' },
  { href: '/admin/people', label: '人物', labelEn: 'People', en: 'People' },
  { href: '/admin/timeline', label: '时间线', labelEn: 'Timeline', en: 'Timeline' },
  { href: '/admin/archive', label: '档案', labelEn: 'Archive', en: 'Archive' },
  { href: '/admin/oral-history', label: '口述', labelEn: 'Oral', en: 'Oral' },
  { href: '/admin/users', label: '账号', labelEn: 'Users', en: 'Users' },
];

export default function AdminLayout({ children, current }) {
  const locale = getLocale();
  return (
    <AdminGuard>
      <PageEnter>
        <div className="max-w-7xl mx-auto px-8 py-16">
          {/* 顶部 admin breadcrumb + tabs */}
          <div className="mb-10 border-b border-gold/20 pb-5">
            <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep mb-3">
              Legacy Box · Admin Console
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {TABS.map((t) => {
                const active = t.href === current;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`px-4 py-2 text-xs tracking-widest transition border-b-2 ${
                      active
                        ? 'border-gold text-ink font-display-cn'
                        : 'border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    <span className="font-display-cn text-sm">{pick(locale, t.label, t.labelEn)}</span>
                    <span className="text-[9px] uppercase ml-2 opacity-70">{t.en}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </div>
      </PageEnter>
    </AdminGuard>
  );
}
