import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import MyLayout from '@/components/MyLayout';
import MyTable from '@/components/MyTable';
import { getLocale, pick } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function MyOral() {
  const locale = getLocale();
  const user = await getCurrentUser();
  if (user.role === 'guest') return <MyLayout current="/my/oral-history" />;

  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM oral_histories
    WHERE owner_user_id = ?
    ORDER BY CASE WHEN recorded_date IS NULL THEN 1 ELSE 0 END, recorded_date DESC, id DESC
  `).all(user.id);
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'title', label: pick(locale, '访谈/记忆标题', 'Title'), en: 'Title', type: 'text', required: true, placeholder: pick(locale, '如：奶奶讲述外婆的婚礼', 'e.g. Grandma recounts great-grandma\'s wedding') },
    { key: 'speaker', label: pick(locale, '讲述人', 'Speaker'), en: 'Speaker', type: 'text', placeholder: pick(locale, '如：陈昭华（我的母亲）', 'e.g. Chen Zhaohua (my mother)') },
    { key: 'recorded_date', label: pick(locale, '记录日期', 'Recorded'), en: 'Recorded', type: 'text', placeholder: pick(locale, '如 2024-12-30', 'e.g. 2024-12-30') },
    { key: 'duration_minutes', label: pick(locale, '时长（分钟）', 'Duration'), en: 'Duration', type: 'number' },
    { key: 'transcript', label: pick(locale, '转录文本', 'Transcript'), en: 'Transcript', type: 'textarea', rows: 12,
      hint: pick(locale, '可粘贴完整对话或精选段落。请尽量保留原话的语气', 'Paste the full conversation or selected excerpts. Please preserve the original tone of voice') },
    { key: 'audio_url', label: pick(locale, '录音文件', 'Audio'), en: 'Audio', type: 'file', accept: 'audio/*,video/*' },
    { key: 'person_id', label: pick(locale, '关于谁', 'About Person'), en: 'About Person', type: 'person', hint: pick(locale, '这段口述主要讲述的家族成员', 'The family member this oral history is mainly about') },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true },
    { key: 'published_to_main', label: pick(locale, '加入家族口述档案', 'Add to Family Oral History'), en: 'Publish', type: 'checkbox' },
  ];

  return (
    <MyLayout current="/my/oral-history">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Family Oral History · {pick(locale, '家族口述', 'Family Oral History')}</div>
        <h1 className="font-display-cn text-3xl mt-1">{pick(locale, '家族口述', 'Family Oral History')}</h1>
        <div className="mt-4 p-4 border-l-2 border-gold/40 bg-gold/5 text-xs text-ink-soft leading-relaxed">
          <div className="font-display-cn text-sm text-gold-deep mb-1.5">{pick(locale, '↳ 记录长辈的讲述、口述访谈', '↳ Record the accounts and oral-history interviews of your elders')}</div>
          {pick(locale, '上传默认仅你可见。需加入公开的口述档案，请勾选「加入家族口述档案」。', 'Uploads are visible only to you by default. To add to the public oral-history archive, check "Add to Family Oral History".')}
        </div>
      </div>

      <MyTable
        table="oral_histories"
        rows={rows}
        fields={fields}
        title=""
        titleEn=""
        extraRefs={{ people }}
        currentUserId={user.id}
        helpText={pick(locale, '家族里的长辈是行走的档案馆。每一次他们的讲述都值得记录 —— 即使只是一段文字、一段语音。说话人、地点、当时的语气，是几十年后我们最想触摸的细节。', 'The elders in a family are walking archives. Every account they share is worth recording — even just a passage of text or a voice clip. The speaker, the place, the tone of the moment are the details we will most long to touch decades from now.')}
      />
    </MyLayout>
  );
}
