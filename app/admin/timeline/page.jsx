import { getDb } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default function AdminTimeline() {
  const locale = getLocale();
  const db = getDb();
  const rows = db.prepare(`
    SELECT t.*, u.username AS owner_username, u.display_name AS owner_name,
           p.name AS person_name
    FROM timeline_events t
    LEFT JOIN users u ON u.id = t.owner_user_id
    LEFT JOIN people p ON p.id = t.person_id
    ORDER BY year ASC, month ASC, day ASC
  `).all();
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'year', label: pick(locale, '年份', 'Year'), en: 'Year', type: 'number', required: true, placeholder: pick(locale, '如：1937', 'e.g. 1937') },
    { key: 'title', label: pick(locale, '事件', 'Title'), en: 'Title', type: 'text', required: true, placeholder: pick(locale, '如：淞沪会战爆发，家族决定西迁', 'e.g. Battle of Shanghai begins; the family decides to move west') },
    { key: 'month', label: pick(locale, '月', 'Month'), en: 'Month', type: 'number', placeholder: pick(locale, '1-12，可空', '1-12, optional') },
    { key: 'day', label: pick(locale, '日', 'Day'), en: 'Day', type: 'number', placeholder: pick(locale, '1-31，可空', '1-31, optional') },
    { key: 'description', label: pick(locale, '事件描述', 'Description'), en: 'Description', type: 'textarea', rows: 4 },
    { key: 'person_id', label: pick(locale, '关联人物', 'Related Person'), en: 'Related Person', type: 'person', hint: pick(locale, '可空', 'Optional') },
    { key: 'evidence_status', label: pick(locale, '证据状态', 'Evidence'), en: 'Evidence', type: 'evidence', required: true },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true },
  ];

  return (
    <AdminLayout current="/admin/timeline">
      <AdminTable
        table="timeline_events"
        rows={rows}
        fields={fields}
        title={pick(locale, '时间线事件管理', 'Timeline')}
        titleEn="Timeline"
        extraRefs={{ people }}
        showOwner
        showLocation="timeline"
        locale={locale}
      />
    </AdminLayout>
  );
}
