import { useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { ITranslator, Locale } from "../../domain/ports/translator"

function createTranslatorAdapter(translations: any, currentLocale: Locale): ITranslator {
  const translate = ((key: string, params?: Record<string, string | number>) => {
    try {
      return translations(key, params)
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing client message for locale "${currentLocale}": ${key}`, error)
      }

      return key
    }
  }) as ITranslator

  translate.t = translate
  translate.getLocale = () => currentLocale

  return translate
}

export function useNextIntlClientAdapter(namespace?: string): ITranslator {
  const t = useTranslations(namespace)
  const locale = useLocale() as Locale

  return useMemo(() => createTranslatorAdapter(t, locale), [locale, t])
}
