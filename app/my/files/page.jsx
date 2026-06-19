import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import MyLayout from '@/components/MyLayout';
import MyTable from '@/components/MyTable';
import { getLocale, pick } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export default async function MyFiles() {
  const locale = getLocale();
  const user = await getCurrentUser();
  if (user.role === 'guest') return <MyLayout current="/my/files" />;

  const db = getDb();
  // 个人档案 = 自己上传 且 visibility=private（仅自己可见的文件）
  // 也展示 member/public 的，因为同一个数据源；但在 UI 引导说默认私密
  // 实际查询：所有 owner=me 但 published_to_main=0 的当作"个人档案"
  // 这样就和"家族档案库"在同一表自然区分（已发布 vs 未发布）
  const rows = db.prepare(`
    SELECT * FROM archive_items
    WHERE owner_user_id = ? AND (published_to_main = 0 OR published_to_main IS NULL)
    ORDER BY CASE WHEN date_taken IS NULL THEN 1 ELSE 0 END, date_taken DESC, id DESC
  `).all(user.id);
  const people = db.prepare('SELECT id, name, name_en FROM people ORDER BY birth_year').all();

  const fields = [
    { key: 'title', label: pick(locale, '标题', 'Title'), en: 'Title', type: 'text', required: true,
      placeholder: pick(locale, '如：我的护照扫描 / 大学毕业证书 / 2018 京都之行', 'e.g. My passport scan / University diploma / 2018 trip to Kyoto') },
    {
      key: 'kind', label: pick(locale, '类型', 'Kind'), en: 'Kind', type: 'select', required: true,
      options: [
        { value: 'photo', label: pick(locale, '📷 照片 Photo', '📷 Photo') },
        { value: 'document', label: pick(locale, '📄 文档/证件 Document', '📄 Document / Certificate') },
        { value: 'audio', label: pick(locale, '🎵 录音 Audio', '🎵 Audio') },
        { value: 'video', label: pick(locale, '🎬 视频 Video', '🎬 Video') },
        { value: 'artifact', label: pick(locale, '🏺 实物/纪念物 Artifact', '🏺 Artifact') },
      ],
    },
    { key: 'description', label: pick(locale, '描述/备注', 'Description'), en: 'Description', type: 'textarea', rows: 5,
      hint: pick(locale, '这是什么、什么时候、和谁有关，可以写得详细些', 'What it is, when it was, and who it relates to — feel free to be detailed') },
    { key: 'date_taken', label: pick(locale, '日期', 'Date'), en: 'Date', type: 'text', placeholder: pick(locale, '如 2015-04-18 或 约 2010 年', 'e.g. 2015-04-18 or circa 2010') },
    { key: 'location', label: pick(locale, '地点', 'Location'), en: 'Location', type: 'text' },
    { key: 'file_url', label: pick(locale, '文件', 'File'), en: 'File', type: 'file',
      hint: pick(locale, '任何格式 —— 图片、PDF、Word、视频、录音、压缩包……', 'Any format — images, PDF, Word, video, audio, archives…') },
    { key: 'thumb_url', label: pick(locale, '缩略图', 'Thumbnail'), en: 'Thumbnail', type: 'file', accept: 'image/*',
      hint: pick(locale, '可选。非图片文件建议自定义一张封面图', 'Optional. For non-image files, a custom cover image is recommended') },
    { key: 'person_id', label: pick(locale, '关联家族成员', 'Related Person'), en: 'Related Person', type: 'person',
      hint: pick(locale, '可空。如果这份档案和某位家族成员相关', 'Optional. If this file relates to a particular family member') },
    { key: 'visibility', label: pick(locale, '可见性', 'Visibility'), en: 'Visibility', type: 'visibility', required: true,
      hint: pick(locale, '默认仅自己可见。家族 = 家族成员可见；公开 = 网站访客可见', 'Visible only to you by default. Family = visible to family members; Public = visible to site visitors') },
    { key: 'published_to_main', label: pick(locale, '发布到家族档案库', 'Publish to Family Archive'), en: 'Publish', type: 'checkbox',
      hint: pick(locale, '⚠️ 一旦勾选并保存，该档案会从「我的档案」移到「家族档案库」', '⚠️ Once checked and saved, this item moves from "My Files" to "Family Archive"') },
  ];

  return (
    <MyLayout current="/my/files">
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">My Personal Files · {pick(locale, '我的档案', 'My Files')}</div>
        <h1 className="font-display-cn text-3xl mt-1">{pick(locale, '我的档案', 'My Files')}</h1>
        <div className="mt-4 p-4 border-l-2 border-gold/40 bg-gold/5 text-xs text-ink-soft leading-relaxed">
          <div className="font-display-cn text-sm text-gold-deep mb-1.5">{pick(locale, '↳ 自己的照片、文件、视频、录音、纪念物……', '↳ Your own photos, files, videos, recordings, mementos…')}</div>
          {pick(locale, '这里默认仅你自己可见，是你的私人保险柜。任何文件格式都可以上传 —— 照片、PDF、文档、视频、录音、扫描件、压缩包……', 'By default everything here is visible only to you — your private vault. Any file format can be uploaded — photos, PDF, documents, video, audio, scans, archives…')}
          <br />
          <span className="text-muted">{pick(locale, '想公开到家族档案库？编辑该条目，勾选「发布到家族档案库」即可。', 'Want to share it to the Family Archive? Edit the item and check "Publish to Family Archive".')}</span>
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
        helpText={pick(locale, '个人证件、生活照、影像记忆、文件副本…… 凡是属于你自己的、希望长期保存的，都可以放这里。每一份都默认只有你能看到。', 'Personal documents, everyday photos, video memories, file copies… anything of your own that you want to preserve long-term belongs here. Every item is visible only to you by default.')}
      />
    </MyLayout>
  );
}
