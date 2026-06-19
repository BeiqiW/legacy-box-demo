import { cookies } from 'next/headers';

// Server-only: read the current locale from the `lang` cookie (defaults to English).
export function getLocale() {
  try {
    return cookies().get('lang')?.value === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

// Re-export the client-safe helpers so server components can import everything from one place.
export { pick, loc, c, COMMON } from './i18n';
