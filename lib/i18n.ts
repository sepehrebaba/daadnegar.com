import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import faTranslation from "@/public/locales/fa.json";
import enTranslation from "@/public/locales/en.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      fa: { translation: faTranslation },
      en: { translation: enTranslation },
    },
    lng: "fa",
    fallbackLng: "fa",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
