import { II18nConfig, Locale } from "./domain/ports/translator";

export const locales: Locale[] = ['pt-BR', 'en-US'];
export const defaultLocale: Locale = 'pt-BR';
export const localeCookieName = 'NEXT_LOCALE';

export const i18nConfig: II18nConfig = {
  defaultLocale,
  locales,
  localeCookieName,
};
