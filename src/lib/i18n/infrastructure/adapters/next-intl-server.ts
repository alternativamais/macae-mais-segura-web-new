import { getTranslations, getLocale } from "next-intl/server"
import { ITranslator, Locale } from "../../domain/ports/translator"

function createTranslatorAdapter(translations: any, currentLocale: Locale): ITranslator {
  const translate = ((key: string, params?: Record<string, string | number>) => {
    try {
      return translations(key, params)
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing server message for locale "${currentLocale}": ${key}`, error)
      }

      return key
    }
  }) as ITranslator

  translate.t = translate
  translate.getLocale = () => currentLocale

  return translate
}

export class NextIntlServerAdapter {
  static async create(namespace?: string): Promise<ITranslator> {
    const locale = (await getLocale()) as Locale
    const translations = await getTranslations({ locale, namespace })
    return createTranslatorAdapter(translations, locale)
  }
}
