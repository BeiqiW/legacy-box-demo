'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pick } from '@/lib/i18n';

export default function FamilyTreeChart({ people, userRole, locale = 'zh' }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null); // 点击后弹窗的节点 key

  // ESC 关闭弹窗
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // Match on the stable Chinese key so the tree works in any locale.
  const find = (nameZh) => people.find((p) => p.nameZh === nameZh);
  const 承宗 = find('陈承宗');
  const 佩兰 = find('林佩兰');
  const 守仁 = find('陈守仁');
  const 守德 = find('陈守德');
  const 昭华 = find('陈昭华');
  const 文琦 = find('苏文琦');
  const 知远 = find('陈知远');

  const N = {
    chen: { x: 280, y: 120, p: 承宗 },
    lin: { x: 480, y: 120, p: 佩兰 },
    wanFang: { x: 720, y: 270, p: null, ghost: true, ghostKey: 'wanfang' },
    shouRen: { x: 220, y: 270, p: 守仁 },
    shouDe: { x: 470, y: 270, p: 守德 },
    suHua: { x: 100, y: 270, p: null, ghost: true, ghostKey: 'suhua', label: pick(locale, '王素华', 'Wang Suhua') },
    zhaoHua: { x: 220, y: 440, p: 昭华 },
    wenQi: { x: 440, y: 440, p: 文琦 },
    zhiYuan: { x: 330, y: 600, p: 知远 },
  };

  return (
    <div className="relative">
      <svg
        viewBox="0 0 900 720"
        className="w-full h-auto"
        style={{ maxHeight: '85vh' }}
      >
        <defs>
          <pattern id="paper-grain" patternUnits="userSpaceOnUse" width="80" height="80">
            <rect width="80" height="80" fill="transparent" />
            <circle cx="20" cy="30" r="0.5" fill="#b8965b" opacity="0.08" />
            <circle cx="60" cy="50" r="0.5" fill="#b8965b" opacity="0.06" />
          </pattern>
          <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4af6e" />
            <stop offset="100%" stopColor="#8b6a2f" />
          </linearGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="900" height="720" fill="url(#paper-grain)" />

        {/* 世代分隔横线 + 标签 */}
        {[
          { y: 60, label: pick(locale, 'Generation I · 第一代 · 1898 – 1989', 'Generation I · 1898 – 1989') },
          { y: 210, label: pick(locale, 'Generation II · 第二代 · 1925 – 2008', 'Generation II · 1925 – 2008') },
          { y: 380, label: pick(locale, 'Generation III · 第三代 · 1955 – ', 'Generation III · 1955 – ') },
          { y: 540, label: pick(locale, 'Generation IV · 第四代 · 1992 – ', 'Generation IV · 1992 – ') },
        ].map((g, i) => (
          <g key={i}>
            <line x1="40" y1={g.y} x2="860" y2={g.y} stroke="#b8965b" strokeOpacity="0.15" strokeDasharray="2 6" />
            <text x="50" y={g.y - 8} fontSize="9" fill="#8b6a2f" letterSpacing="3" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>
              {g.label}
            </text>
          </g>
        ))}

        {/* 连接线 */}
        <line x1={N.chen.x} y1={N.chen.y} x2={N.lin.x} y2={N.lin.y} stroke="#8b6a2f" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={(N.chen.x + N.lin.x) / 2} y={N.chen.y - 12} fontSize="9" fill="#b8965b" textAnchor="middle" letterSpacing="2">
          ═ 1925 ═
        </text>

        <line x1={(N.chen.x + N.lin.x) / 2} y1={N.chen.y + 30} x2={(N.chen.x + N.lin.x) / 2} y2={185} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={N.shouRen.x} y1={185} x2={N.wanFang.x} y2={185} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={N.shouRen.x} y1={185} x2={N.shouRen.x} y2={N.shouRen.y - 30} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={N.shouDe.x} y1={185} x2={N.shouDe.x} y2={N.shouDe.y - 30} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={N.wanFang.x} y1={185} x2={N.wanFang.x} y2={N.wanFang.y - 30} stroke="#8b6a2f" strokeWidth="1.5" strokeDasharray="3 5" />

        <line x1={N.suHua.x} y1={N.shouRen.y} x2={N.shouRen.x} y2={N.shouRen.y} stroke="#8b6a2f" strokeWidth="1.5" strokeDasharray="6 4" />
        <line x1={(N.suHua.x + N.shouRen.x) / 2} y1={N.shouRen.y + 30} x2={(N.suHua.x + N.shouRen.x) / 2} y2={N.zhaoHua.y - 30} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={(N.suHua.x + N.shouRen.x) / 2} y1={N.zhaoHua.y - 30} x2={N.zhaoHua.x} y2={N.zhaoHua.y - 30} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={N.zhaoHua.x} y1={N.zhaoHua.y - 30} x2={N.zhaoHua.x} y2={N.zhaoHua.y} stroke="#8b6a2f" strokeWidth="1.5" />

        <line x1={N.zhaoHua.x} y1={N.zhaoHua.y} x2={N.wenQi.x} y2={N.wenQi.y} stroke="#8b6a2f" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={(N.zhaoHua.x + N.wenQi.x) / 2} y={N.zhaoHua.y - 12} fontSize="9" fill="#b8965b" textAnchor="middle" letterSpacing="2">
          ═ 1991 ═
        </text>
        <line x1={(N.zhaoHua.x + N.wenQi.x) / 2} y1={N.zhaoHua.y + 30} x2={(N.zhaoHua.x + N.wenQi.x) / 2} y2={N.zhiYuan.y - 30} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={(N.zhaoHua.x + N.wenQi.x) / 2} y1={N.zhiYuan.y - 30} x2={N.zhiYuan.x} y2={N.zhiYuan.y - 30} stroke="#8b6a2f" strokeWidth="1.5" />
        <line x1={N.zhiYuan.x} y1={N.zhiYuan.y - 30} x2={N.zhiYuan.x} y2={N.zhiYuan.y} stroke="#8b6a2f" strokeWidth="1.5" />

        {/* 节点 - 点击触发 selected */}
        {Object.entries(N).map(([key, node]) => (
          <PersonNode
            key={key}
            cx={node.x}
            cy={node.y}
            p={node.p}
            ghost={node.ghost}
            ghostKey={node.ghostKey}
            label={node.label}
            locale={locale}
            isHover={hovered === key}
            onHover={() => setHovered(key)}
            onLeave={() => setHovered(null)}
            onClick={() => setSelected(key)}
          />
        ))}
      </svg>

      {/* 底部提示区 */}
      <div className="mt-6 min-h-[60px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.5em] uppercase text-muted">
            ◈&nbsp;&nbsp;{pick(locale, 'Click · 点击人物查看档案', 'Click a person to view their record')}
          </div>
          <div className="text-xs text-muted mt-2 font-display-cn">
            {pick(locale, '4 代 · 7 位已编档人物 · 2 位待补', '4 generations · 7 documented people · 2 pending')}
          </div>
        </div>
      </div>

      {/* === 模态弹窗 === */}
      {selected && (
        <PersonModal
          node={N[selected]}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function PersonNode({ cx, cy, p, ghost, ghostKey, label, locale = 'zh', isHover, onHover, onLeave, onClick }) {
  // ghost 节点：失散或占位人物
  if (ghost) {
    return (
      <g
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        {/* 透明的更大点击区，提升可点性 */}
        <circle cx={cx} cy={cy} r="40" fill="transparent" />
        <circle cx={cx} cy={cy} r="22" fill="rgba(107,68,35,0.08)" stroke="#6b4423" strokeWidth="1" strokeDasharray="3 3" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fill="#8a8175" style={{ fontFamily: 'Noto Serif SC, serif', pointerEvents: 'none' }}>
          {label ? String(label).charAt(0) : '?'}
        </text>
        {label && (
          <text x={cx} y={cy + 40} textAnchor="middle" fontSize="11" fill="#8a8175" style={{ fontFamily: 'Noto Serif SC, serif', pointerEvents: 'none' }}>
            {label}
          </text>
        )}
        <text x={cx} y={label ? cy + 54 : cy + 42} textAnchor="middle" fontSize="9" fill="#8a8175" letterSpacing="1.5" style={{ pointerEvents: 'none' }}>
          {ghostKey === 'suhua' ? '1925 – 2002' : '1932 – ?'}
        </text>
      </g>
    );
  }

  if (!p) return null;

  const alive = !p.death_year;
  const isRestricted = !p.visible;
  const fill = isRestricted ? 'rgba(107,68,35,0.15)' : alive ? '#f6f1e6' : '#d4af6e';
  const stroke = isRestricted ? '#6b4423' : '#8b6a2f';

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      filter={isHover ? 'url(#soft-glow)' : ''}
    >
      {/* 大点击区 */}
      <circle cx={cx} cy={cy} r="42" fill="transparent" />

      {isHover && (
        <circle cx={cx} cy={cy} r="36" fill="none" stroke="#d4af6e" strokeWidth="1" opacity="0.5" />
      )}
      <circle
        cx={cx}
        cy={cy}
        r="26"
        fill={fill}
        stroke={stroke}
        strokeWidth={isHover ? '2' : '1.5'}
        style={{ transition: 'all 0.3s' }}
      />
      {/* initial inside the medallion */}
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        fontSize="17"
        fill={isRestricted ? '#6b4423' : '#1c1815'}
        style={{ fontFamily: 'Noto Serif SC, serif', fontWeight: 500, pointerEvents: 'none' }}
      >
        {String(p.name || '?').charAt(0)}
      </text>
      {/* full name below the circle (fits long English names) */}
      <text
        x={cx}
        y={cy + 46}
        textAnchor="middle"
        fontSize="12"
        fill={isRestricted ? '#6b4423' : '#1c1815'}
        style={{ fontFamily: 'Noto Serif SC, serif', fontWeight: 500, pointerEvents: 'none' }}
      >
        {p.name}
      </text>
      <text
        x={cx}
        y={cy + 62}
        textAnchor="middle"
        fontSize="9"
        fill="#8a8175"
        letterSpacing="1.5"
        style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}
      >
        {p.birth_year || '?'} – {p.death_year || (alive ? pick(locale, '现', 'now') : '?')}
      </text>
    </g>
  );
}

function PersonModal({ node, locale = 'zh', onClose }) {
  // 锁滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isGhost = node.ghost;
  const p = node.p;
  const isRestricted = p && !p.visible;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ animation: 'fadeIn 0.25s ease' }}
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative max-w-md w-full bg-parchment border border-gold/40 shadow-2xl"
        style={{
          animation: 'modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(184,150,91,0.15)',
        }}
      >
        {/* 装饰边角 */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l border-t border-gold/40"></div>
        <div className="absolute top-3 right-3 w-6 h-6 border-r border-t border-gold/40"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l border-b border-gold/40"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r border-b border-gold/40"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition text-xl z-10"
          aria-label={pick(locale, '关闭', 'Close')}
        >
          ×
        </button>

        <div className="px-10 py-10 text-center">
          {isGhost ? (
            <>
              <div className="text-4xl mb-4 opacity-40">◌</div>
              <div className="text-[10px] tracking-[0.5em] uppercase text-sepia mb-2">{pick(locale, 'Ghost Branch · 待补', 'Ghost Branch · Pending')}</div>
              <h3 className="font-display-cn text-3xl text-sepia">
                {node.ghostKey === 'suhua' ? pick(locale, '王素华', 'Wang Suhua') : pick(locale, '陈宛芳', 'Chen Wanfang')}
              </h3>
              <div className="text-xs text-muted mt-2 tracking-wider">
                {node.ghostKey === 'suhua' ? '1925 – 2002' : pick(locale, '1932 – 失散', '1932 – lost')}
              </div>
              <div className="gold-line w-16 mx-auto my-6"></div>
              <p className="text-sm text-ink-soft leading-loose">
                {node.ghostKey === 'suhua'
                  ? pick(locale, '陈守仁的妻子。家族档案对她的资料尚处整理阶段，将由家族成员陆续补入。', 'The wife of Chen Shouren. Her records are still being compiled and will be added by family members over time.')
                  : pick(locale, '陈承宗与林佩兰的次女。1937 年逃难途中在浙赣边界走失，时年五岁。家族每年清明仍在祠堂为她立位。寻访工作于 2024 年在浙赣交界重启。', 'The second daughter of Chen Chengzong and Lin Peilan. She was lost at the age of five along the Zhejiang–Jiangxi border while the family fled in 1937. Each year at Qingming the family still keeps a place for her in the ancestral hall. The search was reopened along the Zhejiang–Jiangxi border in 2024.')}
              </p>
              <div className="mt-8 text-xs text-muted italic">
                {pick(locale, '此节点尚无完整档案', 'No complete record for this node yet')}
              </div>
            </>
          ) : isRestricted ? (
            <>
              <div className="text-5xl mb-4 opacity-50">⚿</div>
              <div className="text-[10px] tracking-[0.5em] uppercase text-vintage-red mb-2">{pick(locale, 'Restricted · 受限', 'Restricted')}</div>
              <h3 className="font-display-cn text-2xl text-sepia">{pick(locale, '人物档案受保护', 'This profile is protected')}</h3>
              <div className="gold-line w-16 mx-auto my-6"></div>
              <p className="text-sm text-muted leading-loose">
                {pick(
                  locale,
                  <>此位家族成员的姓名、生卒年与传记仅家族成员可见。<br />如您是家族成员，请登录查看。</>,
                  <>This family member’s name, dates, and biography are visible to family members only.<br />If you are a family member, please log in to view.</>
                )}
              </p>
              <div className="mt-8">
                <Link href="/login" className="btn-primary text-xs" onClick={onClose}>
                  {pick(locale, '登录家族账号 →', 'Log in →')}
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* 人物头像 */}
              <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center overflow-hidden">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display-cn text-4xl text-gold-deep">{p.name[0]}</span>
                )}
              </div>

              <div className="text-[10px] tracking-[0.5em] uppercase text-gold-deep">
                {p.role_in_family || pick(locale, '家族成员', 'Family Member')}
              </div>
              <h3 className="font-display-cn text-3xl mt-2">{p.name}</h3>
              <div className="text-xs text-muted mt-1 tracking-wider font-mono">
                {p.birth_year || '?'} – {p.death_year || pick(locale, '现', 'now')}
                {p.death_year && p.birth_year && (
                  <span className="ml-2">{pick(locale, `· 享年 ${p.death_year - p.birth_year} 岁`, `· aged ${p.death_year - p.birth_year}`)}</span>
                )}
              </div>

              <div className="gold-line w-16 mx-auto my-6"></div>

              {p.bio_public && (
                <p className="text-sm text-ink-soft leading-loose text-left whitespace-pre-wrap line-clamp-6">
                  {p.bio_public}
                </p>
              )}

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={onClose}
                  className="text-xs tracking-widest uppercase px-4 py-2.5 text-muted hover:text-ink transition"
                >
                  {pick(locale, '关闭', 'Close')}
                </button>
                <Link
                  href={`/people/${p.id}`}
                  className="btn-primary text-xs"
                  onClick={onClose}
                >
                  {pick(locale, '查阅完整档案 →', 'View full record →')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn {
          from { transform: translateY(16px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
