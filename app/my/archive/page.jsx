import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import MyLayout from '@/components/MyLayout';
import MyTable from '@/components/MyTable';
import { getLocale, pick } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function MyArchive() {
  const locale = getLocale();
  const user = await getCurrentUser();
  if (user.role === 'guest') return <MyLayout current="/my/archive" />;

  const db = getDb();
  // 家族档案库 = 该用户已勾选「发布」的所有档案
  const rows = db.prepare(`
    SELECT * FROM archive_items
    WHERE owner_user_id = ? AND published_to_main = 1
    ORDER BY CASE WHEN date_taken IS NULL THEN 1 ELSE 0 END, date_taken DESC, id DESC
  `).all(user.id);
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'title', label: pick(locale, '标题', 'Title'), en: 'Title', type: 'text', required: true,
      placeholder: pick(locale, '如：祖父 1958 年家书 / 1992 春节全家福 / 曾祖父契约扫描件', 'e.g. Grandfather\'s 1958 letter / 1992 Spring Festival family photo / Great-grandfather\'s deed scan') },
    {
      key: 'kind', label: pick(locale, '类型', 'Kind'), en: 'Kind', type: 'select', required: true,
      options: [
        { value: 'photo', label: pick(locale, '📷 照片 Photo', '📷 Photo') },
        { value: 'document', label: pick(locale, '📄 文档/家书/契约 Document', '📄 Document / Letter / Deed') },
        { value: 'audio', label: pick(locale, '🎵 录音 Audio', '🎵 Audio') },
        { value: 'video', label: pick(locale, '🎬 视频/影像 Video', '🎬 Video') },
        { value: 'artifact', label: pick(locale, '🏺 实物/纪念物 Artifact', '🏺 Artifact') },
      ],
    },
    { key: 'description', label: pick(locale, '描述与背景', 'Description'), en: 'Description', type: 'textarea', rows: 6,
      hint: pick(locale, '请加上你的记忆与背景说明 —— 摄于何时何地，由谁拍摄，谁在其中。几十年后这些注解会比物件本身更珍贵', 'Please add your memories and background — when and where it was taken, who took it, who is in it. Decades from now these notes will be more precious than the item itself') },
    { key: 'date_taken', label: pick(locale, '原件日期', 'Date'), en: 'Date', type: 'text',
      placeholder: pick(locale, '如 2015-04-18 或 约 1980 年代', 'e.g. 2015-04-18 or circa 1980s') },
    { key: 'location', label: pick(locale, '地点', 'Location'), en: 'Location', type: 'text' },
    { key: 'file_url', label: pick(locale, '原件文件', 'Source File'), en: 'Source File', type: 'file',
      hint: pick(locale, '任何格式 —— 图片、PDF、Word、视频、录音、压缩包……', 'Any format — images, PDF, Word, video, audio, archives…') },
    { key: 'thumb_url', label: pick(locale, '封面图', 'Thumbnail'), en: 'Thumbnail', type: 'file', accept: 'image/*',
      hint: pick(locale, '可选。非图片档案建议自定义一张封面图', 'Optional. For non-image items, a custom cover image is recommended') },
    { key: 'person_id', label: pick(locale, '关联家族成员', 'About'), en: 'About', type: 'person',
      hint: pick(locale, '这个档案与哪位家人最相关', 'Which family member is this item most related to') },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true,
      hint: pick(locale, '公开 = 网站访客可见；家族 = 仅家族成员可见', 'Public = visible to site visitors; Family = visible to family members only') },
    { key: 'published_to_main', label: pick(locale, '发布到家族档案库', 'Publish to Family Archive'), en: 'Publish', type: 'checkbox',
      hint: pick(locale, '取消勾选会将此档案移回「我的档案」（仅你私人可见）', 'Unchecking moves this item back to "My Files" (private to you only)') },
  ];

  return (
    <MyLayout current="/my/archive">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">Family Archive · {pick(locale, '家族档案库', 'Family Archive')}</div>
        <h1 className="font-display-cn text-3xl mt-1">{pick(locale, '家族档案库', 'Family Archive')}</h1>
        <div className="mt-4 p-4 border-l-2 border-gold/40 bg-gold/5 text-xs text-ink-soft leading-relaxed">
          <div className="font-display-cn text-sm text-gold-deep mb-1.5">{pick(locale, '↳ 照片 · 家书 · 契约 · 录音 · 影像 · 实物纪念 ……', '↳ Photos · Letters · Deeds · Recordings · Footage · Artifacts …')}</div>
          {pick(locale,
            <>这里是<span className="text-gold-deep font-medium">家族共享</span>的档案库 ——
            你贡献的内容会出现在<a href="/archive" className="mx-1 text-gold-deep underline underline-offset-4">公开档案馆</a>
            与对应家族成员的人物志详情页。</>,
            <>This is the <span className="text-gold-deep font-medium">family-shared</span> archive —
            your contributions appear in the <a href="/archive" className="mx-1 text-gold-deep underline underline-offset-4">public Archive</a>
            and on the profile pages of the related family members.</>
          )}
          <br />
          <span className="text-muted">{pick(locale, '支持任何文件格式：图片、PDF、Word、视频、音频、扫描件、压缩包……', 'Any file format is supported: images, PDF, Word, video, audio, scans, archives…')}</span>
        </div>
      </div>

      <MyTable
        table="archive_items"
        rows={rows}
        fields={fields}
        title=""
        titleEn=""
        extraRefs={{ people }}
        currentUserId={user.id}
        helpText={pick(locale, '老照片、扫描件、家书、契约、票据、录音、影像、实物照片…… 任何属于家族的物件，都欢迎贡献到这里。请尽量附上你知道的背景 —— 几十年后这些注解会比物件本身更珍贵。', 'Old photos, scans, family letters, deeds, receipts, recordings, footage, artifact photos… any item belonging to the family is welcome here. Please add whatever background you know — decades from now these notes will be more precious than the items themselves.')}
      />
    </MyLayout>
  );
}
