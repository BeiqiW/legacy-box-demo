'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pick, loc } from '@/lib/i18n';

/**
 * 通用 CRUD 管理器
 *
 * @param {string} table - 表名 (people / timeline_events / archive_items / oral_histories / users)
 * @param {array} rows - 当前数据
 * @param {array} fields - 字段配置：[{ key, label, en, type, options?, span?, required?, hidden? }]
 *   type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'date' | 'visibility' | 'evidence'
 * @param {array} extraRefs - 额外的引用数据（如人物列表用于 person_id 下拉）
 * @param {string} title - 中文标题
 * @param {string} titleEn - 英文标题
 */
export default function AdminTable({ table, rows: initialRows, fields, title, titleEn, extraRefs = {}, showOwner = false, showLocation = null, locale: localeProp }) {
  const router = useRouter();
  const locale = localeProp || ((typeof document !== 'undefined' && document.cookie.includes('lang=zh')) ? 'zh' : 'en');
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState(null); // { id, ...row } 或 { _new: true }
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');

  function openNew() {
    const empty = { _new: true };
    fields.forEach((f) => {
      if (f.type === 'visibility') empty[f.key] = 'public';
      else if (f.type === 'evidence') empty[f.key] = 'verified';
      else if (f.key === 'published_to_main') empty[f.key] = 1; // 管理员新增默认发布
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
      const res = await fetch(`/api/admin/${table}`, {
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
    if (!confirm(pick(locale, '确认删除？此操作不可撤销。', 'Delete this record? This action cannot be undone.'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/${table}?id=${id}`, { method: 'DELETE' });
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
    ? rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(filter.toLowerCase())
      )
    : rows;

  // 列表列：所有 fields 中 hidden!==true 的取前 4 个
  const listCols = fields.filter((f) => !f.hidden).slice(0, 4);
  const hasVisibility = fields.some((f) => f.type === 'visibility');
  const hasPublish = fields.some((f) => f.key === 'published_to_main');

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">{titleEn}</div>
          <h1 className="font-display-cn text-3xl mt-1">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={pick(locale, '搜索...', 'Search...')}
            className="text-sm bg-transparent border-b border-ink/20 focus:border-gold outline-none py-1 px-2 w-48 transition"
          />
          <button
            onClick={openNew}
            disabled={busy}
            className="btn-primary text-xs"
          >
            {pick(locale, '+ 新增', '+ Add')}
          </button>
        </div>
      </div>

      {/* 表格 */}
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
              {hasVisibility && (
                <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '可见', 'Visibility')}</th>
              )}
              {showOwner && (
                <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '贡献者', 'Contributor')}</th>
              )}
              {showLocation && (
                <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '展示位置', 'Appears In')}</th>
              )}
              <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep w-32 text-right">{pick(locale, '操作', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={listCols.length + (hasVisibility ? 3 : 2) + (showOwner ? 1 : 0) + (showLocation ? 1 : 0)} className="p-12 text-center text-muted text-sm">
                  {filter ? pick(locale, '无匹配结果', 'No matching results') : pick(locale, '尚无数据，点击「+ 新增」开始', 'No data yet — click “+ Add” to start')}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-gold/10 hover:bg-gold/5 transition">
                  <td className="p-3 font-mono text-muted text-xs">{r.id}</td>
                  {listCols.map((f) => (
                    <td key={f.key} className="p-3 align-top">
                      <CellPreview value={r[f.key]} row={r} field={f} extraRefs={extraRefs} locale={locale} />
                    </td>
                  ))}
                  {hasVisibility && (
                    <td className="p-3">
                      <VisBadge v={r.visibility} locale={locale} />
                    </td>
                  )}
                  {showOwner && (
                    <td className="p-3">
                      <OwnerBadge row={r} locale={locale} />
                    </td>
                  )}
                  {showLocation && (
                    <td className="p-3">
                      <LocationHint row={r} kind={showLocation} extraRefs={extraRefs} locale={locale} />
                    </td>
                  )}
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-[11px] tracking-widest uppercase text-gold-deep hover:text-gold-bright mr-3"
                    >
                      {pick(locale, '编辑', 'Edit')}
                    </button>
                    <button
                      onClick={() => del(r.id)}
                      disabled={busy}
                      className="text-[11px] tracking-widest uppercase text-vintage-red hover:opacity-70"
                    >
                      {pick(locale, '删除', 'Delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-muted">
        {pick(locale, '共 ', 'Total ')}<span className="font-display-cn text-base text-ink-soft">{rows.length}</span>{pick(locale, ' 条记录', ' records')}
        {filter && <span> · {pick(locale, '当前筛选 ' + filtered.length + ' 条', 'filtered ' + filtered.length)}</span>}
      </div>

      {/* 编辑抽屉 */}
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

function CellPreview({ value, row, field, extraRefs, locale }) {
  // For translatable DB fields (those with an `_en` column present on the row),
  // prefer the localized value.
  if (row && field && (field.key + '_en') in row) {
    value = loc(row, field.key, locale);
  }
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted/50 text-xs">—</span>;
  }
  if (field.type === 'textarea') {
    const s = String(value);
    return <span className="text-xs leading-relaxed line-clamp-2">{s.length > 80 ? s.slice(0, 80) + '…' : s}</span>;
  }
  if (field.type === 'select' && field.options) {
    const opt = field.options.find((o) => o.value === value);
    return <span className="text-sm">{opt?.label || value}</span>;
  }
  if (field.key === 'person_id' && extraRefs.people) {
    const p = extraRefs.people.find((x) => x.id === value);
    return <span className="text-sm font-display-cn">{p ? loc(p, 'name', locale) : `#${value}`}</span>;
  }
  if (field.type === 'evidence') {
    return <EvidenceBadge v={value} />;
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
  };
  const m = map[v] || map.public;
  return (
    <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 border ${m.color}`}>
      {m.label}
    </span>
  );
}

function EvidenceBadge({ v }) {
  const map = {
    verified: { icon: '●', label: 'Verified', color: 'text-vintage-green' },
    attributed: { icon: '◆', label: 'Attributed', color: 'text-sepia' },
    inferred: { icon: '◇', label: 'Inferred', color: 'text-muted' },
    unresolved: { icon: '?', label: 'Unresolved', color: 'text-vintage-red' },
  };
  const m = map[v] || map.attributed;
  return (
    <span className={`text-[11px] tracking-wider ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

function EditDrawer({ editing, fields, extraRefs, setEditing, onSave, onClose, busy, locale }) {
  const update = (key, val) => setEditing({ ...editing, [key]: val });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl h-full bg-parchment border-l border-gold/30 overflow-y-auto shadow-2xl"
        style={{ animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="sticky top-0 z-10 backdrop-blur-md bg-parchment/95 border-b border-gold/20 px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">
              {editing._new ? 'Create' : 'Edit'}
            </div>
            <h2 className="font-display-cn text-xl mt-1">
              {editing._new ? pick(locale, '新建记录', 'New Record') : pick(locale, `编辑 #${editing.id}`, `Edit #${editing.id}`)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-muted hover:text-ink transition w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-8 space-y-6">
          {fields.filter((f) => !f.skipEdit).map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              value={editing[f.key]}
              onChange={(v) => update(f.key, v)}
              extraRefs={extraRefs}
              locale={locale}
            />
          ))}
        </div>

        <div className="sticky bottom-0 backdrop-blur-md bg-parchment/95 border-t border-gold/20 px-8 py-5 flex items-center justify-between">
          <div className="text-xs text-muted">
            {editing._new ? pick(locale, '填写完成后保存', 'Save when done') : pick(locale, `修改后会立即生效`, 'Changes take effect immediately')}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={busy}
              className="text-xs tracking-widest uppercase px-4 py-2.5 text-muted hover:text-ink transition"
            >
              {pick(locale, '取消', 'Cancel')}
            </button>
            <button
              onClick={onSave}
              disabled={busy}
              className="btn-primary text-xs"
            >
              {busy ? pick(locale, '保存中...', 'Saving...') : pick(locale, '保存', 'Save')}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function FieldInput({ field, value, onChange, extraRefs, locale }) {
  const baseClass = "w-full bg-transparent border-b border-ink/15 focus:border-gold outline-none py-2.5 px-1 text-sm transition";

  if (field.type === 'textarea') {
    return (
      <Label field={field}>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 6}
          className="w-full bg-parchment/50 border border-gold/15 focus:border-gold outline-none p-3 text-sm font-display-cn leading-relaxed resize-y transition"
        />
      </Label>
    );
  }

  if (field.type === 'select') {
    return (
      <Label field={field}>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={baseClass}
        >
          <option value="">{pick(locale, '— 未选 —', '— None —')}</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Label>
    );
  }

  if (field.type === 'person') {
    return (
      <Label field={field}>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className={baseClass}
        >
          <option value="">{pick(locale, '— 未关联 —', '— Not linked —')}</option>
          {(extraRefs.people || []).map((p) => (
            <option key={p.id} value={p.id}>{loc(p, 'name', locale)}</option>
          ))}
        </select>
      </Label>
    );
  }

  if (field.type === 'visibility') {
    return (
      <Label field={field}>
        <div className="flex gap-2 mt-2">
          {[
            { v: 'public', label: pick(locale, '公开', 'Public'), en: 'Public', color: 'vintage-green' },
            { v: 'member', label: pick(locale, '家族', 'Family'), en: 'Family', color: 'sepia' },
            { v: 'admin', label: pick(locale, '管理员', 'Admin'), en: 'Admin', color: 'vintage-red' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`flex-1 px-4 py-3 border text-xs tracking-wider transition ${
                value === o.v
                  ? 'border-gold bg-gold/10 text-gold-deep'
                  : 'border-ink/15 text-muted hover:border-ink/30'
              }`}
            >
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
            { v: 'attributed', label: pick(locale, '有出处口述', 'Attributed'), en: 'Attributed', icon: '◆' },
            { v: 'inferred', label: pick(locale, '推断', 'Inferred'), en: 'Inferred', icon: '◇' },
            { v: 'unresolved', label: pick(locale, '待解决', 'Unresolved'), en: 'Unresolved', icon: '?' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`px-3 py-2.5 border text-xs tracking-wider transition text-left ${
                value === o.v
                  ? 'border-gold bg-gold/10 text-gold-deep'
                  : 'border-ink/15 text-muted hover:border-ink/30'
              }`}
            >
              <span className="mr-1">{o.icon}</span>
              <span className="font-display-cn">{o.label}</span>
              <div className="text-[9px] uppercase tracking-widest mt-0.5 opacity-60">{o.en}</div>
            </button>
          ))}
        </div>
      </Label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <Label field={field}>
        <label className="flex items-center gap-3 cursor-pointer mt-1 p-3 border border-ink/15 hover:border-gold/40 transition">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked ? 1 : 0)}
            className="w-4 h-4 accent-gold"
          />
          <span className="text-sm">{value ? pick(locale, '● 已发布到公开页面', '● Published to public pages') : pick(locale, '○ 未发布（仅档案库内部可见）', '○ Not published (visible only inside the archive)')}</span>
        </label>
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
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={baseClass}
          placeholder={field.placeholder}
        />
      </Label>
    );
  }

  if (field.type === 'password') {
    return (
      <Label field={field}>
        <input
          type="password"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder={field.placeholder}
          autoComplete="new-password"
        />
      </Label>
    );
  }

  return (
    <Label field={field}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
        placeholder={field.placeholder}
      />
    </Label>
  );
}

function Label({ field, children }) {
  return (
    <div>
      <label className="block text-xs mb-2">
        <span className="font-display-cn text-ink-soft">{field.label}</span>
        {field.en && (
          <span className="text-[10px] tracking-[0.3em] uppercase text-gold-deep ml-3">{field.en}</span>
        )}
        {field.required && <span className="text-vintage-red ml-2">*</span>}
        {field.hint && (
          <span className="text-muted text-[10px] ml-2 italic">{field.hint}</span>
        )}
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
      if (j.ok) {
        onChange(j.url);
      } else {
        alert(pick(locale, '上传失败：', 'Upload failed: ') + j.error);
      }
    } catch (e) {
      alert(pick(locale, '上传失败：', 'Upload failed: ') + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs tracking-widest uppercase px-4 py-2 border border-gold/30 text-gold-deep hover:bg-gold/5 transition"
        >
          {uploading ? pick(locale, '上传中...', 'Uploading...') : value ? pick(locale, '替换文件', 'Replace File') : pick(locale, '选择文件', 'Choose File')}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-vintage-red hover:opacity-70 tracking-widest uppercase"
          >
            {pick(locale, '移除', 'Remove')}
          </button>
        )}
      </div>
      {value && (
        <div className="mt-3 flex items-center gap-3">
          {/\.(jpg|jpeg|png|gif|webp)$/i.test(value) ? (
            <img src={value} alt="" className="w-20 h-20 object-cover rounded border border-gold/20" />
          ) : (
            <div className="text-xs text-muted font-mono break-all">{value}</div>
          )}
          <div className="text-xs text-muted">
            <div className="text-[10px] uppercase tracking-widest text-gold-deep">Current</div>
            <a href={value} target="_blank" rel="noreferrer" className="underline underline-offset-4">{pick(locale, '查看原件 →', 'View source →')}</a>
          </div>
        </div>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-ink/10 focus:border-gold outline-none py-1.5 px-1 text-xs text-muted font-mono mt-3 transition"
        placeholder={pick(locale, '或粘贴 URL', 'Or paste a URL')}
      />
    </div>
  );
}

function OwnerBadge({ row, locale }) {
  if (row.owner_user_id === null || row.owner_user_id === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-2 py-1 border border-gold/40 text-gold-deep bg-gold/5">
        <span>◈</span>
        <span>{pick(locale, '官方', 'Official')}</span>
      </span>
    );
  }
  return (
    <div className="text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-sepia">✎</span>
        <span className="font-display-cn text-sm">{row.owner_name || pick(locale, '(未知)', '(unknown)')}</span>
      </div>
      {row.owner_username && (
        <div className="text-[10px] text-muted font-mono mt-0.5">@{row.owner_username}</div>
      )}
    </div>
  );
}

function LocationHint({ row, kind, extraRefs, locale }) {
  // 根据 visibility / published_to_main / owner / approval_status 计算这条会出现在哪些公开页面
  const locations = [];
  const isOfficial = !row.owner_user_id;
  const isPublic = row.visibility === 'public';
  const isMember = row.visibility === 'member';
  const isPrivate = row.visibility === 'private';
  const isAdminOnly = row.visibility === 'admin';
  const published = !!row.published_to_main;
  const approved = row.approval_status === undefined || row.approval_status === 'approved';

  const ownerName = row.owner_name || row.owner_username || pick(locale, '该成员', 'this member');
  const personLink = row.person_id && extraRefs.people
    ? extraRefs.people.find((p) => p.id === row.person_id)
    : null;

  // 私密内容
  if (isPrivate) {
    locations.push({ where: pick(locale, `${ownerName} 的「我的档案」`, `${ownerName}’s “My Records”`), scope: 'private', detail: pick(locale, '仅本人可见', 'Visible only to the owner') });
    return <LocList items={locations} />;
  }

  // 管理员可见
  if (isAdminOnly) {
    locations.push({ where: pick(locale, '仅管理员可见', 'Admin only'), scope: 'admin', detail: pick(locale, '不在任何公开页面显示', 'Not shown on any public page') });
    return <LocList items={locations} />;
  }

  // 已发布到主页 / 官方档案
  if (isOfficial || published) {
    if (kind === 'archive') {
      if (isPublic) locations.push({ where: pick(locale, '/archive 公开档案馆', '/archive Public Archive'), scope: 'public' });
      else if (isMember) locations.push({ where: pick(locale, '/archive 公开档案馆（家族登录后）', '/archive Public Archive (after family login)'), scope: 'member' });
    } else if (kind === 'timeline') {
      if (!approved && !isOfficial) {
        locations.push({ where: pick(locale, '⏳ 待审核', '⏳ Pending review'), scope: 'pending', detail: pick(locale, '通过审核后才发布', 'Published only after approval') });
      } else if (isPublic) {
        locations.push({ where: pick(locale, '/timeline 公开时间线', '/timeline Public Timeline'), scope: 'public' });
      } else if (isMember) {
        locations.push({ where: pick(locale, '/timeline 时间线（家族登录后）', '/timeline Timeline (after family login)'), scope: 'member' });
      }
    } else if (kind === 'oral') {
      if (isPublic) locations.push({ where: pick(locale, '/oral-history 口述', '/oral-history Oral History'), scope: 'public' });
      else if (isMember) locations.push({ where: pick(locale, '/oral-history（家族登录后）', '/oral-history (after family login)'), scope: 'member' });
    } else if (kind === 'people') {
      if (isPublic) locations.push({ where: pick(locale, '/people 人物志', '/people People'), scope: 'public' });
      else if (isMember) locations.push({ where: pick(locale, '/people（家族登录后）', '/people (after family login)'), scope: 'member' });
    }

    if (personLink) {
      locations.push({ where: pick(locale, `/people/${personLink.id} 「${personLink.name}」详情页`, `/people/${personLink.id} “${personLink.name}” detail page`), scope: 'person' });
    }
  } else if (!published && row.owner_user_id) {
    // 家族成员创建但未发布
    if (kind === 'archive') {
      locations.push({ where: pick(locale, `${ownerName} 的「我的档案」`, `${ownerName}’s “My Records”`), scope: 'unpublished', detail: pick(locale, '未发布到家族档案库', 'Not published to the family archive') });
    } else {
      locations.push({ where: pick(locale, `${ownerName} 的草稿`, `${ownerName}’s draft`), scope: 'unpublished', detail: pick(locale, '未发布', 'Unpublished') });
    }
  }

  if (locations.length === 0) {
    locations.push({ where: pick(locale, '未公开', 'Not public'), scope: 'none' });
  }

  return <LocList items={locations} />;
}

function LocList({ items }) {
  const scopeColor = {
    public: 'text-vintage-green',
    member: 'text-sepia',
    person: 'text-gold-deep',
    private: 'text-ink/60',
    admin: 'text-vintage-red',
    pending: 'text-sepia',
    unpublished: 'text-muted',
    none: 'text-muted/60',
  };
  return (
    <div className="space-y-1 text-[11px] leading-tight max-w-xs">
      {items.map((it, i) => (
        <div key={i}>
          <div className={`${scopeColor[it.scope] || 'text-ink-soft'}`}>
            <span className="mr-1">→</span>
            <span>{it.where}</span>
          </div>
          {it.detail && (
            <div className="text-[10px] text-muted italic ml-3">{it.detail}</div>
          )}
        </div>
      ))}
    </div>
  );
}
