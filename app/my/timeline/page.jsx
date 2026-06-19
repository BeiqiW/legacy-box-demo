import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import MyLayout from '@/components/MyLayout';
import MyTable from '@/components/MyTable';
import { getLocale, pick } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function MyTimeline() {
  const locale = getLocale();
  const user = await getCurrentUser();
  if (user.role === 'guest') return <MyLayout current="/my/timeline" />;

  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM timeline_events WHERE owner_user_id = ? ORDER BY year ASC, month ASC, day ASC'
  ).all(user.id);
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'year', label: pick(locale, '年份', 'Year'), en: 'Year', type: 'number', required: true, placeholder: pick(locale, '如：1992', 'e.g. 1992') },
    { key: 'title', label: pick(locale, '家族事件', 'Event'), en: 'Event', type: 'text', required: true, placeholder: pick(locale, '如：祖父参加西南联大同学会', 'e.g. Grandfather attended the National Southwestern Associated University reunion') },
    { key: 'month', label: pick(locale, '月', 'Month'), en: 'Month', type: 'number', placeholder: pick(locale, '1-12，可空', '1-12, optional') },
    { key: 'day', label: pick(locale, '日', 'Day'), en: 'Day', type: 'number', placeholder: pick(locale, '可空', 'Optional') },
    { key: 'description', label: pick(locale, '详述', 'Description'), en: 'Description', type: 'textarea', rows: 5 },
    { key: 'person_id', label: pick(locale, '关联人物', 'Related Person'), en: 'Related Person', type: 'person', hint: pick(locale, '可空', 'Optional') },
    { key: 'evidence_status', label: pick(locale, '证据状态', 'Evidence'), en: 'Evidence', type: 'evidence', required: true,
      hint: pick(locale, '坦诚标注：是亲耳听到的口述，还是有文件支撑', 'Be honest: is this an oral account you heard, or is it supported by documents?') },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true },
    { key: 'published_to_main', label: pick(locale, '加入家族时间线', 'Add to Family Timeline'), en: 'Publish', type: 'checkbox',
      hint: pick(locale, '勾选后这条事件会出现在所有访客可见的家族时间线上', 'Once checked, this event will appear on the family timeline visible to all visitors') },
  ];

  return (
    <MyLayout current="/my/timeline">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-[10px] tracking-[0.5em] text-sepia uppercase">Family Timeline · {pick(locale, '家族共享', 'Family Shared')}</div>
          <span className="text-sepia text-sm">{pick(locale, '◐ 需管理员审核', '◐ Needs admin review')}</span>
        </div>
        <h1 className="font-display-cn text-3xl">{pick(locale, '家族时间线', 'Family Timeline')}</h1>
        <div className="mt-4 p-4 border-l-2 border-sepia/40 bg-sepia/5 text-xs text-ink-soft leading-relaxed">
          <div className="font-display-cn text-sm text-sepia mb-1.5">{pick(locale, '↳ 这是关于整个家族的大事件', '↳ These are major events about the whole family')}</div>
          {pick(locale,
            <>想记录自己的人生节点？请去
            <a href="/my/milestones" className="mx-1 text-gold-deep underline underline-offset-4">「我的生平时刻」</a>
            ，那里不需要审核，你自己说了算。</>,
            <>Want to record your own life milestones? Head to
            <a href="/my/milestones" className="mx-1 text-gold-deep underline underline-offset-4">"My Milestones"</a>
            — no review there, you are in charge.</>
          )}
          <br />
          <span className="text-muted">{pick(locale, '家族时间线提交后会进入审核队列，由档案管理员核实后才会出现在公开时间线上。', 'Once submitted, family timeline entries enter a review queue and appear on the public timeline only after the archivist verifies them.')}</span>
        </div>
      </div>

      <MyTable
        table="timeline_events"
        rows={rows}
        fields={fields}
        title=""
        titleEn=""
        extraRefs={{ people }}
        currentUserId={user.id}
        helpText={pick(locale, '把你记得的、听说的家族事件记下来。请如实标注证据状态 —— 是已核实，还是某位长辈的口述？真实比戏剧化更重要。', 'Write down the family events you remember or have heard about. Please mark the evidence status honestly — is it verified, or an elder\'s oral account? Truth matters more than drama.')}
      />
    </MyLayout>
  );
}
