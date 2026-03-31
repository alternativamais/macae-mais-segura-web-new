export type Locale = 'pt-BR' | 'en-US';

export interface ITranslator {
  (key: string, params?: Record<string, string | number>): string;
  /**
   * Traduz uma chave com parâmetros opcionais.
   */
  t(key: string, params?: Record<string, string | number>): string;
  
  /**
   * Retorna o locale atual.
   */
  getLocale(): Locale;
}

export interface II18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
  localeCookieName: string;
}
