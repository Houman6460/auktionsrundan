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
      },
      auctions: {
        viewing: 'Visning',
        start: 'Start',
        date: 'Datum',
        countdown: 'Nedräkning',
        noMap: 'Ingen karta',
        none: 'Inga planerade auktioner.',
        sectionOff: 'Sektionen är avstängd.'
      },
      footer: {
        follow: 'Följ oss i sociala medier'
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
      },
      auctions: {
        viewing: 'Viewing',
        start: 'Start',
        date: 'Date',
        countdown: 'Countdown',
        noMap: 'No map',
        none: 'No scheduled auctions.',
        sectionOff: 'This section is disabled.'
      },
      footer: {
        follow: 'Follow us on social media'
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
