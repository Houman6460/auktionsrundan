// Simple localStorage-backed store with defaults
const LS_KEY = 'ar_site_content_v1'

const defaults = {
  header: {
    visible: true,
    logo: '',
    nav: {
      home: 'Hem',
      auctions: 'Kommande auktioner',
      items: 'Auktionsvaror',
      terms: 'Auktionsvillkor',
    },
    languages: { sv: true, en: true },
  },
  hero: {
    visible: true,
    bg: '',
    nextAuctions: [
      { name: 'Vårauktion', date: '2025-10-01' },
    ],
    cta: { text: 'Hitta Hit', link: '#auctions' },
  },
  auctions: {
    visible: true,
    list: [
      {
        title: 'Auktion i Stockholm',
        address: 'Storgatan 1, Stockholm',
        mapEmbed: 'https://www.google.com/maps?q=Stockholm&output=embed',
        viewing: '12:00 - 14:00',
        start: '15:00',
      },
    ],
  },
  items: {
    visible: true,
    categories: {
      Möbler: [],
      Mattor: [],
      Skulpturer: [],
    },
  },
  terms: {
    visible: true,
    blocks: {
      auktionsvillkor: 'Standardvillkor...',
      klubbaslagsavgift: 'Avgiftsinformation...',
      betalning: 'Betalningsinformation...',
      allman: 'Allmän information...',
      utropspriser: 'Om utropspriser och bevakning...',
      ursprung: 'Var kommer varorna ifrån?...',
      viktigt: 'Viktigt att veta innan auktion...',
    },
  },
  instagram: {
    visible: true,
    username: '',
    token: '',
    layout: 'grid',
  },
  footer: {
    visible: true,
    phone: '',
    email: '',
    address: 'Adress här',
    logo: '',
    social: { instagram: '', facebook: '', website: '' },
    newsletter: true,
  },
}

export function loadContent() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return JSON.parse(JSON.stringify(defaults))
    const parsed = JSON.parse(raw)
    return { ...JSON.parse(JSON.stringify(defaults)), ...parsed }
  } catch {
    return JSON.parse(JSON.stringify(defaults))
  }
}

export function saveContent(content) {
  localStorage.setItem(LS_KEY, JSON.stringify(content))
}

export function resetContent() {
  localStorage.setItem(LS_KEY, JSON.stringify(defaults))
}
