'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pick } from '@/lib/i18n';

export default function PersonalTimeline({ entries, currentUserId }) {
  const locale = (typeof document !== 'undefined' && document.cookie.includes('lang=zh')) ? 'zh' : 'en';
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 按年降序排列；无年份的放最末
  const sorted = [...entries].sort((a, b) => {
    if (a.year === null && b.year === null) return b.id - a.id;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    if (a.year !== b.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });

  // 按年代分组
  const grouped = {};
  for (const e of sorted) {
    const key = e.year ? `${Math.floor(e.year / 10) * 10}s` : pick(locale, '未标注年份', 'Undated');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  async function del(id) {
    if (!confirm(pick(locale, '确认删除？此操作不可撤销。', 'Confirm delete? This action cannot be undone.'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/my/personal_entries?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j.ok) { alert(pick(locale, '删除失败：', 'Delete failed: ') + j.error); return; }
      router.refresh();
    } finally { setBusy(false); }
  }

  if (sorted.length === 0) {
    return (
      <div className="border border-gold/20 bg-parchment/50 p-16 text-center text-muted">
        <div className="text-4xl text-gold/30 mb-4">◈</div>
        <div className="font-display-cn text-lg mb-2">{pick(locale, '时间轴尚未展开', 'Your timeline is empty')}</div>
        <div className="text-sm">{pick(locale, '在「表格」视图中新增第一条记述', 'Add your first entry in the Table view')}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 中央金色竖线 */}
      <div className="absolute left-[110px] md:left-[160px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent"></div>

      <div className="space-y-12">
        {Object.entries(grouped).map(([decade, items]) => (
          <DecadeBlock key={decade} decade={decade} items={items} onDelete={del} busy={busy} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function DecadeBlock({ decade, items, onDelete, busy, locale = 'en' }) {
  return (
    <div>
      {/* 年代标签 */}
      <div className="flex items-baseline mb-6">
        <div className="w-[90px] md:w-[140px] text-right pr-6">
          <div className="font-display text-2xl text-gold-gradient">{decade}</div>
        </div>
        <div className="w-[40px]"></div>
        <div className="flex-1 gold-line opacity-30"></div>
      </div>

      <div className="space-y-6">
        {items.map((e) => (
          <Entry key={e.id} e={e} onDelete={onDelete} busy={busy} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function Entry({ e, onDelete, busy, locale = 'en' }) {
  const dateStr = e.year
    ? `${e.year}${e.month ? '.' + String(e.month).padStart(2, '0') : ''}${e.day ? '.' + String(e.day).padStart(2, '0') : ''}`
    : '—';

  return (
    <div className="flex items-start group">
      {/* 左侧日期 */}
      <div className="w-[90px] md:w-[140px] text-right pr-6 pt-2">
        <div className="font-mono text-sm text-gold-deep tabular-nums">{dateStr}</div>
        <KindLabel kind={e.kind} locale={locale} />
      </div>

      {/* 中间圆点 */}
      <div className="w-[40px] flex justify-center pt-3 relative z-10">
        <div className="w-3 h-3 rounded-full bg-gold border-2 border-parchment shadow-[0_0_0_2px_#b8965b]"></div>
      </div>

      {/* 右侧卡片 */}
      <div className="flex-1 border border-gold/20 bg-parchment/70 backdrop-blur-sm card-premium p-6 -mt-1">
        <div className="flex items-baseline gap-3 mb-2 flex-wrap">
          <h3 className="font-display-cn text-lg flex-1 min-w-0">{e.title}</h3>
          <VisBadge v={e.visibility} />
          {e.published_to_main && e.visibility === 'public' && (
            <span className="text-[9px] tracking-widest uppercase text-vintage-green">{pick(locale, '● 主页', '● Home')}</span>
          )}
        </div>

        {e.body && (
          <p className="text-sm text-ink-soft leading-loose whitespace-pre-wrap mt-3">{e.body}</p>
        )}

        {e.media_url && (
          <div className="mt-4">
            {/\.(jpg|jpeg|png|gif|webp)$/i.test(e.media_url) ? (
              <img src={e.media_url} alt={e.title} className="max-h-64 rounded border border-gold/20" />
            ) : (
              <a href={e.media_url} target="_blank" rel="noreferrer" className="text-xs text-gold-deep underline underline-offset-4">
                📎 {pick(locale, '附件', 'Attachment')}
              </a>
            )}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-gold/15 flex items-center justify-between text-[10px] tracking-widest uppercase">
          <span className="text-muted">
            {e.person_name && <>{pick(locale, '关于', 'On')} {e.person_name} · </>}
            {fmtCreated(e.created_at, locale)}
          </span>
          <button
            onClick={() => onDelete(e.id)}
            disabled={busy}
            className="text-vintage-red hover:opacity-70 transition"
          >
            {pick(locale, '删除', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

function KindLabel({ kind, locale = 'en' }) {
  const map = {
    memory: { label: pick(locale, '回忆', 'Memory'), icon: '🌿' },
    achievement: { label: pick(locale, '成就', 'Achievement'), icon: '🏆' },
    milestone: { label: pick(locale, '人生时刻', 'Milestone'), icon: '✦' },
    travel: { label: pick(locale, '旅行', 'Travel'), icon: '✈' },
    family: { label: pick(locale, '家庭', 'Family'), icon: '👨‍👩‍👧' },
    note: { label: pick(locale, '笔记', 'Note'), icon: '📝' },
  };
  const m = map[kind] || { label: kind, icon: '◈' };
  return (
    <div className="text-[10px] tracking-widest uppercase text-muted mt-1">
      <span className="mr-1">{m.icon}</span>
      {m.label}
    </div>
  );
}

function VisBadge({ v }) {
  const map = {
    public: { label: 'Public', c: 'text-vintage-green border-vintage-green/30' },
    member: { label: 'Family', c: 'text-sepia border-sepia/30' },
    admin: { label: 'Admin', c: 'text-vintage-red border-vintage-red/30' },
    private: { label: 'Private', c: 'text-ink/60 border-ink/30' },
  };
  const m = map[v] || map.public;
  return <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${m.c}`}>{m.label}</span>;
}

function fmtCreated(s, locale = 'en') {
  if (!s) return '';
  return pick(locale, '写于 ', 'Written ') + s.replace('T', ' ').slice(0, 10);
}
