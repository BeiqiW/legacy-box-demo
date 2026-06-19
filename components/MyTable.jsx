'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pick, loc } from '@/lib/i18n';

/**
 * 家族成员的内容管理表
 * - 显示用户拥有的记录
 * - 允许 CRUD（owner-scoped）
 * - 含 publish-to-main 开关
 */
export default function MyTable({ table, rows: initialRows, fields, title, titleEn, extraRefs = {}, currentUserId, helpText }) {
  const locale = (typeof document !== 'undefined' && document.cookie.includes('lang=zh')) ? 'zh' : 'en';
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');

  function openNew() {
    const empty = { _new: true };
    fields.forEach((f) => {
      if (f.type === 'visibility') empty[f.key] = 'private';
      else if (f.type === 'evidence') empty[f.key] = 'attributed';
      else if (f.key === 'published_to_main') empty[f.key] = 0;
      else empty[f.key] = '';
    });
    setEditing(empty);
  }

  function openEdit(row) {
    setEditing({ ...row });
  }

  async function save() {
    setBusy(true);
    try {
      const method = editing._new ? 'POST' : 'PUT';
      const body = { ...editing };
      delete body._new;
      const res = await fetch(`/api/my/${table}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.ok) {
        alert(pick(locale, '保存失败：', 'Save failed: ') + (j.error || pick(locale, '未知错误', 'Unknown error')));
        setBusy(false);
        return;
      }
      setEditing(null);
      router.refresh();
    } catch (e) {
      alert(pick(locale, '保存失败：', 'Save failed: ') + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id) {
    if (!confirm(pick(locale, '确认删除？此操作不可撤销。', 'Confirm delete? This action cannot be undone.'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/my/${table}?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j.ok) {
        alert(pick(locale, '删除失败：', 'Delete failed: ') + j.error);
        return;
      }
      setRows(rows.filter((r) => r.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const filtered = filter
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()))
    : rows;

  const listCols = fields.filter((f) => !f.hidden).slice(0, 3);
  const hasPublish = fields.some((f) => f.key === 'published_to_main');
  const hasApproval = rows.some((r) => r.approval_status !== undefined);

  return (
    <div>
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">{titleEn}</div>
          <h1 className="font-display-cn text-3xl mt-1">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={pick(locale, '搜索我的内容...', 'Search my content...')}
            className="text-sm bg-transparent border-b border-ink/20 focus:border-gold outline-none py-1 px-2 w-56 transition"
          />
          <button onClick={openNew} disabled={busy} className="btn-primary text-xs">{pick(locale, '+ 新增', '+ New')}</button>
        </div>
      </div>

      {helpText && (
        <div className="text-xs text-muted leading-relaxed mb-6 italic max-w-2xl">
          {helpText}
        </div>
      )}

      <div className="border border-gold/20 bg-parchment/60 backdrop-blur-sm overflow-x-auto card-premium">
        <table className="w-full text-sm">
          <thead className="bg-gold/10 text-left">
            <tr>
              <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep w-12">#</th>
              {listCols.map((f) => (
                <th key={f.key} className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">
                  {f.label}
                </th>
              ))}
              <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '可见', 'Visible')}</th>
              {hasPublish && (
                <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '公开', 'Public')}</th>
              )}
              {hasApproval && (
                <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '审核', 'Review')}</th>
              )}
              <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep w-32 text-right">{pick(locale, '操作', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={listCols.length + (hasPublish ? 4 : 3) + (hasApproval ? 1 : 0)} className="p-16 text-center text-muted text-sm">
                  <div className="text-3xl text-gold/30 mb-3">◈</div>
                  {filter ? pick(locale, '无匹配结果', 'No matching results') : pick(locale, '尚未添加任何内容。点击「+ 新增」开始整理你的卷宗。', 'Nothing added yet. Click "+ New" to start building your records.')}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-gold/10 hover:bg-gold/5 transition">
                  <td className="p-3 font-mono text-muted text-xs">{r.id}</td>
                  {listCols.map((f) => (
                    <td key={f.key} className="p-3 align-top">
                      <CellPreview value={r[f.key]} field={f} extraRefs={extraRefs} locale={locale} />
                    </td>
                  ))}
                  <td className="p-3"><VisBadge v={r.visibility} /></td>
                  {hasPublish && (
                    <td className="p-3">
                      {r.published_to_main && r.visibility === 'public' ? (
                        <span className="text-[10px] text-vintage-green tracking-widest">{pick(locale, '● 主页可见', '● On Homepage')}</span>
                      ) : r.visibility !== 'public' ? (
                        <span className="text-[10px] text-muted tracking-widest">{pick(locale, '— 非公开', '— Not Public')}</span>
                      ) : (
                        <span className="text-[10px] text-muted tracking-widest">{pick(locale, '○ 草稿', '○ Draft')}</span>
                      )}
                    </td>
                  )}
                  {hasApproval && (
                    <td className="p-3">
                      <ApprovalBadge status={r.approval_status} locale={locale} />
                      {r.approval_status === 'rejected' && r.review_note && (
                        <div className="text-[10px] text-vintage-red/80 italic mt-1 max-w-xs leading-relaxed">“{r.review_note}”</div>
                      )}
                    </td>
                  )}
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(r)} className="text-[11px] tracking-widest uppercase text-gold-deep hover:text-gold-bright mr-3">{pick(locale, '编辑', 'Edit')}</button>
                    <button onClick={() => del(r.id)} disabled={busy} className="text-[11px] tracking-widest uppercase text-vintage-red hover:opacity-70">{pick(locale, '删除', 'Delete')}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-muted">
        {pick(locale, '共 ', 'Total ')}<span className="font-display-cn text-base text-ink-soft">{rows.length}</span>{pick(locale, ' 条 我的内容', ' items of my content')}
        {filter && <span>{pick(locale, ` · 当前筛选 ${filtered.length} 条`, ` · ${filtered.length} shown by current filter`)}</span>}
      </div>

      {editing && (
        <EditDrawer
          editing={editing}
          fields={fields}
          extraRefs={extraRefs}
          setEditing={setEditing}
          onSave={save}
          onClose={() => setEditing(null)}
          busy={busy}
          locale={locale}
        />
      )}
    </div>
  );
}

function CellPreview({ value, field, extraRefs, locale = 'en' }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted/50 text-xs">—</span>;
  }
  if (field.type === 'textarea') {
    const s = String(value);
    return <span className="text-xs leading-relaxed">{s.length > 80 ? s.slice(0, 80) + '…' : s}</span>;
  }
  if (field.type === 'select' && field.options) {
    const opt = field.options.find((o) => o.value === value);
    return <span className="text-sm">{opt?.label || value}</span>;
  }
  if (field.key === 'person_id' && extraRefs.people) {
    const p = extraRefs.people.find((x) => x.id === value);
    return <span className="text-sm font-display-cn">{p ? loc(p, 'name', locale) : `#${value}`}</span>;
  }
  if (field.type === 'file' && typeof value === 'string') {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
      return <img src={value} alt="" className="w-12 h-12 object-cover rounded border border-gold/20" />;
    }
    return <span className="text-xs font-mono text-gold-deep">{value.split('/').pop()}</span>;
  }
  return <span className="text-sm">{String(value)}</span>;
}

function VisBadge({ v }) {
  const map = {
    public: { label: 'Public', color: 'text-vintage-green border-vintage-green/30 bg-vintage-green/5' },
    member: { label: 'Family', color: 'text-sepia border-sepia/30 bg-sepia/5' },
    admin: { label: 'Admin', color: 'text-vintage-red border-vintage-red/30 bg-vintage-red/5' },
    private: { label: 'Private', color: 'text-ink/60 border-ink/30 bg-ink/5' },
  };
  const m = map[v] || map.public;
  return (
    <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 border ${m.color}`}>
      {m.label}
    </span>
  );
}

function ApprovalBadge({ status, locale }) {
  const map = {
    approved: { label: pick(locale, '已通过', 'Approved'), icon: '●', color: 'text-vintage-green' },
    pending: { label: pick(locale, '待审核', 'Pending'), icon: '◐', color: 'text-sepia' },
    rejected: { label: pick(locale, '已驳回', 'Rejected'), icon: '○', color: 'text-vintage-red' },
  };
  const m = map[status] || map.approved;
  return (
    <span className={`text-[10px] tracking-widest ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

function EditDrawer({ editing, fields, extraRefs, setEditing, onSave, onClose, busy, locale }) {
  const update = (key, val) => setEditing({ ...editing, [key]: val });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-parchment border-l border-gold/30 overflow-y-auto shadow-2xl" style={{ animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md bg-parchment/95 border-b border-gold/20 px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">{editing._new ? 'Create' : 'Edit'}</div>
            <h2 className="font-display-cn text-xl mt-1">{editing._new ? pick(locale, '新建', 'New') : pick(locale, `编辑 #${editing.id}`, `Edit #${editing.id}`)}</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-muted hover:text-ink transition w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="px-8 py-8 space-y-6">
          {fields.filter((f) => !f.skipEdit).map((f) => (
            <FieldInput key={f.key} field={f} value={editing[f.key]} onChange={(v) => update(f.key, v)} extraRefs={extraRefs} editing={editing} locale={locale} />
          ))}
        </div>

        <div className="sticky bottom-0 backdrop-blur-md bg-parchment/95 border-t border-gold/20 px-8 py-5 flex items-center justify-between">
          <div className="text-xs text-muted">
            {editing.visibility === 'private' && pick(locale, '⚿ 仅你自己可见', '⚿ Visible only to you')}
            {editing.visibility === 'member' && pick(locale, '👨‍👩‍👧 家族成员可见', '👨‍👩‍👧 Visible to family members')}
            {editing.visibility === 'public' && (editing.published_to_main ? pick(locale, '🌐 公开到主页面', '🌐 Public on the homepage') : pick(locale, '○ 公开权限但暂存草稿', '○ Public permission, saved as draft'))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={busy} className="text-xs tracking-widest uppercase px-4 py-2.5 text-muted hover:text-ink transition">{pick(locale, '取消', 'Cancel')}</button>
            <button onClick={onSave} disabled={busy} className="btn-primary text-xs">{busy ? pick(locale, '保存中...', 'Saving...') : pick(locale, '保存', 'Save')}</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

function FieldInput({ field, value, onChange, extraRefs, editing, locale }) {
  const baseClass = "w-full bg-transparent border-b border-ink/15 focus:border-gold outline-none py-2.5 px-1 text-sm transition";

  // 仅当 visibility === 'public' 时才显示 published_to_main 开关
  if (field.key === 'published_to_main') {
    const isPublic = editing.visibility === 'public';
    return (
      <Label field={{ ...field, hint: isPublic ? field.hint : pick(locale, '将「可见性」设为「公开」后才能发布到主页', 'Set "Visibility" to "Public" before publishing to the homepage') }}>
        <label className={`flex items-center gap-3 cursor-pointer ${!isPublic ? 'opacity-40 pointer-events-none' : ''}`}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked ? 1 : 0)}
            disabled={!isPublic}
            className="w-4 h-4 accent-current"
          />
          <span className="text-sm font-display-cn">{pick(locale, '同步显示在家族主页/时间线/档案馆', 'Also show on the family homepage / timeline / archive')}</span>
        </label>
      </Label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <Label field={field}>
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={field.rows || 6}
          className="w-full bg-parchment/50 border border-gold/15 focus:border-gold outline-none p-3 text-sm font-display-cn leading-relaxed resize-y transition" />
      </Label>
    );
  }

  if (field.type === 'select') {
    return (
      <Label field={field}>
        <select value={value || ''} onChange={(e) => onChange(e.target.value || null)} className={baseClass}>
          <option value="">{pick(locale, '— 未选 —', '— None —')}</option>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Label>
    );
  }

  if (field.type === 'person') {
    return (
      <Label field={field}>
        <select value={value || ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={baseClass}>
          <option value="">{pick(locale, '— 未关联 —', '— Not linked —')}</option>
          {(extraRefs.people || []).map((p) => <option key={p.id} value={p.id}>{loc(p, 'name', locale)}</option>)}
        </select>
      </Label>
    );
  }

  if (field.type === 'visibility') {
    return (
      <Label field={field}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {[
            { v: 'private', label: pick(locale, '仅自己', 'Only Me'), en: 'Private', color: 'ink' },
            { v: 'member', label: pick(locale, '家族成员', 'Family'), en: 'Family', color: 'sepia' },
            { v: 'public', label: pick(locale, '公开', 'Public'), en: 'Public', color: 'vintage-green' },
            { v: 'admin', label: pick(locale, '仅管理员', 'Admin Only'), en: 'Admin', color: 'vintage-red' },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => onChange(o.v)}
              className={`px-3 py-3 border text-xs tracking-wider transition ${
                value === o.v ? 'border-gold bg-gold/10 text-gold-deep' : 'border-ink/15 text-muted hover:border-ink/30'
              }`}>
              <div className="font-display-cn">{o.label}</div>
              <div className="text-[9px] uppercase tracking-widest mt-1 opacity-60">{o.en}</div>
            </button>
          ))}
        </div>
      </Label>
    );
  }

  if (field.type === 'evidence') {
    return (
      <Label field={field}>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { v: 'verified', label: pick(locale, '已核实', 'Verified'), en: 'Verified', icon: '●' },
            { v: 'attributed', label: pick(locale, '口述/家族记述', 'Oral / Family Account'), en: 'Attributed', icon: '◆' },
            { v: 'inferred', label: pick(locale, '推断', 'Inferred'), en: 'Inferred', icon: '◇' },
            { v: 'unresolved', label: pick(locale, '待解决', 'Unresolved'), en: 'Unresolved', icon: '?' },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => onChange(o.v)}
              className={`px-3 py-2.5 border text-xs tracking-wider transition text-left ${
                value === o.v ? 'border-gold bg-gold/10 text-gold-deep' : 'border-ink/15 text-muted hover:border-ink/30'
              }`}>
              <span className="mr-1">{o.icon}</span>
              <span className="font-display-cn">{o.label}</span>
              <div className="text-[9px] uppercase tracking-widest mt-0.5 opacity-60">{o.en}</div>
            </button>
          ))}
        </div>
      </Label>
    );
  }

  if (field.type === 'file') {
    return (
      <Label field={field}>
        <FileUploadField value={value} onChange={onChange} accept={field.accept} locale={locale} />
      </Label>
    );
  }

  if (field.type === 'number') {
    return (
      <Label field={field}>
        <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className={baseClass} placeholder={field.placeholder} />
      </Label>
    );
  }

  return (
    <Label field={field}>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} placeholder={field.placeholder} />
    </Label>
  );
}

