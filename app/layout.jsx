import './globals.css';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getLocale, c, loc } from '@/lib/server-i18n';
import ScrollReveal from '@/components/ScrollReveal';
import LangToggle from '@/components/LangToggle';

export function generateMetadata() {
  const locale = getLocale();
  return locale === 'en'
    ? { title: 'The Chen Family Legacy Archive · Legacy Box', description: 'A family-legacy demo site by Legacy Labs' }
    : { title: '陈氏家族传承档案 · Legacy Box', description: '由 Legacy Labs 提供的家族传承演示站' };
}

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const locale = getLocale();

  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'}>
      <body>
        <div className="scroll-progress"></div>

        <header className="sticky top-0 z-50 backdrop-blur-md bg-parchment/95 border-b border-gold/20">
          <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-4 group shrink-0">
              <span className="diamond-mark text-2xl text-gold-gradient">◈</span>
              <div>
                <div className="font-display text-lg tracking-wider leading-none whitespace-nowrap">{c(locale, 'brand')}</div>
                <div className="text-[9px] uppercase tracking-[0.4em] text-muted mt-1.5 whitespace-nowrap">
                  The Chen Family Legacy · Est. 1898
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-[13px] whitespace-nowrap">
              <Link href="/" className="nav-link">{c(locale, 'nav_home')}</Link>
              <Link href="/timeline" className="nav-link">{c(locale, 'nav_timeline')}</Link>
              <Link href="/family-tree" className="nav-link">{c(locale, 'nav_tree')}</Link>
              <Link href="/people" className="nav-link">{c(locale, 'nav_people')}</Link>
              <Link href="/archive" className="nav-link">{c(locale, 'nav_archive')}</Link>
              <Link href="/oral-history" className="nav-link">{c(locale, 'nav_oral')}</Link>
              {(user.role === 'member' || user.role === 'admin') && (
                <Link href="/my" className="nav-link text-sepia">{c(locale, 'nav_my')}</Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin" className="nav-link text-gold-deep">{c(locale, 'nav_admin')}</Link>
              )}
            </nav>

            <div className="flex items-center gap-3 text-sm shrink-0">
              <LangToggle locale={locale} />
              {user.id ? (
                <>
                  <div className="text-right hidden lg:block">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted whitespace-nowrap">
                      {roleLabel(user.role, locale)}
                    </div>
                    <div className="text-[13px] font-display-cn mt-0.5 whitespace-nowrap">{loc(user, 'display_name', locale)}</div>
                  </div>
                  <form action="/api/auth/logout" method="POST">
                    <button className="text-[11px] px-4 py-2 border border-ink/15 hover:border-gold hover:text-gold-deep transition-all tracking-widest">
                      {c(locale, 'logout').toUpperCase()}
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-[11px] px-4 py-2 border border-ink/15 hover:border-gold hover:text-gold-deep transition-all tracking-widest"
                >
                  {c(locale, 'login').toUpperCase()}
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-180px)]">
          {children}
        </main>

        <footer className="mt-24 border-t border-gold/20 bg-parchment-dark/30">
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-gold-gradient">◈</span>
                  <span className="font-display text-lg">Legacy Box</span>
                </div>
                <p className="text-xs text-muted mt-3 leading-relaxed">
                  Preserving Human Legacy<br />
                  Through AI, Storytelling and Technology
                </p>
              </div>
              <div className="text-xs text-muted">
                <div className="uppercase tracking-[0.3em] text-ink-soft mb-3">{c(locale, 'foot_sov_h')}</div>
                <p className="leading-relaxed">{c(locale, 'foot_sov_p')}</p>
              </div>
              <div className="text-xs text-muted md:text-right">
                <div className="uppercase tracking-[0.3em] text-ink-soft mb-3">{c(locale, 'foot_demo_h')}</div>
                <p className="leading-relaxed">
                  {c(locale, 'foot_demo_p')}<br />
                  © {new Date().getFullYear()} Legacy Labs
                </p>
              </div>
            </div>
            <div className="gold-line mt-10"></div>
            <div className="text-center mt-6 text-[10px] uppercase tracking-[0.5em] text-muted">
              ◇ &nbsp;&nbsp; {c(locale, 'foot_private')} &nbsp;&nbsp; ◇
            </div>
          </div>
        </footer>

        <ScrollReveal />
      </body>
    </html>
  );
}

function roleLabel(role, locale) {
  const key = { admin: 'role_admin', member: 'role_member', guest: 'role_guest' }[role] || 'role_guest';
  return c(locale, key);
}
