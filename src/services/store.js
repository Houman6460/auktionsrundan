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
      { name: 'Hindås Rotundan', date: '24/2-2024' },
      { name: 'Ullareds Bygdegård', date: '25/2-2024' },
    ],
    cta: { text: 'Hitta Hit', link: '#auctions' },
  },
  auctions: {
    visible: true,
    list: [
      {
        title: 'Hindås Rotundan 24/2-2024',
        address: 'Rävlandavägen 15, 438 53 Hindås',
        mapEmbed: '',
        viewing: '13:00 - 14:00',
        start: '14:00',
      },
      {
        title: 'Ullareds Bygdegård 25/2-2024',
        address: 'Ullareds bygdegård, Skolvägen 12, 311 60 Ullared',
        mapEmbed: '',
        viewing: '13:00 - 14:00',
        start: '14:00',
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
      auktionsvillkor: 'Samtliga varor förmedlade av Auktionsrundan säljs i befintligt skick. Avgivet bud är bindande, och inropad vara kan inte bytas eller återlämnas, om ej annat avtalas med företrädare eller kundtjänst. Det är kundens ansvar att kontrollera varan före påbörjad auktion.',
      klubbaslagsavgift: 'Provision tillkommer på samtliga varor med 25% inkl. moms och eventuellt Droit de Suite.',
      betalning: 'Betalning skall ske under besöket (eller pågående) auktion. Avtal kan göras med företrädare eller kundtjänst angående eventuell kredit vid inköp för större belopp. Möjliga betalalternativ: Swish, kontant eller kreditköp enligt enskilt avtal med kundtjänst.',
      allman: 'Vi har ingen förutbestämd turordning på godset som ropas ut under auktionen. Ni som kunder bestämmer vad som ropas ut genom att säga till vår personal, så ser de till att just “era” varor kommer fram. Vår hänga lista eller katalog över varorna som säljs. Detta på grund av att vårt sortiment uppdateras dagligen. Vi har inga utropspriser. Detta beror på att vi inte säljer enligt katalog eller lista. I vissa fall kan det förekomma ett redovisningsansvar hos oss. Då anges ett lägsta startbud på befintlig vara. Fråga personalen, kundtjänst eller företrädare för mer exakt information.',
      utropspriser: 'Vi har inga utropspriser och bevakning sker inte enligt katalog eller lista. I vissa fall kan ett redovisningsansvar förekomma hos oss; då anges ett lägsta startbud på befintlig vara. Fråga personal, kundtjänst eller företrädare för mer exakt information.',
      ursprung: 'Vi säljer varor av butiker och företag som har genomgått konkurs eller ska avveckla sin verksamhet, men även från andra företag som väljer att sälja sina varor genom oss. I enstaka fall säljer vi exklusiva varor åt privatpersoner.',
      viktigt: 'Innan ni börjar bjuda är det viktigt att ni tagit del av våra auktions- och försäljningsregler. Dessa finner ni på baksidan av ert kundnummer, som ni får när ni registrerar er hos kundtjänst. Det kostar inget att registrera er och ni förbinder er inte att köpa eller bjuda på något föremål.\n\nSkulle det förekomma att ni inte bjuder eller ropar in något föremål makuleras era uppgifter automatiskt. Skulle ni däremot vara intresserade av nyhetsbrev eller information om kommande auktioner kan ni meddela detta till vår kundtjänst. Då läggs ni till i vårt kundregister.',
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
    phone: '+46707221645',
    email: 'artavenuesweden@gmail.com',
    address: '',
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
