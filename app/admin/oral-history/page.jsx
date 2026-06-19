import { getDb } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default function AdminOral() {
  const locale = getLocale();
  const db = getDb();
  const rows = db.prepare(`
    SELECT o.*, u.username AS owner_username, u.display_name AS owner_name,
           p.name AS person_name
    FROM oral_histories o
    LEFT JOIN users u ON u.id = o.owner_user_id
    LEFT JOIN people p ON p.id = o.person_id
    ORDER BY CASE WHEN recorded_date IS NULL THEN 1 ELSE 0 END, recorded_date DESC, o.id DESC
  `).all();
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'title', label: pick(locale, '访谈标题', 'Title'), en: 'Title', type: 'text', required: true, placeholder: pick(locale, '如：祖父谈西南联大岁月', 'e.g. Grandfather on the years at the National Southwestern Associated University') },
    { key: 'speaker', label: pick(locale, '讲述人', 'Speaker'), en: 'Speaker', type: 'text', placeholder: pick(locale, '如：陈守仁', 'e.g. Chen Shouren') },
    { key: 'recorded_date', label: pick(locale, '录制日期', 'Recorded'), en: 'Recorded', type: 'text', placeholder: pick(locale, '如：2005-06-12', 'e.g. 2005-06-12') },
    { key: 'duration_minutes', label: pick(locale, '时长（分钟）', 'Duration'), en: 'Duration', type: 'number', placeholder: pick(locale, '如：47', 'e.g. 47') },
    { key: 'transcript', label: pick(locale, '转录文本', 'Transcript'), en: 'Transcript', type: 'textarea', rows: 10, hint: pick(locale, '可粘贴完整或精选片段', 'Paste the full transcript or selected excerpts') },
    { key: 'audio_url', label: pick(locale, '音频文件', 'Audio File'), en: 'Audio File', type: 'file', accept: 'audio/*' },
    { key: 'person_id', label: pick(locale, '关于谁', 'About Person'), en: 'About Person', type: 'person', hint: pick(locale, '该口述主要讲述的家族成员', 'The family member this account is mainly about') },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true },
    { key: 'published_to_main', label: pick(locale, '发布到公开口述', 'Publish'), en: 'Publish', type: 'checkbox', hint: pick(locale, '官方默认发布；家族成员上传需勾选', 'Official records publish by default; member uploads must be checked') },
  ];

  return (
    <AdminLayout current="/admin/oral-history">
      <AdminTable
        table="oral_histories"
        rows={rows}
        fields={fields}
        title={pick(locale, '口述历史管理', 'Oral History')}
        titleEn="Oral History"
        extraRefs={{ people }}
        showOwner
        showLocation="oral"
        locale={locale}
      />
    </AdminLayout>
  );
}
