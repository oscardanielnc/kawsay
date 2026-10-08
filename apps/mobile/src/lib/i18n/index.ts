import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';

/** All user-facing text goes through i18next; keys in English, Spanish by default (ADR 0006). */
export const resources = { es: { translation: es } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
