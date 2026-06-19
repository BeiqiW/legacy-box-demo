'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // 给路由切换后的 DOM 一点时间渲染
    const timer = setTimeout(() => {
      const els = document.querySelectorAll('.reveal:not(.is-visible)');

      // 兜底：如果元素已经在视口内，IO 可能不会立刻触发，先全部标为可见
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
      );

      els.forEach((el) => {
        // 立即检查是否已在视口
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
          el.classList.add('is-visible');
        } else {
          io.observe(el);
        }
      });

      // 5 秒兜底：所有还没显示的强制显示
      const fallback = setTimeout(() => {
        document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
          el.classList.add('is-visible');
        });
      }, 5000);

      // cleanup is handled by parent return
      window.__legacyIO = io;
      window.__legacyFallback = fallback;
    }, 50);

    // Scroll progress bar
    const bar = document.querySelector('.scroll-progress');
    const onScroll = () => {
      if (!bar) return;
      const h = document.documentElement;
      const scrolled = h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1);
      bar.style.transform = `scaleX(${Math.min(scrolled, 1)})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      clearTimeout(timer);
      if (window.__legacyIO) window.__legacyIO.disconnect();
      if (window.__legacyFallback) clearTimeout(window.__legacyFallback);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]); // 关键：路由变化时重新执行

  return null;
}
