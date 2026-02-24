import { createI18n } from 'vue-i18n'
import uz from './uz.json'
import ru from './ru.json'
import shifoAIUz from './locales/shifoAI-uz.json'
import shifoAIRu from './locales/shifoAI-ru.json'

// localStorage'dan saqlangan tilni olish
const savedLocale = localStorage.getItem('locale') || 'uz'

const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: savedLocale, // default til
  fallbackLocale: 'uz', // fallback til
  messages: {
    uz: { ...uz, shifoAI: shifoAIUz },
    ru: { ...ru, shifoAI: shifoAIRu },
  },
  // Global scope'da $t ishlatish uchun
  globalInjection: true,
})

export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

export default i18n
