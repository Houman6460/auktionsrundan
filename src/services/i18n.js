import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  sv: {
    translation: {
      nav: {
        home: 'Hem',
        auctions: 'Kommande auktioner',
        items: 'Auktionsvaror',
        terms: 'Auktionsvillkor',
        admin: 'Admin'
      },
      hero: {
        nextAuction: 'Nästa Auktion',
        findUs: 'Hitta Hit'
      }
    }
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        auctions: 'Upcoming Auctions',
        items: 'Auction Items',
        terms: 'Terms',
        admin: 'Admin'
      },
      hero: {
        nextAuction: 'Next Auction',
        findUs: 'Find Us'
      }
    }
  }
}

const savedLang = localStorage.getItem('lang') || 'sv'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'sv',
    interpolation: { escapeValue: false },
  })

export default i18n
