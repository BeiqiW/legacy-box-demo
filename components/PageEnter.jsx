'use client';
import { useEffect, useState } from 'react';

export default function PageEnter({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  // 关键修复：默认就是可见的，只有 JS 已加载后才在第一帧加上入场动画
  // 不再用 opacity-0 作为 SSR 初始状态——之前那个会让没有 JS 时永远看不见
  return (
    <div style={{ opacity: 1 }} className={mounted ? 'page-enter' : ''}>
      {children}
    </div>
  );
}
