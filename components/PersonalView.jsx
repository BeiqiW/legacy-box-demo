'use client';
import { useState } from 'react';
import MyTable from './MyTable';
import PersonalTimeline from './PersonalTimeline';
import { pick } from '@/lib/i18n';

export default function PersonalView({ rows, fields, extraRefs, currentUserId, helpText, peopleMap }) {
  const locale = (typeof document !== 'undefined' && document.cookie.includes('lang=zh')) ? 'zh' : 'en';
  const [view, setView] = useState('timeline'); // 'timeline' | 'table'

  // 给 rows 加 person_name 方便时间轴显示
  const rowsWithPerson = rows.map((r) => ({
    ...r,
    person_name: r.person_id ? (peopleMap[r.person_id] || null) : null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Personal Entries</div>
          <h1 className="font-display-cn text-3xl mt-1">{pick(locale, '个人记述', 'Personal Notes')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle current={view} setView={setView} locale={locale} />
        </div>
      </div>

      {helpText && (
        <div className="text-xs text-muted leading-relaxed mb-8 italic max-w-2xl">
          {helpText}
        </div>
      )}

      {view === 'timeline' ? (
        <PersonalTimeline entries={rowsWithPerson} currentUserId={currentUserId} />
      ) : (
        <MyTable
          table="personal_entries"
          rows={rows}
          fields={fields}
          title=""
          titleEn=""
          extraRefs={extraRefs}
          currentUserId={currentUserId}
        />
      )}

      {view === 'timeline' && (
        <div className="mt-10 pt-6 border-t border-gold/20 text-xs text-muted">
          {pick(locale, '切换到「表格」视图可新增、编辑记述 · 共 ', 'Switch to the "Table" view to add or edit notes · ')}<span className="font-display-cn text-base text-ink-soft">{rows.length}</span>{pick(locale, ' 条', ' total')}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ current, setView, locale }) {
  return (
    <div className="inline-flex border border-gold/30 bg-parchment">
      <button
        onClick={() => setView('timeline')}
        className={`px-4 py-2 text-xs tracking-widest uppercase transition ${
          current === 'timeline' ? 'bg-gold/10 text-gold-deep' : 'text-muted hover:text-ink'
        }`}
      >
        {pick(locale, '◈ 时间轴', '◈ Timeline')}
      </button>
      <button
        onClick={() => setView('table')}
        className={`px-4 py-2 text-xs tracking-widest uppercase transition border-l border-gold/30 ${
          current === 'table' ? 'bg-gold/10 text-gold-deep' : 'text-muted hover:text-ink'
        }`}
      >
        {pick(locale, '☷ 表格', '☷ Table')}
      </button>
    </div>
  );
}
