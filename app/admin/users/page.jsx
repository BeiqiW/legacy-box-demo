import { getDb } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default function AdminUsers() {
  const locale = getLocale();
  const db = getDb();
  const rows = db.prepare('SELECT id, username, display_name, display_name_en, role, created_at FROM users ORDER BY id').all();

  const fields = [
    { key: 'username', label: pick(locale, '账号', 'Username'), en: 'Username', type: 'text', required: true, placeholder: pick(locale, '如：cousin_li', 'e.g. cousin_li') },
    { key: 'display_name', label: pick(locale, '显示名', 'Display Name'), en: 'Display Name', type: 'text', placeholder: pick(locale, '如：李知行 · 表亲', 'e.g. Li Zhixing · Cousin') },
    {
      key: 'role', label: pick(locale, '权限角色', 'Role'), en: 'Role', type: 'select', required: true,
      options: [
        { value: 'guest', label: pick(locale, '👁 访客 Guest（仅公开内容）', '👁 Guest (public content only)') },
        { value: 'member', label: pick(locale, '👨‍👩‍👧 家族成员 Family Member', '👨‍👩‍👧 Family Member') },
        { value: 'admin', label: pick(locale, '👑 管理员 Admin', '👑 Admin') },
      ],
    },
    { key: 'password', label: pick(locale, '密码', 'Password'), en: 'Password', type: 'password', placeholder: pick(locale, '新建必填；编辑时留空则不修改', 'Required when creating; leave blank to keep unchanged'), hint: pick(locale, '编辑时留空则保持不变', 'Leave blank when editing to keep unchanged') },
  ];

  return (
    <AdminLayout current="/admin/users">
      <AdminTable
        table="users"
        rows={rows}
        fields={fields}
        title={pick(locale, '账号与权限管理', 'Users & Roles')}
        titleEn="Users & Roles"
        locale={locale}
      />
    </AdminLayout>
  );
}
