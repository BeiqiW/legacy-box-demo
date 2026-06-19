'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pick, loc } from '@/lib/i18n';

export default function MilestonesView({ rows: initialRows, currentUserId, myPerson, people }) {
  const locale = (typeof document !== 'undefined' && document.cookie.includes('lang=zh')) ? 'zh' : 'en';
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const sorted = [...rows].sort((a, b) => {
    if (a.year === null && b.year === null) return b.id - a.id;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    if (a.year !== b.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });

  async function save(data) {
    setBusy(true);
    try {
      const isNew = !data.id;
      const url = '/api/my/personal_entries';
      const method = isNew ? 'POST' : 'PUT';
      const payload = {
        ...data,
        kind: data.kind || 'milestone',
        // 默认关联到自己的人物身份
        person_id: data.person_id || myPerson?.id || null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j.ok) { alert(j.error || pick(locale, '保存失败', 'Save failed')); return; }
      setEditing(null);
      router.refresh();
      // 乐观更新
      if (isNew) setRows([{ ...payload, id: j.id, created_at: new Date().toISOString() }, ...rows]);
      else setRows(rows.map((r) => r.id === data.id ? { ...r, ...payload } : r));
    } finally {
      setBusy(false);
    }
  }

  async function del(id) {
    if (!confirm(pick(locale, '确认删除这条生平时刻？', 'Delete this milestone?'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/my/personal_entries?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j.ok) { alert(j.error); return; }
      setRows(rows.filter((r) => r.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">My Milestones</div>
          <h1 className="font-display-cn text-3xl mt-1">{pick(locale, '我的生平时刻', 'My Milestones')}</h1>
          <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
            {pick(locale, '记录你自己的人生重要节点 —— 出生、求学、工作、婚姻、为人父母、重要决定、获得成就……', 'Record the major milestones of your own life — birth, schooling, work, marriage, parenthood, key decisions, achievements…')}
            <br />
            <span className="text-sepia">{pick(locale, '这里不需要审核，由你自己掌握。', 'No review needed here — you are in charge.')}</span>
          </p>
        </div>

        <button
          onClick={() => setEditing({})}
          className="btn-primary text-xs whitespace-nowrap"
        >
          {pick(locale, '+ 新增生平时刻', '+ New Milestone')}
        </button>
      </div>

      {myPerson && (
        <div className="mb-10 border border-gold/20 bg-gold/5 p-4 text-xs flex items-center gap-3">
          <span className="text-gold-deep">◈</span>
          <span className="text-ink-soft">
            {pick(locale, '当前账号关联到家族成员 ', 'This account is linked to family member ')}<span className="font-display-cn text-base text-ink">{loc(myPerson, 'name', locale)}</span>
            <span className="text-muted ml-1">{pick(locale, '（', '(')}{loc(myPerson, 'role_in_family', locale)}{pick(locale, '）', ')')}</span>
          </span>
        </div>
      )}

      {/* 时间轴 */}
      {sorted.length === 0 ? (
        <div className="border border-gold/20 bg-parchment/50 p-16 text-center text-muted">
          <div className="text-4xl text-gold/30 mb-4">◈</div>
          <div className="font-display-cn text-lg mb-2">{pick(locale, '还没有记录任何生平时刻', 'No milestones recorded yet')}</div>
          <div className="text-sm mb-6">{pick(locale, '建议从最早记得的一件事开始', 'Try starting with the earliest thing you remember')}</div>
          <button onClick={() => setEditing({})} className="btn-primary text-xs">
            {pick(locale, '+ 写下第一条', '+ Write the first one')}
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[100px] md:left-[150px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent"></div>
          <div className="space-y-6">
            {sorted.map((e) => (
              <MilestoneRow
                key={e.id}
                e={e}
                onEdit={() => setEditing(e)}
                onDelete={() => del(e.id)}
                busy={busy}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* 编辑抽屉 */}
      {editing && (
        <EditDrawer
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
          busy={busy}
          people={people}
          myPerson={myPerson}
          locale={locale}
        />
      )}
    </div>
  );
}

function MilestoneRow({ e, onEdit, onDelete, busy, locale }) {
  const dateStr = e.year
    ? `${e.year}${e.month ? '.' + String(e.month).padStart(2, '0') : ''}${e.day ? '.' + String(e.day).padStart(2, '0') : ''}`
    : pick(locale, '未注明', 'Undated');

  const kindLabel = e.kind === 'achievement' ? pick(locale, '🏆 成就', '🏆 Achievement') : pick(locale, '✦ 时刻', '✦ Milestone');

  return (
    <div className="flex items-start group">
      <div className="w-[80px] md:w-[130px] text-right pr-6 pt-2">
        <div className="font-mono text-sm text-gold-deep tabular-nums">{dateStr}</div>
        <div className="text-[10px] tracking-widest uppercase text-muted mt-1">{kindLabel}</div>
      </div>

      <div className="w-[40px] flex justify-center pt-3 relative z-10">
        <div className="w-3 h-3 rounded-full bg-gold border-2 border-parchment shadow-[0_0_0_2px_#b8965b]"></div>
      </div>

      <div className="flex-1 border border-gold/20 bg-parchment/70 backdrop-blur-sm card-premium p-6 -mt-1">
        <div className="flex items-baseline gap-3 mb-2 flex-wrap">
          <h3 className="font-display-cn text-lg flex-1 min-w-0">{e.title}</h3>
          <VisBadge v={e.visibility} />
          {e.published_to_main && e.visibility === 'public' && (
            <span className="text-[9px] tracking-widest uppercase text-vintage-green">{pick(locale, '● 主页', '● Homepage')}</span>
          )}
        </div>

        {e.body && (
          <p className="text-sm text-ink-soft leading-loose whitespace-pre-wrap mt-3">{e.body}</p>
        )}

        {e.media_url && (
          <div className="mt-4">
            {/\.(jpg|jpeg|png|gif|webp)$/i.test(e.media_url) ? (
              <img src={e.media_url} alt={e.title} className="max-h-48 rounded border border-gold/20" />
            ) : (
              <a href={e.media_url} target="_blank" rel="noreferrer" className="text-xs text-gold-deep underline underline-offset-4">
                {pick(locale, '📎 附件', '📎 Attachment')}
              </a>
            )}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-gold/15 flex items-center justify-end gap-3 text-[10px] tracking-widest uppercase">
          <button onClick={onEdit} disabled={busy} className="text-gold-deep hover:text-ink transition">
            {pick(locale, '编辑', 'Edit')}
          </button>
          <span className="text-muted">·</span>
          <button onClick={onDelete} disabled={busy} className="text-vintage-red hover:opacity-70 transition">
            {pick(locale, '删除', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

function VisBadge({ v }) {
  const map = {
    private: { label: 'Private', c: 'text-ink/60 border-ink/20' },
    member: { label: 'Family', c: 'text-sepia border-sepia/30' },
    public: { label: 'Public', c: 'text-vintage-green border-vintage-green/30' },
    admin: { label: 'Admin', c: 'text-vintage-red border-vintage-red/30' },
  };
  const m = map[v] || map.private;
  return <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 border ${m.c}`}>{m.label}</span>;
}

function EditDrawer({ initial, onCancel, onSave, busy, people, myPerson, locale }) {
  const [data, setData] = useState({
    kind: initial.kind || 'milestone',
    title: initial.title || '',
    year: initial.year || '',
    month: initial.month || '',
    day: initial.day || '',
    body: initial.body || '',
    media_url: initial.media_url || '',
    person_id: initial.person_id ?? (myPerson?.id || ''),
    visibility: initial.visibility || 'private',
    published_to_main: initial.published_to_main ?? 0,
    id: initial.id,
  });

  function upd(k, v) { setData({ ...data, [k]: v }); }

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if (j.ok) upd('media_url', j.url);
    else alert(j.error || pick(locale, '上传失败', 'Upload failed'));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-parchment border-l border-gold/30 w-full max-w-xl overflow-y-auto shadow-2xl"
        style={{ animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">
                {initial.id ? 'Edit' : 'New'} Milestone
              </div>
              <h2 className="font-display-cn text-2xl mt-1">
                {initial.id ? pick(locale, '编辑生平时刻', 'Edit Milestone') : pick(locale, '新增生平时刻', 'New Milestone')}
              </h2>
            </div>
            <button onClick={onCancel} className="text-2xl text-muted hover:text-ink">×</button>
          </div>

          <div className="space-y-5">
            <Field label={pick(locale, '类型', 'Type')} en="Type">
              <select
                value={data.kind}
                onChange={(e) => upd('kind', e.target.value)}
                className="w-full bg-parchment border border-gold/30 p-2.5 text-sm"
              >
                <option value="milestone">{pick(locale, '✦ 人生时刻 Milestone', '✦ Milestone')}</option>
                <option value="achievement">{pick(locale, '🏆 成就 Achievement', '🏆 Achievement')}</option>
              </select>
            </Field>

            <Field label={pick(locale, '标题', 'Title')} en="Title" required>
              <input
                type="text"
                value={data.title}
                onChange={(e) => upd('title', e.target.value)}
                placeholder={pick(locale, '如：考入清华大学 / 第一个孩子出生 / 创立公司', 'e.g. Admitted to Tsinghua / First child born / Founded a company')}
                className="w-full bg-parchment border border-gold/30 p-2.5 text-sm font-display-cn"
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label={pick(locale, '年份', 'Year')} en="Year">
                <input type="number" value={data.year} onChange={(e) => upd('year', e.target.value)}
                  placeholder="2018" className="w-full bg-parchment border border-gold/30 p-2.5 text-sm" />
              </Field>
              <Field label={pick(locale, '月', 'Month')} en="Month">
                <input type="number" value={data.month} onChange={(e) => upd('month', e.target.value)}
                  placeholder={pick(locale, '可空', 'Optional')} min="1" max="12" className="w-full bg-parchment border border-gold/30 p-2.5 text-sm" />
              </Field>
              <Field label={pick(locale, '日', 'Day')} en="Day">
                <input type="number" value={data.day} onChange={(e) => upd('day', e.target.value)}
                  placeholder={pick(locale, '可空', 'Optional')} min="1" max="31" className="w-full bg-parchment border border-gold/30 p-2.5 text-sm" />
              </Field>
            </div>

            <Field label={pick(locale, '描述', 'Description')} en="Description" hint={pick(locale, '可以写长，慢慢来', 'Feel free to write at length, take your time')}>
              <textarea
                value={data.body}
                onChange={(e) => upd('body', e.target.value)}
                rows={8}
                placeholder={pick(locale, '那天的天气、心情、人物、对话……越具体越好', 'The weather that day, the mood, the people, the conversations… the more specific the better')}
                className="w-full bg-parchment border border-gold/30 p-3 text-sm font-display-cn leading-loose resize-y"
              />
            </Field>

            <Field label={pick(locale, '配图', 'Photo')} en="Photo">
              <input type="file" onChange={uploadFile} className="text-xs" />
              {data.media_url && (
                <div className="mt-2">
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(data.media_url) ? (
                    <img src={data.media_url} className="max-h-32 border border-gold/20" />
                  ) : (
                    <a href={data.media_url} target="_blank" className="text-xs text-gold-deep underline">{pick(locale, '已上传', 'Uploaded')}</a>
                  )}
                </div>
              )}
            </Field>

            <Field label={pick(locale, '关联家族成员', 'Related Person')} en="Related Person" hint={pick(locale, '默认关联到你自己', 'Linked to yourself by default')}>
              <select
                value={data.person_id || ''}
                onChange={(e) => upd('person_id', e.target.value || null)}
                className="w-full bg-parchment border border-gold/30 p-2.5 text-sm"
              >
                <option value="">{pick(locale, '— 不关联 —', '— Not linked —')}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <div className="border-t border-gold/20 pt-5 space-y-4">
              <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">{pick(locale, '分享设置', 'Sharing Settings')}</div>

              <Field label={pick(locale, '可见性', 'Visibility')} en="Visibility">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'private', label: pick(locale, '🔒 仅自己', '🔒 Only Me'), sub: pick(locale, '默认', 'Default') },
                    { v: 'member', label: pick(locale, '👨‍👩‍👧 家族', '👨‍👩‍👧 Family'), sub: pick(locale, '家族成员可见', 'Visible to family') },
                    { v: 'public', label: pick(locale, '🌐 公开', '🌐 Public'), sub: pick(locale, '出现在主页', 'Shown on homepage') },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => upd('visibility', o.v)}
                      className={`p-3 border text-left text-xs transition ${
                        data.visibility === o.v
                          ? 'border-gold bg-gold/10'
                          : 'border-gold/20 hover:border-gold/50'
                      }`}
                    >
                      <div className="font-display-cn">{o.label}</div>
                      <div className="text-[10px] text-muted mt-0.5">{o.sub}</div>
                    </button>
                  ))}
                </div>
              </Field>

              {data.visibility === 'public' && (
                <Field label={pick(locale, '同步到该家族成员人物志', 'Publish to Person Profile')} en="Publish to Person Profile">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!data.published_to_main}
                      onChange={(e) => upd('published_to_main', e.target.checked ? 1 : 0)}
                    />
                    <span>{pick(locale, '勾选后，这条时刻将出现在所关联家族成员的人物志详情页', 'Once checked, this milestone will appear on the profile page of the linked family member')}</span>
                  </label>
                </Field>
              )}
            </div>
          </div>

          <div className="mt-10 flex items-center gap-3 pt-5 border-t border-gold/20">
            <button
              onClick={() => onSave(data)}
              disabled={busy || !data.title.trim()}
              className="btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {initial.id ? pick(locale, '保存修改', 'Save Changes') : pick(locale, '保存', 'Save')}
            </button>
            <button
              onClick={onCancel}
              disabled={busy}
              className="text-xs tracking-widest uppercase px-4 py-2.5 text-muted hover:text-ink transition"
            >
              {pick(locale, '取消', 'Cancel')}
            </button>
            <span className="ml-auto text-[10px] text-muted italic">
              {data.visibility === 'private' ? pick(locale, '这条只有你能看到', 'Only you can see this') : data.visibility === 'member' ? pick(locale, '家族成员可见', 'Visible to family members') : pick(locale, '将公开展示', 'Will be shown publicly')}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

function Field({ label, en, hint, required, children }) {
  return (
    <div>
      <label className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase text-gold-deep">{label}</span>
        <span className="text-[9px] text-muted uppercase tracking-widest">{en}</span>
        {required && <span className="text-vintage-red text-xs">*</span>}
        {hint && <span className="text-[10px] text-muted italic ml-auto">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
