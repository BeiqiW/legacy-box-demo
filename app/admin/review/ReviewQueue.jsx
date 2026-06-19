'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pick, loc } from '@/lib/i18n';

export default function ReviewQueue({ pending: initialPending, recent, locale: localeProp }) {
  const router = useRouter();
  const locale = localeProp || ((typeof document !== 'undefined' && document.cookie.includes('lang=zh')) ? 'zh' : 'en');
  const [pending, setPending] = useState(initialPending);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(null); // {id} 显示驳回输入框

  async function act(id, action, note) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note }),
      });
      const j = await res.json();
      if (!j.ok) {
        alert(pick(locale, '操作失败：', 'Action failed: ') + j.error);
        return;
      }
      setPending(pending.filter((p) => p.id !== id));
      setRejecting(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Editorial Review</div>
        <h1 className="font-display-cn text-3xl mt-1">{pick(locale, '家族时间线审核', 'Family Timeline Review')}</h1>
        <p className="text-xs text-muted mt-3 leading-relaxed max-w-2xl">
          {pick(locale,
            '家族成员提交的时间线事件，需在这里通过审核才会出现在公开/家族时间线上。审核标准建议：事件年份与已有材料一致、证据状态如实、措辞克制、未涉及隐私敏感内容。',
            'Timeline events submitted by family members must be approved here before they appear on the public/family timeline. Review guidance: the year should match existing material, the evidence status should be accurate, the wording should be measured, and no privacy-sensitive content should be involved.')}
        </p>
      </div>

      {/* 待审核 */}
      <section className="mb-16">
        <div className="flex items-baseline gap-4 mb-6">
          <span className="font-display text-3xl text-gold-gradient">01</span>
          <h2 className="font-display-cn text-2xl">{pick(locale, '待审核', 'Pending Review')}</h2>
          <span className="text-sm text-sepia">· {pending.length} {pick(locale, '项', 'items')}</span>
          <div className="gold-line flex-1"></div>
        </div>

        {pending.length === 0 ? (
          <div className="border border-gold/20 bg-parchment/50 p-16 text-center text-muted">
            <div className="text-3xl text-gold/30 mb-3">◈</div>
            <div className="text-sm">{pick(locale, '当前没有待审核的家族提交', 'No family submissions awaiting review')}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((e) => (
              <div key={e.id} className="border border-sepia/30 bg-sepia/5 card-premium p-6">
                <div className="flex items-baseline gap-4 mb-3 flex-wrap">
                  <span className="font-mono text-2xl text-gold-deep tabular-nums">
                    {e.year}
                    {e.month && <span className="text-sm">.{String(e.month).padStart(2, '0')}</span>}
                    {e.day && <span className="text-sm">.{String(e.day).padStart(2, '0')}</span>}
                  </span>
                  <h3 className="font-display-cn text-xl flex-1">{loc(e, 'title', locale)}</h3>
                  <span className="text-[10px] tracking-widest text-sepia">{pick(locale, '◐ 待审核', '◐ Pending')}</span>
                </div>

                {loc(e, 'description', locale) && (
                  <p className="text-sm text-ink-soft leading-loose mb-4 whitespace-pre-wrap">
                    {loc(e, 'description', locale)}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-5 border-t border-gold/15 pt-4">
                  <Field label={pick(locale, '提交人', 'Submitted by')} value={`${e.owner_name || pick(locale, '(未知)', '(unknown)')} · ${e.owner_username || ''}`} />
                  <Field label={pick(locale, '关联人物', 'Related person')} value={e.person_name || '—'} />
                  <Field label={pick(locale, '证据状态', 'Evidence')} value={evidenceLabel(e.evidence_status, locale)} />
                  <Field label={pick(locale, '可见性', 'Visibility')} value={visLabel(e.visibility, locale)} />
                  <Field label={pick(locale, '提交时间', 'Submitted at')} value={fmtDate(e.created_at)} />
                  <Field label={pick(locale, '希望发布到主页', 'Publish to main')} value={e.published_to_main ? pick(locale, '是', 'Yes') : pick(locale, '否（草稿）', 'No (draft)')} />
                </div>

                {rejecting && rejecting.id === e.id ? (
                  <RejectForm
                    onCancel={() => setRejecting(null)}
                    onSubmit={(note) => act(e.id, 'reject', note)}
                    busy={busy}
                    locale={locale}
                  />
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => act(e.id, 'approve')}
                      disabled={busy}
                      className="btn-primary text-xs"
                    >
                      {pick(locale, '✓ 通过审核', '✓ Approve')}
                    </button>
                    <button
                      onClick={() => setRejecting({ id: e.id })}
                      disabled={busy}
                      className="text-xs tracking-widest uppercase px-4 py-2.5 border border-vintage-red/30 text-vintage-red hover:bg-vintage-red/5 transition"
                    >
                      {pick(locale, '驳回 · 附说明', 'Reject · with note')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 最近审核历史 */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="font-display text-3xl text-gold-gradient">02</span>
            <h2 className="font-display-cn text-2xl">{pick(locale, '最近审核', 'Recent Reviews')}</h2>
            <div className="gold-line flex-1"></div>
          </div>
          <div className="border border-gold/20 bg-parchment/60 backdrop-blur-sm overflow-x-auto card-premium">
            <table className="w-full text-sm">
              <thead className="bg-gold/10 text-left">
                <tr>
                  <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '事件', 'Event')}</th>
                  <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '提交人', 'Submitted by')}</th>
                  <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '状态', 'Status')}</th>
                  <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '审核人', 'Reviewer')}</th>
                  <th className="p-3 text-[10px] tracking-widest uppercase text-gold-deep">{pick(locale, '时间', 'Time')}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-gold/10">
                    <td className="p-3">
                      <span className="font-mono text-gold-deep mr-2">{r.year}</span>
                      <span className="font-display-cn">{loc(r, 'title', locale)}</span>
                    </td>
                    <td className="p-3 text-muted">{r.owner_name}</td>
                    <td className="p-3">
                      {r.approval_status === 'approved' ? (
                        <span className="text-vintage-green text-xs tracking-widest">{pick(locale, '● 已通过', '● Approved')}</span>
                      ) : (
                        <span className="text-vintage-red text-xs tracking-widest">{pick(locale, '○ 已驳回', '○ Rejected')}</span>
                      )}
                      {r.review_note && (
                        <div className="text-[11px] text-muted italic mt-1">"{r.review_note}"</div>
                      )}
                    </td>
                    <td className="p-3 text-muted">{r.reviewer_name || '—'}</td>
                    <td className="p-3 text-muted text-[11px]">{fmtDate(r.reviewed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.3em] uppercase text-gold-deep mb-1">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function RejectForm({ onCancel, onSubmit, busy, locale }) {
  const [note, setNote] = useState('');
  return (
    <div className="border-t border-vintage-red/20 pt-4">
      <label className="text-[10px] tracking-widest uppercase text-vintage-red mb-2 block">
        {pick(locale, '驳回说明（将反馈给提交人）', 'Rejection note (sent back to the submitter)')}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full bg-parchment border border-vintage-red/20 focus:border-vintage-red outline-none p-3 text-sm font-display-cn resize-y"
        placeholder={pick(locale, '例如：年份与档案 #142 信件中的记录不一致，请核实。', 'e.g. The year does not match the letter in archive #142, please verify.')}
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => onSubmit(note)}
          disabled={busy || !note.trim()}
          className="text-xs tracking-widest uppercase px-4 py-2.5 border border-vintage-red text-vintage-red hover:bg-vintage-red hover:text-parchment transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pick(locale, '确认驳回', 'Confirm Reject')}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="text-xs tracking-widest uppercase px-4 py-2.5 text-muted hover:text-ink transition"
        >
          {pick(locale, '取消', 'Cancel')}
        </button>
      </div>
    </div>
  );
}

function evidenceLabel(s, locale) {
  const zh = { verified: '● 已核实', attributed: '◆ 口述', inferred: '◇ 推断', unresolved: '? 待解决' };
  const en = { verified: '● Verified', attributed: '◆ Attributed', inferred: '◇ Inferred', unresolved: '? Unresolved' };
  return (locale === 'en' ? en : zh)[s] || s;
}
function visLabel(s, locale) {
  const zh = { public: 'Public 公开', member: 'Family 家族', admin: 'Admin 管理员', private: 'Private 私密' };
  const en = { public: 'Public', member: 'Family', admin: 'Admin', private: 'Private' };
  return (locale === 'en' ? en : zh)[s] || s;
}
function fmtDate(s) {
  if (!s) return '';
  return s.replace('T', ' ').slice(0, 16);
}
