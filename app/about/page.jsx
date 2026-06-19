import PageEnter from '@/components/PageEnter';
import { getLocale, pick, loc } from '@/lib/server-i18n';

export default function AboutPage() {
  const locale = getLocale();
  return (
    <PageEnter>
      <div className="max-w-3xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <div className="text-[10px] tracking-[0.5em] text-gold-deep uppercase">About</div>
          <h1 className="font-display-cn text-5xl md:text-6xl mt-4">{pick(locale, '关于本盒子', 'About the Box')}</h1>
          <div className="gold-line w-24 mx-auto mt-6"></div>
        </div>

        <div className="space-y-10 text-base leading-relaxed">
          <p className="reveal text-lg font-display italic text-ink-soft border-l-2 border-gold/40 pl-6">
            {pick(
              locale,
              <>
                您当前浏览的，是一台名为 <strong className="text-sepia">Legacy Box</strong> 的本地家族传承设备所托管的站点。
                整个网站、数据库、所有照片、文档、录音——都存放在客户自己的硬件之中，不依赖任何第三方云服务。
              </>,
              <>
                What you are viewing is a site hosted on a local family-legacy device called the <strong className="text-sepia">Legacy Box</strong>.
                The entire website, database, and every photograph, document, and recording live on the client’s own hardware, with no reliance on any third-party cloud service.
              </>
            )}
          </p>

          <section className="reveal">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-display text-3xl text-gold-gradient">01</span>
              <h2 className="font-display-cn text-2xl">{pick(locale, '三级权限模型', 'Three-Tier Permission Model')}</h2>
              <div className="gold-line flex-1"></div>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-vintage-green pl-5 py-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-display-cn text-lg">{pick(locale, '公开层', 'Public Tier')}</span>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-vintage-green">Public</span>
                </div>
                <p className="text-sm text-muted mt-1">{pick(locale, '家族对外可分享的故事、企业沿革、已发表的人物传记。', 'Stories the family is happy to share publicly, company history, and published biographies.')}</p>
              </div>
              <div className="border-l-4 border-sepia pl-5 py-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-display-cn text-lg">{pick(locale, '家族层', 'Family Tier')}</span>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-sepia">Member</span>
                </div>
                <p className="text-sm text-muted mt-1">{pick(locale, '完整档案、内部口述历史、家族成员个人信息——需家族账号登录。', 'Full records, internal oral histories, and family members’ personal information — requires a family account login.')}</p>
              </div>
              <div className="border-l-4 border-vintage-red pl-5 py-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-display-cn text-lg">{pick(locale, '管理层', 'Admin Tier')}</span>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-vintage-red">Admin</span>
                </div>
                <p className="text-sm text-muted mt-1">{pick(locale, '未公开的敏感档案、法律文件、家族决议——仅指定管理员可见与编辑。', 'Unpublished sensitive records, legal documents, and family resolutions — visible and editable only by designated administrators.')}</p>
              </div>
            </div>
          </section>

          <section className="reveal">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-display text-3xl text-gold-gradient">02</span>
              <h2 className="font-display-cn text-2xl">{pick(locale, '本地优先 · 数据主权', 'Local-First · Data Sovereignty')}</h2>
              <div className="gold-line flex-1"></div>
            </div>
            <p className="text-ink-soft">
              {pick(
                locale,
                '本盒子默认不上传任何资料到云端。如果客户希望异地访问，可以通过 Cloudflare Tunnel 或 Tailscale 以加密通道进行连接，依然由客户掌握访问钥匙。后期若需要扩展，可选择接入云存储或云端 AI 服务，但每一次扩展都必须经客户授权。',
                'By default the Box uploads nothing to the cloud. If the client wants remote access, they can connect over an encrypted channel via Cloudflare Tunnel or Tailscale, while still holding the access keys themselves. Should they later need to expand, they may opt into cloud storage or cloud AI services — but every such expansion must be authorized by the client.'
              )}
            </p>
          </section>

          <section className="reveal">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-display text-3xl text-gold-gradient">03</span>
              <h2 className="font-display-cn text-2xl">{pick(locale, '证据标准', 'Evidence Standards')}</h2>
              <div className="gold-line flex-1"></div>
            </div>
            <p className="text-ink-soft mb-4">{pick(locale, '我们严格区分四种状态：', 'We draw a strict distinction between four states:')}</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <span className="evidence-verified text-base mt-0.5">●</span>
                <span><strong className="evidence-verified">{pick(locale, '已核实 / Verified', 'Verified')}</strong>{pick(locale, '：有一手或可靠二手来源支持', ': supported by a primary or reliable secondary source')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="evidence-attributed text-base mt-0.5">◆</span>
                <span><strong className="evidence-attributed">{pick(locale, '有出处的口述 / Attributed', 'Attributed')}</strong>{pick(locale, '：有具名讲述人，未经独立核实', ': has a named source, not independently verified')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="evidence-inferred text-base mt-0.5">◇</span>
                <span><strong className="evidence-inferred">{pick(locale, '推断 / Inferred', 'Inferred')}</strong>{pick(locale, '：基于现有材料的合理解释，需明示', ': a reasonable interpretation of existing material, which must be stated as such')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="evidence-unresolved text-base mt-0.5">?</span>
                <span><strong className="evidence-unresolved">{pick(locale, '待解决 / Unresolved', 'Unresolved')}</strong>{pick(locale, '：证据冲突或不足', ': evidence is conflicting or insufficient')}</span>
              </li>
            </ul>
            <p className="text-sm text-muted italic mt-6 quote-mark">
              {pick(locale, '我们不会把家族传说改写成史实。这是 Legacy Labs 的伦理底线。', 'We will not rewrite family legend into established fact. This is the ethical bottom line of Legacy Labs.')}
            </p>
          </section>

          <div className="mt-16 reveal">
            <div className="flex items-center justify-center gap-6">
              <div className="h-px w-16 bg-gold/30"></div>
              <span className="text-3xl text-gold-gradient animate-drift">◈</span>
              <div className="h-px w-16 bg-gold/30"></div>
            </div>
            <div className="text-center mt-4">
              <div className="text-[10px] tracking-[0.5em] uppercase text-muted">
                Legacy Box · Powered by Legacy Labs
              </div>
              <div className="text-xs text-muted/70 mt-2 italic">
                Preserving Human Legacy Through AI, Storytelling and Technology
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageEnter>
  );
}
