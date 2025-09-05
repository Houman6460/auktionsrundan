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
        sectionOff: 'Sektionen är avstängd.',
        registerBtn: 'Registrera besök',
        reg_title: 'Registrering',
        reg_name: 'Namn',
        reg_email: 'E-post',
        reg_tel: 'Telefon',
        reg_notes: 'Meddelande',
        reg_submit: 'Skicka',
        reg_thanks: 'Tack! Vi har registrerat din intresseanmälan.'
      },
      footer: {
        follow: 'Följ oss i sociala medier',
        credit: 'skapad av Logoland Design med ❤️ '
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
        sectionOff: 'This section is disabled.',
        registerBtn: 'Register to visit',
        reg_title: 'Registration',
        reg_name: 'Name',
        reg_email: 'Email',
        reg_tel: 'Phone',
        reg_notes: 'Message',
        reg_submit: 'Submit',
        reg_thanks: 'Thanks! Your registration has been recorded.'
      },
      footer: {
        follow: 'Follow us on social media',
        credit: 'created by Logoland Design with ❤️ '
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
