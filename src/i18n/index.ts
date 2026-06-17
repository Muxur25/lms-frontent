import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next);

export const initI18n = () =>
  i18n.init({
    lng: localStorage.getItem('i18nextLng') || 'uz',
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'ru'],
    backend: {
      loadPath: '/locales/{{lng}}/translation.json?v=' + (import.meta.env?.PROD ? '1.0.4' : Date.now()),
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
