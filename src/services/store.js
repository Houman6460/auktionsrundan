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
      { name: { sv: 'Hindås Rotundan', en: 'Hindås Rotundan' }, date: '24/2-2024', time: '14:00', mapEmbed: '' },
      { name: { sv: 'Ullareds Bygdegård', en: 'Ullareds Bygdegård' }, date: '25/2-2024', time: '14:00', mapEmbed: '' },
    ],
    // Bilingual CTA text with defaults (SV/EN)
    cta: { text: { sv: 'Hitta Hit', en: 'Get Directions' }, link: '#auctions' },
  },
  auctions: {
    visible: true,
    list: [
      {
        title: { sv: 'Hindås Rotundan 24/2-2024', en: 'Hindås Rotundan 24/2-2024' },
        address: { sv: 'Rävlandavägen 15, 438 53 Hindås', en: 'Rävlandavägen 15, 438 53 Hindås' },
        mapEmbed: '',
        viewing: { sv: '13:00 - 14:00', en: '13:00 - 14:00' },
        date: '2024-02-24',
        start: '14:00',
      },
      {
        title: { sv: 'Ullareds Bygdegård 25/2-2024', en: 'Ullareds Bygdegård 25/2-2024' },
        address: { sv: 'Ullareds bygdegård, Skolvägen 12, 311 60 Ullared', en: 'Ullareds bygdegård, Skolvägen 12, 311 60 Ullared' },
        mapEmbed: '',
        viewing: { sv: '13:00 - 14:00', en: '13:00 - 14:00' },
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
      auktionsvillkor: { sv: 'Samtliga varor förmedlade av Auktionsrundan säljs i befintligt skick. Avgivet bud är bindande, och inropad vara kan inte bytas eller återlämnas, om ej annat avtalas med företrädare eller kundtjänst. Det är kundens ansvar att kontrollera varan före påbörjad auktion.', en: 'All items mediated by Auktionsrundan are sold as-is. Placed bids are binding, and items won cannot be exchanged or returned unless otherwise agreed with a representative or customer service. It is the customer’s responsibility to inspect the item before the auction begins.' },
      klubbaslagsavgift: { sv: 'Provision tillkommer på samtliga varor med 25% inkl. moms och eventuellt Droit de Suite.', en: 'A commission of 25% including VAT will be added to all items, and Droit de Suite may apply when relevant.' },
      betalning: { sv: 'Betalning skall ske under besöket (eller pågående) auktion. Avtal kan göras med företrädare eller kundtjänst angående eventuell kredit vid inköp för större belopp. Möjliga betalalternativ: Swish, kontant eller kreditköp enligt enskilt avtal med kundtjänst.', en: 'Payment must be made during your visit (or the ongoing) auction. Agreements regarding possible credit for larger purchases can be made with a representative or customer service. Accepted payment methods: Swish, cash, or credit purchase according to a separate agreement with customer service.' },
      allman: { sv: 'Vi har ingen förutbestämd turordning på godset som ropas ut under auktionen. Ni som kunder bestämmer vad som ropas ut genom att säga till vår personal, så ser de till att just “era” varor kommer fram. Vår hänga lista eller katalog över varorna som säljs. Detta på grund av att vårt sortiment uppdateras dagligen. Vi har inga utropspriser. Detta beror på att vi inte säljer enligt katalog eller lista. I vissa fall kan det förekomma ett redovisningsansvar hos oss. Då anges ett lägsta startbud på befintlig vara. Fråga personalen, kundtjänst eller företrädare för mer exakt information.', en: 'There is no predetermined order in which items are auctioned. You, as customers, decide what is called up by informing our staff, who will bring forward your selected items. We do not maintain a fixed list or catalogue of items for sale, as our assortment is updated daily. We have no starting prices because we do not sell from a catalogue or list. In some cases, we may have an accounting obligation; then a minimum starting bid is specified for the item. Ask the staff, customer service, or a representative for precise information.' },
      utropspriser: { sv: 'Vi har inga utropspriser och bevakning sker inte enligt katalog eller lista. I vissa fall kan ett redovisningsansvar förekomma hos oss; då anges ett lägsta startbud på befintlig vara. Fråga personal, kundtjänst eller företrädare för mer exakt information.', en: 'We have no starting prices, and no reserves are set according to a catalogue or list. In certain cases we may have an accounting obligation; in such cases a minimum starting bid will be specified for the item. Please ask the staff, customer service, or a representative for exact information.' },
      ursprung: { sv: 'Vi säljer varor av butiker och företag som har genomgått konkurs eller ska avveckla sin verksamhet, men även från andra företag som väljer att sälja sina varor genom oss. I enstaka fall säljer vi exklusiva varor åt privatpersoner.', en: 'We sell goods from shops and companies that have gone bankrupt or are winding down their operations, as well as from other companies that choose to sell their goods through us. In rare cases, we sell exclusive items on behalf of private individuals.' },
      viktigt: { sv: 'Innan ni börjar bjuda är det viktigt att ni tagit del av våra auktions- och försäljningsregler. Dessa finner ni på baksidan av ert kundnummer, som ni får när ni registrerar er hos kundtjänst. Det kostar inget att registrera er och ni förbinder er inte att köpa eller bjuda på något föremål.\n\nSkulle det förekomma att ni inte bjuder eller ropar in något föremål makuleras era uppgifter automatiskt. Skulle ni däremot vara intresserade av nyhetsbrev eller information om kommande auktioner kan ni meddela detta till vår kundtjänst. Då läggs ni till i vårt kundregister.', en: 'Before you start bidding, it is important that you have read our auction and sales rules. You will find these on the back of your customer number, which you receive when you register with customer service. Registration is free, and you are not obliged to buy or bid on any item.\n\nIf you do not place any bids or win any items, your details will be automatically deleted. If, however, you are interested in our newsletter or information about upcoming auctions, please inform our customer service and you will be added to our customer register.' },
    },
  },
  instagram: {
    visible: true,
    username: '',
    token: '',
    layout: 'grid',
  },
  // Frequently Asked Questions (bilingual)
  faq: {
    visible: true,
    items: [
      {
        q: { sv: 'Hur fungerar era auktioner?', en: 'How do your auctions work?' },
        a: { sv: 'Vi håller löpande live-auktioner på plats. Du registrerar ett kundnummer i kundtjänst och ropar in varor på plats.', en: 'We run live in-person auctions. Register a customer number at customer service and bid on-site.' }
      },
      {
        q: { sv: 'Vilka betalningsmetoder accepterar ni?', en: 'What payment methods do you accept?' },
        a: { sv: 'Swish, kontanter eller enligt separat överenskommelse.', en: 'Swish, cash or by separate agreement.' }
      },
    ],
  },
  // Global Google Maps settings configurable from Admin
  maps: {
    visible: true,
    apiKey: '',
    defaultZoom: 14,
    language: 'sv', // 'sv' | 'en'
  },
  footer: {
    visible: true,
    phone: '+46707221645',
    email: 'artavenuesweden@gmail.com',
    address: { sv: '', en: '' },
    logo: '',
    social: { instagram: '', facebook: '', website: '' },
    newsletter: true,
  },
  // Simple chat config (WhatsApp)
  chat: {
    enabled: true,
    provider: 'whatsapp', // only 'whatsapp' supported for now
    phoneE164: '+46707221645',
    greeting: { sv: 'Hej! Jag har en fråga om auktionen.', en: 'Hello! I have a question about the auction.' },
    position: 'right', // 'right' | 'left'
  },
  // Newsletter popup configuration and defaults
  newsletter: {
    popupEnabled: true,
    title: { sv: 'Håll dig uppdaterad', en: 'Stay informed' },
    subtitle: { sv: 'Vi informerar dig om nästa auktion.', en: 'We will inform you about the next auction.' },
    fields: { name: true, email: true, tel: false },
    triggers: {
      mode: 'timer', // 'timer' | 'scroll'
      delayMs: 5000, // used when mode === 'timer'
      scrollPercent: 50, // used when mode === 'scroll'
      oncePerSession: true,
    },
  },
  ratings: {
    enabled: true,
  },
  // Social share settings
  share: {
    enabled: true,
    coverUrl: '',
    text: { sv: 'Kolla in Auktionsrundan!', en: 'Check out Auktionsrundan!' },
    position: 'right', // 'right' | 'left'
    platforms: { facebook: true, twitter: true, linkedin: true, telegram: true, copy: true },
  },
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Normalize legacy single-language values to bilingual structures
function normalize(content) {
  const out = deepClone(content)
  try {
    const ensureBilingual = (val, enDefault='') => {
      if (typeof val === 'string') return { sv: val, en: enDefault }
      if (val && typeof val === 'object') return { sv: val.sv ?? '', en: val.en ?? enDefault }
      return { sv: '', en: enDefault }
    }
    // Ensure chat section exists and normalize
    if (!out.chat || typeof out.chat !== 'object') {
      out.chat = deepClone(defaults.chat)
    } else {
      out.chat.enabled = out.chat.enabled ?? defaults.chat.enabled
      out.chat.provider = 'whatsapp'
      out.chat.phoneE164 = typeof out.chat.phoneE164 === 'string' ? out.chat.phoneE164 : defaults.chat.phoneE164
      const g = out.chat.greeting
      if (typeof g === 'string') {
        out.chat.greeting = { sv: g, en: g }
      } else if (g && typeof g === 'object') {
        out.chat.greeting = { sv: g.sv ?? defaults.chat.greeting.sv, en: g.en ?? defaults.chat.greeting.en }
      } else {
        out.chat.greeting = deepClone(defaults.chat.greeting)
      }
      out.chat.position = out.chat.position === 'left' ? 'left' : 'right'
    }
    // Ensure newsletter config exists and normalize shape
    if (!out.newsletter || typeof out.newsletter !== 'object') {
      out.newsletter = deepClone(defaults.newsletter)
    } else {
      out.newsletter.popupEnabled = out.newsletter.popupEnabled ?? defaults.newsletter.popupEnabled
      const ensureBilingual = (val, enDefault='') => {
        if (typeof val === 'string') return { sv: val, en: enDefault }
        if (val && typeof val === 'object') return { sv: val.sv ?? '', en: val.en ?? enDefault }
        return { sv: '', en: enDefault }
      }
      out.newsletter.title = ensureBilingual(out.newsletter.title, defaults.newsletter.title.en)
      out.newsletter.subtitle = ensureBilingual(out.newsletter.subtitle, defaults.newsletter.subtitle.en)
      const f = out.newsletter.fields || {}
      out.newsletter.fields = { name: !!f.name, email: f.email !== false, tel: !!f.tel }
      const t = out.newsletter.triggers || {}
      out.newsletter.triggers = {
        mode: t.mode === 'scroll' ? 'scroll' : 'timer',
        delayMs: Number.isFinite(parseInt(t.delayMs,10)) ? parseInt(t.delayMs,10) : defaults.newsletter.triggers.delayMs,
        scrollPercent: Number.isFinite(parseInt(t.scrollPercent,10)) ? parseInt(t.scrollPercent,10) : defaults.newsletter.triggers.scrollPercent,
        oncePerSession: t.oncePerSession !== false,
      }
    }
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
      }
    }

    // Normalize auctions.list bilingual fields and date: if missing, try extract from title like "... 24/2-2024"
    if (out.auctions && Array.isArray(out.auctions.list)) {
      out.auctions.list = out.auctions.list.map((it) => {
        const next = { ...it }
        // bilingual fields
        next.title = ensureBilingual(next.title)
        next.address = ensureBilingual(next.address)
        next.viewing = ensureBilingual(next.viewing)
        if (!next.date && typeof next.title?.sv === 'string') {
          const m = next.title.sv.match(/(\d{1,2})\/(\d{1,2})-(\d{4})/) // dd/m-YYYY
          if (m) {
            const dd = m[1], mm = m[2], yyyy = m[3]
            next.date = `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`
          }
        }
        return next
      })
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

    // Normalize hero.nextAuctions: bilingual name, date format to ISO (YYYY-MM-DD) and ensure time exists
    if (out.hero && Array.isArray(out.hero.nextAuctions)) {
      out.hero.nextAuctions = out.hero.nextAuctions.map((it) => {
        const next = { ...it }
        next.name = ensureBilingual(next.name)
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
        if (typeof next.time !== 'string') {
          next.time = ''
        }
        return next
      })
    }

    // terms.blocks: ensure bilingual and prefill EN with defaults if missing or empty
    if (out.terms && out.terms.blocks) {
      for (const k of Object.keys(out.terms.blocks)) {
        const val = out.terms.blocks[k]
        const def = (defaults.terms && defaults.terms.blocks && defaults.terms.blocks[k]) || { sv: '', en: '' }
        if (typeof val === 'string') {
          out.terms.blocks[k] = { sv: val, en: def.en }
        } else if (val && typeof val === 'object') {
          const sv = (typeof val.sv === 'string') ? val.sv : (def.sv || '')
          const en = (typeof val.en === 'string' && val.en.trim() !== '') ? val.en : (def.en || '')
          out.terms.blocks[k] = { sv, en }
        } else {
          out.terms.blocks[k] = { sv: def.sv || '', en: def.en || '' }
        }
      }
    }

    // footer address bilingual
    if (out.footer) {
      out.footer.address = ensureBilingual(out.footer.address)
    }
    // Ensure items.categories object exists
    if (!out.items || typeof out.items !== 'object') {
      out.items = deepClone(defaults.items)
    } else {
      if (!out.items.categories || typeof out.items.categories !== 'object') {
        out.items.categories = deepClone(defaults.items.categories)
      }
      out.items.visible = out.items.visible ?? defaults.items.visible
      // Normalize each item inside categories to bilingual fields and priceSek
      try {
        const cats = out.items.categories || {}
        for (const catName of Object.keys(cats)) {
          const arr = Array.isArray(cats[catName]) ? cats[catName] : []
          out.items.categories[catName] = arr.map((it) => {
            const next = { ...it }
            next.name = ensureBilingual(next.name)
            next.type = ensureBilingual(next.type)
            next.size = ensureBilingual(next.size)
            if (next.priceSek == null) next.priceSek = ''
            if (typeof next.priceSek === 'number') next.priceSek = String(next.priceSek)
            return next
          })
        }
      } catch {}
    }
    // Ensure maps section exists with sane defaults
    if (!out.maps || typeof out.maps !== 'object') {
      out.maps = deepClone(defaults.maps)
    } else {
      out.maps.visible = out.maps.visible ?? defaults.maps.visible
      out.maps.apiKey = typeof out.maps.apiKey === 'string' ? out.maps.apiKey : ''
      const dz = parseInt(out.maps.defaultZoom, 10)
      out.maps.defaultZoom = Number.isFinite(dz) ? dz : defaults.maps.defaultZoom
      out.maps.language = out.maps.language === 'en' ? 'en' : 'sv'
    }
    // Ensure FAQ section exists and normalize structure
    if (!out.faq || typeof out.faq !== 'object') {
      out.faq = deepClone(defaults.faq)
    } else {
      out.faq.visible = out.faq.visible ?? defaults.faq.visible
      const arr = Array.isArray(out.faq.items) ? out.faq.items : []
      out.faq.items = arr.map((it) => {
        const next = { ...it }
        const ensureBilingual = (val) => {
          if (typeof val === 'string') return { sv: val, en: '' }
          if (val && typeof val === 'object') return { sv: val.sv ?? '', en: val.en ?? '' }
          return { sv: '', en: '' }
        }
        next.q = ensureBilingual(next.q)
        next.a = ensureBilingual(next.a)
        return next
      })
    }
    // Ensure ratings section exists
    if (!out.ratings || typeof out.ratings !== 'object') {
      out.ratings = deepClone(defaults.ratings)
    } else {
      out.ratings.enabled = out.ratings.enabled ?? defaults.ratings.enabled
    }
    // Ensure share section exists and normalize
    if (!out.share || typeof out.share !== 'object') {
      out.share = deepClone(defaults.share)
    } else {
      out.share.enabled = out.share.enabled ?? defaults.share.enabled
      out.share.coverUrl = typeof out.share.coverUrl === 'string' ? out.share.coverUrl : ''
      const t = out.share.text
      if (typeof t === 'string') {
        out.share.text = { sv: t, en: t }
      } else if (t && typeof t === 'object') {
        out.share.text = { sv: t.sv ?? defaults.share.text.sv, en: t.en ?? defaults.share.text.en }
      } else {
        out.share.text = deepClone(defaults.share.text)
      }
      out.share.position = out.share.position === 'left' ? 'left' : 'right'
      const p = out.share.platforms || {}
      out.share.platforms = {
        facebook: p.facebook !== false,
        twitter: p.twitter !== false,
        linkedin: p.linkedin !== false,
        telegram: p.telegram !== false,
        copy: p.copy !== false,
      }
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