function Label({ field, children }) {
  return (
    <div>
      <label className="block text-xs mb-2">
        <span className="font-display-cn text-ink-soft">{field.label}</span>
        {field.en && <span className="text-[10px] tracking-[0.3em] uppercase text-gold-deep ml-3">{field.en}</span>}
        {field.required && <span className="text-vintage-red ml-2">*</span>}
        {field.hint && <span className="text-muted text-[10px] ml-2 italic">{field.hint}</span>}
      </label>
      {children}
    </div>
  );
}

function FileUploadField({ value, onChange, accept, locale }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.ok) onChange(j.url);
      else alert(pick(locale, '上传失败：', 'Upload failed: ') + j.error);
    } catch (e) {
      alert(pick(locale, '上传失败：', 'Upload failed: ') + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <input ref={inputRef} type="file" accept={accept} onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="text-xs tracking-widest uppercase px-4 py-2 border border-gold/30 text-gold-deep hover:bg-gold/5 transition">
          {uploading ? pick(locale, '上传中...', 'Uploading...') : value ? pick(locale, '替换文件', 'Replace File') : pick(locale, '选择文件', 'Choose File')}
        </button>
        {value && <button type="button" onClick={() => onChange('')} className="text-xs text-vintage-red hover:opacity-70 tracking-widest uppercase">{pick(locale, '移除', 'Remove')}</button>}
      </div>
      {value && (
        <div className="mt-3 flex items-center gap-3">
          {/\.(jpg|jpeg|png|gif|webp)$/i.test(value) ? (
            <img src={value} alt="" className="w-20 h-20 object-cover rounded border border-gold/20" />
          ) : (
            <div className="text-xs text-muted font-mono break-all">{value}</div>
          )}
          <a href={value} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4 text-muted">{pick(locale, '查看 →', 'View →')}</a>
        </div>
      )}
    </div>
  );
}
