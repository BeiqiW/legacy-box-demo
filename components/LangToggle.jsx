'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LangToggle({ locale }) {
  const router = useRouter();
  const [lang, setLang] = useState(locale);

  function choose(next) {
    if (next === lang) return;
    setLang(next);
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.setAttribute('lang', next === 'en' ? 'en' : 'zh-CN');
    router.refresh();
  }

  return (
    <div className="lang-toggle flex items-center border border-ink/15 text-[11px] tracking-widest">
      <button
        type="button"
        onClick={() => choose('en')}
        aria-pressed={lang === 'en'}
        className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-gold text-parchment' : 'text-muted hover:text-gold-deep'}`}
      >
        EN
      </button>
      <span className="text-ink/20">/</span>
      <button
        type="button"
        onClick={() => choose('zh')}
        aria-pressed={lang === 'zh'}
        className={`px-2.5 py-1.5 transition-colors ${lang === 'zh' ? 'bg-gold text-parchment' : 'text-muted hover:text-gold-deep'}`}
      >
        中
      </button>
    </div>
  );
}
