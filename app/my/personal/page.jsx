import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import MyLayout from '@/components/MyLayout';
import PersonalView from '@/components/PersonalView';
import { getLocale, pick } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function MyPersonal() {
  const locale = getLocale();
  const user = await getCurrentUser();
  if (user.role === 'guest') return <MyLayout current="/my/personal" />;

  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM personal_entries WHERE owner_user_id = ? ORDER BY CASE WHEN year IS NULL THEN 1 ELSE 0 END, year DESC, id DESC'
  ).all(user.id);
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();
  const peopleMap = Object.fromEntries(people.map((p) => [p.id, p.name]));

  const fields = [
    { key: 'title', label: pick(locale, '标题', 'Title'), en: 'Title', type: 'text', required: true, placeholder: pick(locale, '如：第一次回老家', 'e.g. First trip back to my hometown') },
    {
      key: 'kind', label: pick(locale, '类型', 'Type'), en: 'Type', type: 'select', required: true,
      options: [
        { value: 'memory', label: pick(locale, '🌿 回忆 Memory', '🌿 Memory') },
        { value: 'achievement', label: pick(locale, '🏆 成就 Achievement', '🏆 Achievement') },
        { value: 'milestone', label: pick(locale, '✦ 人生时刻 Milestone', '✦ Milestone') },
        { value: 'travel', label: pick(locale, '✈ 旅行 Travel', '✈ Travel') },
        { value: 'family', label: pick(locale, '👨‍👩‍👧 家庭 Family', '👨‍👩‍👧 Family') },
        { value: 'note', label: pick(locale, '📝 笔记 Note', '📝 Note') },
      ],
    },
    { key: 'year', label: pick(locale, '年份', 'Year'), en: 'Year', type: 'number', placeholder: pick(locale, '如：2018', 'e.g. 2018') },
    { key: 'month', label: pick(locale, '月', 'Month'), en: 'Month', type: 'number', placeholder: pick(locale, '可空', 'Optional') },
    { key: 'day', label: pick(locale, '日', 'Day'), en: 'Day', type: 'number', placeholder: pick(locale, '可空', 'Optional') },
    { key: 'body', label: pick(locale, '内容', 'Content'), en: 'Content', type: 'textarea', rows: 10, hint: pick(locale, '可以写得长，慢慢来', 'Feel free to write at length, take your time') },
    { key: 'media_url', label: pick(locale, '配图/附件', 'Media'), en: 'Media', type: 'file' },
    { key: 'person_id', label: pick(locale, '关联家族成员', 'Related Person'), en: 'Related Person', type: 'person', hint: pick(locale, '可空。也可关联到家族中其他人', 'Optional. Can also be linked to another family member') },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true, hint: pick(locale, '默认仅自己可见', 'Visible only to you by default') },
    { key: 'published_to_main', label: pick(locale, '同步到主页面', 'Publish'), en: 'Publish', type: 'checkbox', hint: pick(locale, '可在该家族成员的"人物志"页面公开展示', 'Can be shown publicly on that family member\'s profile page') },
  ];

  return (
    <MyLayout current="/my/personal">
      <PersonalView
        rows={rows}
        fields={fields}
        extraRefs={{ people }}
        currentUserId={user.id}
        peopleMap={peopleMap}
        helpText={pick(locale, '这里是你自己的私密空间。日记、回忆、成就、旅行、家庭时刻…… 想写什么都可以。默认只有你自己看得到 —— 当你愿意时，可以选择分享给家族，或公开到家族主页。', 'This is your own private space. Diaries, memories, achievements, travels, family moments… write whatever you like. By default only you can see it — and whenever you choose, you can share it with the family or make it public on the family homepage.')}
      />
    </MyLayout>
  );
}
