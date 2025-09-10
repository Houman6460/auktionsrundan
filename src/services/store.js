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
    // Gallery display options
    thumbnailsEnabled: true, // show thumbnails band under each auction
    slideshowEnabled: true,  // show golden‑ratio slideshow banner above each auction
    slideshowIntervalMs: 3500, // default autoplay interval for slideshow
    list: [
      {
        title: { sv: 'Hindås Rotundan 24/2-2024', en: 'Hindås Rotundan 24/2-2024' },
        address: { sv: 'Rävlandavägen 15, 438 53 Hindås', en: 'Rävlandavägen 15, 438 53 Hindås' },
        img: '',
        images: [],
        mapEmbed: '',
        viewing: { sv: '13:00 - 14:00', en: '13:00 - 14:00' },
        date: '2024-02-24',
        start: '14:00',
      },
      {
        title: { sv: 'Ullareds Bygdegård 25/2-2024', en: 'Ullareds Bygdegård 25/2-2024' },
        address: { sv: 'Ullareds bygdegård, Skolvägen 12, 311 60 Ullared', en: 'Ullareds bygdegård, Skolvägen 12, 311 60 Ullared' },
        img: '',
        images: [],
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
  // Sliders configuration (auto-scrolling components)
  slider: {
    events: {
      enabled: true,
      title: { sv: 'Kommande auktioner', en: 'Upcoming auctions' },
      speed: 40, // pixels per second
    },
  },
  // Social share settings
  share: {
    enabled: true,
    coverUrl: '',
    text: { sv: 'Kolla in Auktionsrundan!', en: 'Check out Auktionsrundan!' },
    position: 'right', // 'right' | 'left'
    platforms: { facebook: true, twitter: true, linkedin: true, telegram: true, copy: true },
  },
  // Registration settings and collected submissions
  registration: {
    enabled: true,
    fields: { name: true, email: true, tel: true, notes: false },
    questions: [
      {
        id: 'looking',
        label: { sv: 'Vad letar du efter?', en: 'What are you looking for?' },
        options: ['Möbler','Mattor','Skulpturer'],
      }
    ],
    // submissions keyed by auction anchor id (e.g., "auction-0"): array of entries
    submissions: {}
  },
  // Demo Live Actions: one ongoing and one past with sample items
  actions: {
    order: ['act-demo-now','act-demo-past'],
    events: {
      'act-demo-now': {
        id: 'act-demo-now',
        title: { sv: 'Live Auktion Demo (Pågår)', en: 'Live Auction Demo (Ongoing)' },
        startIso: '',
        visible: false,
        linkedAuctionIndex: 0,
        items: [
          { title: { sv: 'Antik väggklocka', en: 'Antique Wall Clock' }, desc: { sv: 'Fungerande, tidigt 1900-tal.', en: 'Working, early 20th century.' }, tags: ['antik','klocka'], startPrice: '300', img: 'https://images.unsplash.com/photo-1497493292307-31c376b6e479?q=80&w=1600&auto=format&fit=crop', sold: true,  finalPrice: '800' },
          { title: { sv: 'Oljemålning, landskap', en: 'Oil Painting, Landscape' }, desc: { sv: 'Signerad, ramad.', en: 'Signed, framed.' }, tags: ['konst','målning'], startPrice: '900', img: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '1400' },
          { title: { sv: 'Matta, persisk', en: 'Rug, Persian' }, desc: { sv: 'Ull, bra skick.', en: 'Wool, good condition.' }, tags: ['matta','persisk'], startPrice: '1500', img: 'https://images.unsplash.com/photo-1582582494700-1cdfd6d58f95?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Karmstol, vintage', en: 'Vintage Armchair' }, desc: { sv: 'Trä och tyg, bekväm.', en: 'Wood and fabric, comfortable.' }, tags: ['möbler','stol'], startPrice: '700', img: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '1150' },
          { title: { sv: 'Bordslampa, mässing', en: 'Brass Table Lamp' }, desc: { sv: 'Ny el, fungerar.', en: 'Rewired, working.' }, tags: ['belysning','lampa'], startPrice: '450', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Vitrinskåp', en: 'Display Cabinet' }, desc: { sv: 'Glasdörrar, 1900-tal.', en: 'Glass doors, 20th century.' }, tags: ['möbler','skåp'], startPrice: '1800', img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Silverbestick (6 pers)', en: 'Silver Cutlery (6p)' }, desc: { sv: 'Komplett set.', en: 'Complete set.' }, tags: ['silver','bestick'], startPrice: '1200', img: 'https://images.unsplash.com/photo-1610398502695-932ce4c317b4?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Vas, keramik', en: 'Ceramic Vase' }, desc: { sv: 'Handgjord.', en: 'Handmade.' }, tags: ['keramik','inredning'], startPrice: '250', img: 'https://images.unsplash.com/photo-1612198186444-8f3fbd3a1f3b?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '420' },
          { title: { sv: 'Spegel, förgylld', en: 'Gilded Mirror' }, desc: { sv: 'Dekorativ ram.', en: 'Decorative frame.' }, tags: ['inredning','spegel'], startPrice: '900', img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Soffbord, teak', en: 'Teak Coffee Table' }, desc: { sv: 'Skandinaviskt 60-tal.', en: 'Scandinavian 60s.' }, tags: ['möbler','bord'], startPrice: '1100', img: 'https://images.unsplash.com/photo-1622015663319-f06a2e6c6c5a?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Kristallkrona', en: 'Crystal Chandelier' }, desc: { sv: 'Komplett, fungerande.', en: 'Complete, working.' }, tags: ['belysning','krona'], startPrice: '2400', img: 'https://images.unsplash.com/photo-1503951458645-643d53bfd90f?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Byrå, ek', en: 'Oak Dresser' }, desc: { sv: 'Fyra lådor.', en: 'Four drawers.' }, tags: ['möbler','byrå'], startPrice: '1600', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Kista, allmoge', en: 'Folk Art Chest' }, desc: { sv: 'Målad, 1800-tal.', en: 'Painted, 19th century.' }, tags: ['allmoge','kista'], startPrice: '2000', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Karaff, kristall', en: 'Crystal Decanter' }, desc: { sv: 'Slipad kristall.', en: 'Cut crystal.' }, tags: ['kristall','karaff'], startPrice: '500', img: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Pinnstolar, 4 st', en: 'Windsor Chairs, set of 4' }, desc: { sv: 'Stabila.', en: 'Sturdy.' }, tags: ['möbler','stolar'], startPrice: '900', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '1600' },
          { title: { sv: 'Tavla, abstrakt', en: 'Abstract Painting' }, desc: { sv: 'Signatur n.a.', en: 'Unsigned.' }, tags: ['konst','abstrakt'], startPrice: '700', img: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Klocka, golvur', en: 'Grandfather Clock' }, desc: { sv: 'Behöver service.', en: 'Needs service.' }, tags: ['antik','klocka'], startPrice: '2200', img: 'https://images.unsplash.com/photo-1497493292307-31c376b6e479?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Bokhylla, teak', en: 'Teak Bookcase' }, desc: { sv: 'Just ställbar.', en: 'Adjustable shelves.' }, tags: ['möbler','hylla'], startPrice: '1400', img: 'https://images.unsplash.com/photo-1455885662569-0b3b988f77f8?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Servis, Rörstrand', en: 'Rörstrand Dinnerware' }, desc: { sv: '24 delar.', en: '24 pieces.' }, tags: ['porslin'], startPrice: '800', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '1200' },
          { title: { sv: 'Matbord, ek', en: 'Oak Dining Table' }, desc: { sv: '6–8 pers.', en: 'Seats 6–8.' }, tags: ['möbler','bord'], startPrice: '2800', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
        ],
        settings: {
          durationMinutes: 60,
          postMinutes: 10,
          publicDisplay: { showTotals: true, showSold: true },
          feedback: { enabled: true, rating: true, notes: true, contact: true },
          messages: { thankYou: { sv: 'Tack! Vi uppskattar din feedback.', en: 'Thank you! We appreciate your feedback.' } }
        },
        state: { started: true, currentIndex: 4, startedAt: Date.now() - 3*60*1000, endedAt: 0, salesLog: [
          { index: 0, price: 800, ts: Date.now() - 160*1000 },
          { index: 1, price: 1400, ts: Date.now() - 140*1000 },
          { index: 3, price: 1150, ts: Date.now() - 120*1000 },
          { index: 7, price: 420, ts: Date.now() - 60*1000 },
          { index: 14, price: 1600, ts: Date.now() - 40*1000 },
          { index: 19, price: 0, ts: Date.now() - 10*1000 } // placeholder future sale
        ] },
        feedbackSubmissions: []
      },
      'act-demo-past': {
        id: 'act-demo-past',
        title: { sv: 'Live Auktion Maj 2025', en: 'Live Auction May 2025' },
        startIso: '',
        visible: true,
        linkedAuctionIndex: 1,
        items: [
          { title: { sv: 'Porslin, servis', en: 'Porcelain Set' }, desc: { sv: '12 delar.', en: '12 pieces.' }, tags: ['porslin'], startPrice: '400', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1600&auto=format&fit=crop', sold: true,  finalPrice: '950' },
          { title: { sv: 'Golvlampa', en: 'Floor Lamp' }, desc: { sv: 'Fint skick.', en: 'Great condition.' }, tags: ['belysning'], startPrice: '300', img: 'https://images.unsplash.com/photo-1538688423619-a81d3f23454b?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Skåp, 1900-tal', en: 'Cabinet, 20th century' }, desc: { sv: 'Massivt trä.', en: 'Solid wood.' }, tags: ['möbler'], startPrice: '1200', img: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '2200' },
          { title: { sv: 'Servett-ringar, silver', en: 'Napkin Rings, Silver' }, desc: { sv: '6 st.', en: 'Set of 6.' }, tags: ['silver'], startPrice: '350', img: 'https://images.unsplash.com/photo-1598300183876-81c52694f3b8?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '620' },
          { title: { sv: 'Spegel, art deco', en: 'Art Deco Mirror' }, desc: { sv: 'Originalglas.', en: 'Original glass.' }, tags: ['spegel'], startPrice: '800', img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
          { title: { sv: 'Fåtölj, läder', en: 'Leather Armchair' }, desc: { sv: 'Patinerad.', en: 'Lovely patina.' }, tags: ['möbler','fåtölj'], startPrice: '1800', img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '2600' },
          { title: { sv: 'Ljusstakar, mässing', en: 'Brass Candlesticks' }, desc: { sv: 'Par.', en: 'Pair.' }, tags: ['inredning'], startPrice: '300', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1600&auto=format&fit=crop', sold: true, finalPrice: '550' },
          { title: { sv: 'Vas, blå keramik', en: 'Blue Ceramic Vase' }, desc: { sv: 'Signerad.', en: 'Signed.' }, tags: ['keramik'], startPrice: '250', img: 'https://images.unsplash.com/photo-1612198186444-8f3fbd3a1f3b?q=80&w=1600&auto=format&fit=crop', sold: false, finalPrice: '' },
        ],
        settings: {
          durationMinutes: 60,
          postMinutes: 10,
          publicDisplay: { showTotals: true, showSold: true },
          feedback: { enabled: true, rating: true, notes: true, contact: true },
          messages: { thankYou: { sv: 'Tack! Vi uppskattar din feedback.', en: 'Thank you! We appreciate your feedback.' } }
        },
        state: { started: false, currentIndex: 2, startedAt: Date.now() - 60*60*1000, endedAt: Date.now() - 30*60*1000, salesLog: [ { index: 0, price: 950, ts: Date.now() - 55*60*1000 }, { index: 2, price: 2200, ts: Date.now() - 40*60*1000 } ] },
        feedbackSubmissions: []
      }
    }
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
    // Ensure registration section exists and normalize
    if (!out.registration || typeof out.registration !== 'object') {
      out.registration = deepClone(defaults.registration)
    } else {
      out.registration.enabled = out.registration.enabled ?? defaults.registration.enabled
      const f = out.registration.fields || {}
      out.registration.fields = {
        name: f.name !== false,
        email: f.email !== false,
        tel: !!f.tel,
        notes: !!f.notes,
      }
      const q = Array.isArray(out.registration.questions) ? out.registration.questions : []
      out.registration.questions = q.map((it, i) => ({
        id: it.id || `q${i+1}`,
        label: (typeof it.label === 'object') ? { sv: it.label.sv ?? '', en: it.label.en ?? '' } : { sv: String(it.label||''), en: String(it.label||'') },
        options: Array.isArray(it.options) ? it.options : [],
      }))
      if (!out.registration.submissions || typeof out.registration.submissions !== 'object') {
        out.registration.submissions = {}
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

    // Normalize auctions list and gallery toggles
    if (out.auctions && Array.isArray(out.auctions.list)) {
      // Ensure gallery flags exist at auctions level
      out.auctions.thumbnailsEnabled = out.auctions.thumbnailsEnabled !== false
      out.auctions.slideshowEnabled = out.auctions.slideshowEnabled !== false
      const iv = parseInt(out.auctions.slideshowIntervalMs, 10)
      out.auctions.slideshowIntervalMs = Number.isFinite(iv) ? iv : defaults.auctions.slideshowIntervalMs
      out.auctions.list = out.auctions.list.map((it) => {
        const next = { ...it }
        // bilingual fields
        next.title = ensureBilingual(next.title)
        next.address = ensureBilingual(next.address)
        next.viewing = ensureBilingual(next.viewing)
        if (typeof next.img !== 'string') next.img = ''
        if (!Array.isArray(next.images)) next.images = []
        next.images = next.images.filter((s) => typeof s === 'string')
        // migrate single img into images if images empty
        if (next.img && next.images.length === 0) next.images = [next.img]
        // keep img in sync as primary image
        next.img = next.images[0] || next.img || ''
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
    // Ensure slider config exists
    if (!out.slider || typeof out.slider !== 'object') {
      out.slider = deepClone(defaults.slider)
    } else {
      const ev = out.slider.events || {}
      const ensureBilingual = (val, enDefault='') => {
        if (typeof val === 'string') return { sv: val, en: enDefault }
        if (val && typeof val === 'object') return { sv: val.sv ?? '', en: val.en ?? enDefault }
        return { sv: '', en: enDefault }
      }
      out.slider.events = {
        enabled: ev.enabled !== false,
        title: ensureBilingual(ev.title, defaults.slider.events.title.en),
        speed: Number.isFinite(parseInt(ev.speed,10)) ? parseInt(ev.speed,10) : defaults.slider.events.speed,
      }
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
  // Update local revision for polling diff
  try { localStorage.setItem('ar_content_rev', String(Date.now())) } catch {}
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const ch = new BroadcastChannel('ar_content_sync')
      ch.postMessage({ key: LS_KEY, ts: Date.now() })
      ch.close()
    }
  } catch {}
  // Best-effort push to server for cross-device sync (requires KV binding in Cloudflare)
  try {
    fetch('/api/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(content),
      cache: 'no-store'
    }).then(async (res) => {
      try {
        const data = await res.json().catch(()=>({}))
        if (data && data.rev) localStorage.setItem('ar_content_rev', String(data.rev))
      } catch {}
    }).catch(()=>{})
  } catch {}
}

export function resetContent() {
  localStorage.setItem(LS_KEY, JSON.stringify(defaults))
}
