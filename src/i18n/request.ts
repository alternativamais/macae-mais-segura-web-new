import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, localeCookieName } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/domain/ports/translator';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get(localeCookieName)?.value;
  const locale = localeFromCookie && locales.includes(localeFromCookie as Locale)
    ? localeFromCookie
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
