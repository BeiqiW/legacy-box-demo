import Link from 'next/link';
import { getCurrentUser, canAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PageEnter from '@/components/PageEnter';

export default async function AdminSection({ children }) {
  const user = await getCurrentUser();
  if (!canAccess(user.role, 'admin')) {
    return (
      <PageEnter>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6 opacity-40">⚿</div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-vintage-red mb-3">Restricted</div>
            <h1 className="font-display-cn text-4xl mb-4">访问受限</h1>
            <div className="gold-line w-16 mx-auto mb-6"></div>
            <p className="text-muted mb-8 leading-relaxed">管理后台仅限管理员访问。</p>
            <Link href="/login" className="btn-primary">切换账号 →</Link>
          </div>
        </div>
      </PageEnter>
    );
  }
  return <>{children}</>;
}
