import { getDb } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';
import ReviewQueue from './ReviewQueue';
import { getLocale } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default function AdminReview() {
  const locale = getLocale();
  const db = getDb();

  const pending = db.prepare(`
    SELECT te.*, p.name AS person_name, u.display_name AS owner_name, u.username AS owner_username
    FROM timeline_events te
    LEFT JOIN people p ON p.id = te.person_id
    LEFT JOIN users u ON u.id = te.owner_user_id
    WHERE te.approval_status = 'pending'
    ORDER BY te.created_at DESC
  `).all();

  const recent = db.prepare(`
    SELECT te.*, p.name AS person_name, u.display_name AS owner_name, r.display_name AS reviewer_name
    FROM timeline_events te
    LEFT JOIN people p ON p.id = te.person_id
    LEFT JOIN users u ON u.id = te.owner_user_id
    LEFT JOIN users r ON r.id = te.reviewed_by
    WHERE te.approval_status IN ('approved', 'rejected')
      AND te.owner_user_id IS NOT NULL
      AND te.reviewed_at IS NOT NULL
    ORDER BY te.reviewed_at DESC
    LIMIT 20
  `).all();

  return (
    <AdminLayout current="/admin/review">
      <ReviewQueue pending={pending} recent={recent} locale={locale} />
    </AdminLayout>
  );
}
