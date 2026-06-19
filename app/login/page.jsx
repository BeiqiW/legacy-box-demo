'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pick } from '@/lib/i18n';

export default function LoginPage() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = typeof document !== 'undefined' && document.cookie.includes('lang=zh') ? 'zh' : 'en';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error || pick(locale, '登录失败', 'Login failed'));
      return;
    }
    router.push('/');
    router.refresh();
  }

  function fillDemo(u, p) {
    setU(u);
    setP(p);
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-10">
          <div className="text-4xl text-gold-gradient animate-drift inline-block">◈</div>
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase mt-4">Access</div>
          <h1 className="font-display-cn text-3xl mt-3">{pick(locale, '登录陈氏家族档案', 'Sign in to the Chen Family Archive')}</h1>
          <div className="gold-line w-16 mx-auto mt-4"></div>
        </div>

        <form onSubmit={handleSubmit} className="bg-parchment/70 backdrop-blur-sm border border-gold/20 p-10 space-y-6 card-premium">
          <div>
            <label className="text-[10px] tracking-[0.4em] uppercase text-gold-deep">Username</label>
            <input
              value={username}
              onChange={(e) => setU(e.target.value)}
              className="mt-2 w-full border-b border-ink/15 bg-transparent py-3 focus:outline-none focus:border-gold transition-colors text-base"
              required
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.4em] uppercase text-gold-deep">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setP(e.target.value)}
              className="mt-2 w-full border-b border-ink/15 bg-transparent py-3 focus:outline-none focus:border-gold transition-colors text-base"
              required
            />
          </div>
          {error && <div className="text-sm text-vintage-red border-l-2 border-vintage-red pl-3 py-1">{error}</div>}
          <button
            disabled={loading}
            className="btn-primary w-full justify-center mt-4 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-10 bg-parchment-dark/30 border border-gold/15 p-6 text-xs">
          <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep mb-4 text-center">
            ◇ Demo Accounts ◇
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillDemo('admin', 'admin123')}
              className="block w-full text-left px-4 py-3 bg-parchment/60 hover:bg-parchment border border-gold/15 hover:border-gold transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-vintage-red">👑 admin / admin123</span>
                <span className="text-muted group-hover:text-gold transition">→</span>
              </div>
              <div className="text-[10px] text-muted mt-1">{pick(locale, '管理员 · 可编辑全部内容', 'Admin · can edit all content')}</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('family', 'family123')}
              className="block w-full text-left px-4 py-3 bg-parchment/60 hover:bg-parchment border border-gold/15 hover:border-gold transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sepia">👨‍👩‍👧 family / family123</span>
                <span className="text-muted group-hover:text-gold transition">→</span>
              </div>
              <div className="text-[10px] text-muted mt-1">{pick(locale, '家族成员 · 可查看私密档案', 'Family member · can view private records')}</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('guest', 'guest123')}
              className="block w-full text-left px-4 py-3 bg-parchment/60 hover:bg-parchment border border-gold/15 hover:border-gold transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-muted">👁 guest / guest123</span>
                <span className="text-muted group-hover:text-gold transition">→</span>
              </div>
              <div className="text-[10px] text-muted mt-1">{pick(locale, '访客 · 仅公开内容', 'Guest · public content only')}</div>
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-xs text-muted hover:text-gold-deep tracking-wider">
            ← Browse as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
