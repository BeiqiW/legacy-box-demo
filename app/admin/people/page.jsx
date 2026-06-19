import { getDb } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default function AdminPeople() {
  const locale = getLocale();
  const db = getDb();
  const rows = db.prepare('SELECT * FROM people ORDER BY birth_year ASC').all();

  const fields = [
    { key: 'name', label: pick(locale, '姓名', 'Name'), en: 'Name', type: 'text', required: true, placeholder: pick(locale, '如：陈承宗', 'e.g. Chen Chengzong') },
    { key: 'role_in_family', label: pick(locale, '家族角色', 'Role'), en: 'Role', type: 'text', placeholder: pick(locale, '如：第一代 · 家族奠基人 · 曾祖父', 'e.g. 1st gen · Family founder · Great-grandfather') },
    { key: 'birth_year', label: pick(locale, '出生年', 'Birth Year'), en: 'Birth Year', type: 'number', placeholder: pick(locale, '如：1898', 'e.g. 1898') },
    { key: 'death_year', label: pick(locale, '逝世年', 'Death Year'), en: 'Death Year', type: 'number', placeholder: pick(locale, '在世留空', 'Leave blank if living'), hint: pick(locale, '在世留空', 'Leave blank if living') },
    { key: 'bio_public', label: pick(locale, '公开传记', 'Public Bio'), en: 'Public Bio', type: 'textarea', rows: 7, hint: pick(locale, '所有访客可见', 'Visible to all visitors') },
    { key: 'bio_private', label: pick(locale, '家族私密传记', 'Private Bio'), en: 'Private Bio', type: 'textarea', rows: 5, hint: pick(locale, '仅家族成员或更高权限可见', 'Visible to family members and above only') },
    { key: 'photo_url', label: pick(locale, '人物照片', 'Portrait'), en: 'Portrait', type: 'file', accept: 'image/*' },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true },
  ];

  return (
    <AdminLayout current="/admin/people">
      <AdminTable
        table="people"
        rows={rows}
        fields={fields}
        title={pick(locale, '人物档案管理', 'People')}
        titleEn="People"
        showLocation="people"
        locale={locale}
      />
    </AdminLayout>
  );
}
