import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, localeCookieName } from '@/lib/i18n/config';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get(localeCookieName)?.value;
  const locale = (locales.includes(localeFromCookie as any) ? localeFromCookie : defaultLocale) as string;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
