import {getRequestConfig} from 'next-intl/server';

const messages = {
  en: () => import('../messages/en.json'),
  fa: () => import('../messages/fa.json'),
};

export type Locale = keyof typeof messages;
export const locales = Object.keys(messages) as Locale[];
export const defaultLocale: Locale = 'fa';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale;

  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await messages[locale]()).default,
  };
});
