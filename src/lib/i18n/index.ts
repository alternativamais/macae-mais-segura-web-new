import { NextIntlServerAdapter } from "./infrastructure/adapters/next-intl-server";
import { useNextIntlClientAdapter } from "./infrastructure/adapters/next-intl-client";
import { ITranslator } from "./domain/ports/translator";

/**
 * Injeção de Dependência para Server Components.
 */
export async function getServerTranslator(namespace?: string): Promise<ITranslator> {
  return await NextIntlServerAdapter.create(namespace);
}

/**
 * Injeção de Dependência para Client Components.
 */
export function useTranslator(namespace?: string): ITranslator {
  return useNextIntlClientAdapter(namespace);
}

export * from './domain/ports/translator';
export * from './config';
