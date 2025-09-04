// Simple localStorage-backed store with defaults
const LS_KEY = 'ar_site_content_v1'

const defaults = {
  header: {
    visible: true,
    logo: '',
    // Bilingual nav labels with defaults (SV/EN)
    nav: {
      home: { sv: 'Hem', en: 'Home' },
      auctions: { sv: 'Kommande auktioner', en: 'Upcoming auctions' },
      items: { sv: 'Auktionsvaror', en: 'Auction items' },
      terms: { sv: 'Auktionsvillkor', en: 'Terms' },
    },
    // Active languages toggles
    languages: { sv: true, en: true },
  },
  hero: {
    visible: true,
    bg: '',
    nextAuctions: [
      { name: 'Hindås Rotundan', date: '24/2-2024', mapEmbed: '' },
      { name: 'Ullareds Bygdegård', date: '25/2-2024', mapEmbed: '' },
    ],
    // Bilingual CTA text with defaults (SV/EN)
    cta: { text: { sv: 'Hitta Hit', en: 'Get Directions' }, link: '#auctions' },
  },
  auctions: {
    visible: true,
    list: [
      {
        title: 'Hindås Rotundan 24/2-2024',
        address: 'Rävlandavägen 15, 438 53 Hindås',
        mapEmbed: '',
        viewing: '13:00 - 14:00',
        date: '2024-02-24',
        start: '14:00',
      },
      {
        title: 'Ullareds Bygdegård 25/2-2024',
        address: 'Ullareds bygdegård, Skolvägen 12, 311 60 Ullared',
        mapEmbed: '',
        viewing: '13:00 - 14:00',
        date: '2024-02-25',
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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Normalize legacy single-language values to bilingual structures
function normalize(content) {
  const out = deepClone(content)
  try {
    // header.nav.* may be strings from older data; convert to {sv, en}
    if (out.header && out.header.nav) {
      for (const key of ['home', 'auctions', 'items', 'terms']) {
        const v = out.header.nav[key]
        if (typeof v === 'string') {
          const enDefault = defaults.header.nav[key].en
          out.header.nav[key] = { sv: v, en: enDefault }
        } else if (v && typeof v === 'object') {
          // ensure both sv and en exist
          out.header.nav[key].sv = out.header.nav[key].sv ?? defaults.header.nav[key].sv
          out.header.nav[key].en = out.header.nav[key].en ?? defaults.header.nav[key].en
        } else if (v == null) {
          out.header.nav[key] = deepClone(defaults.header.nav[key])
        }

    // Normalize auctions.list date: if missing, try extract from title like "... 24/2-2024"
    if (out.auctions && Array.isArray(out.auctions.list)) {
      out.auctions.list = out.auctions.list.map((it) => {
        const next = { ...it }
        if (!next.date && typeof next.title === 'string') {
          const m = next.title.match(/(\d{1,2})\/(\d{1,2})-(\d{4})/) // dd/m-YYYY
          if (m) {
            const dd = m[1], mm = m[2], yyyy = m[3]
            next.date = `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`
          }
        }
        return next
      })
    }
      }
    }

    // hero.cta.text may be string; convert to {sv, en}
    if (out.hero && out.hero.cta) {
      const t = out.hero.cta.text
      if (typeof t === 'string') {
        out.hero.cta.text = { sv: t, en: defaults.hero.cta.text.en }
      } else if (t && typeof t === 'object') {
        out.hero.cta.text.sv = t.sv ?? defaults.hero.cta.text.sv
        out.hero.cta.text.en = t.en ?? defaults.hero.cta.text.en
      } else if (t == null) {
        out.hero.cta.text = deepClone(defaults.hero.cta.text)
      }
    }

    // Normalize hero.nextAuctions date format to ISO (YYYY-MM-DD)
    if (out.hero && Array.isArray(out.hero.nextAuctions)) {
      out.hero.nextAuctions = out.hero.nextAuctions.map((it) => {
        const next = { ...it }
        if (typeof next.date === 'string' && /\d{1,2}\/\d{1,2}-\d{4}/.test(next.date)) {
          // Format like 24/2-2024 => 2024-02-24
          try {
            const [dPart, yPart] = next.date.split('-')
            const [dd, mm] = dPart.split('/')
            const yyyy = yPart
            const iso = `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`
            next.date = iso
          } catch {}
        }
        return next
      })
    }
  } catch {
    // noop normalization errors
  }
  return out
}

export function loadContent() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return deepClone(defaults)
    const parsed = JSON.parse(raw)
    const merged = { ...deepClone(defaults), ...parsed }
    return normalize(merged)
  } catch {
    return deepClone(defaults)
  }
}

export function saveContent(content) {
  localStorage.setItem(LS_KEY, JSON.stringify(content))
}

export function resetContent() {
  localStorage.setItem(LS_KEY, JSON.stringify(defaults))
}
