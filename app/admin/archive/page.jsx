import { getDb } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default function AdminArchive() {
  const locale = getLocale();
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.*, u.username AS owner_username, u.display_name AS owner_name,
           p.name AS person_name
    FROM archive_items a
    LEFT JOIN users u ON u.id = a.owner_user_id
    LEFT JOIN people p ON p.id = a.person_id
    ORDER BY CASE WHEN date_taken IS NULL THEN 1 ELSE 0 END, date_taken DESC, a.id DESC
  `).all();

  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'title', label: pick(locale, '档案标题', 'Title'), en: 'Title', type: 'text', required: true, placeholder: pick(locale, '如：陈承宗与林佩兰婚书', 'e.g. Marriage certificate of Chen Chengzong and Lin Peilan') },
    {
      key: 'kind', label: pick(locale, '类型', 'Kind'), en: 'Kind', type: 'select', required: true,
      options: [
        { value: 'photo', label: pick(locale, '📷 照片 Photo', '📷 Photo') },
        { value: 'document', label: pick(locale, '📄 文档 Document', '📄 Document') },
        { value: 'audio', label: pick(locale, '🎵 录音 Audio', '🎵 Audio') },
        { value: 'video', label: pick(locale, '🎬 视频 Video', '🎬 Video') },
        { value: 'artifact', label: pick(locale, '🏺 实物 Artifact', '🏺 Artifact') },
      ],
    },
    { key: 'description', label: pick(locale, '描述', 'Description'), en: 'Description', type: 'textarea', rows: 5 },
    { key: 'date_taken', label: pick(locale, '创建/拍摄日期', 'Date'), en: 'Date', type: 'text', placeholder: pick(locale, '如 1925-04-18 或 约 1936', 'e.g. 1925-04-18 or c. 1936') },
    { key: 'location', label: pick(locale, '地点', 'Location'), en: 'Location', type: 'text', placeholder: pick(locale, '如：上海法租界', 'e.g. French Concession, Shanghai') },
    { key: 'file_url', label: pick(locale, '原件文件', 'Source File'), en: 'Source File', type: 'file', hint: pick(locale, '任意格式：图/PDF/Word/视频/音频/压缩包', 'Any format: image / PDF / Word / video / audio / archive') },
    { key: 'thumb_url', label: pick(locale, '缩略图', 'Thumbnail'), en: 'Thumbnail', type: 'file', accept: 'image/*', hint: pick(locale, '可空，列表与卡片会用它', 'Optional; used in lists and cards') },
    { key: 'person_id', label: pick(locale, '关联人物', 'Related Person'), en: 'Related Person', type: 'person' },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true },
    { key: 'published_to_main', label: pick(locale, '发布到公开档案馆', 'Publish to Main'), en: 'Publish to Main', type: 'checkbox',
      hint: pick(locale, '官方档案默认发布；家族成员上传的档案需勾选才会出现在公开页', 'Official records publish by default; member uploads must be checked to appear on the public page') },
  ];

  return (
    <AdminLayout current="/admin/archive">
      <AdminTable
        table="archive_items"
        rows={rows}
        fields={fields}
        title={pick(locale, '档案资料管理', 'Archive')}
        titleEn="Archive"
        extraRefs={{ people }}
        showOwner
        showLocation="archive"
        locale={locale}
      />
    </AdminLayout>
  );
}
