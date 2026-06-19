import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import MyLayout from '@/components/MyLayout';
import MilestonesView from '@/components/MilestonesView';

export const dynamic = 'force-dynamic';

export default async function MyMilestones() {
  const user = await getCurrentUser();
  if (user.role === 'guest') return <MyLayout current="/my/milestones" />;

  const db = getDb();

  // 我的生平时刻 = personal_entries 中 kind = milestone / achievement
  const rows = db.prepare(
    `SELECT * FROM personal_entries
     WHERE owner_user_id = ? AND kind IN ('milestone', 'achievement')
     ORDER BY CASE WHEN year IS NULL THEN 1 ELSE 0 END, year DESC, month DESC, id DESC`
  ).all(user.id);

  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  // 关联到当前账号的家族成员
  let myPerson = null;
  if (user.person_id) {
    myPerson = db.prepare('SELECT * FROM people WHERE id = ?').get(user.person_id);
  }

  return (
    <MyLayout current="/my/milestones">
      <MilestonesView
        rows={rows}
        currentUserId={user.id}
        myPerson={myPerson}
        people={people}
      />
    </MyLayout>
  );
}
