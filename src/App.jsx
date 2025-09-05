import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './components/Header.jsx'
import NewsletterPopup from './components/NewsletterPopup.jsx'
import Hero from './sections/Hero.jsx'
import Auctions from './sections/Auctions.jsx'
import Items from './sections/Items.jsx'
import Terms from './sections/Terms.jsx'
import InstagramFeed from './sections/InstagramFeed.jsx'
import FAQ from './sections/FAQ.jsx'
import Footer from './components/Footer.jsx'
import Admin from './admin/Admin.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import ShareMenu from './components/ShareMenu.jsx'

function ScrollToHash() {
  const { hash } = useLocation()
  React.useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash])
  return null
}

export default function App() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-vintage-cream text-vintage-black">
      <Header />
      <NewsletterPopup />
      <ScrollToHash />
      <Routes>
        <Route
          path="/"
          element={
            <main>
              <Hero />
              <section id="auctions" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.auctions')}</h2>
                  <Auctions />
                </div>
              </section>
              <section id="items" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.items')}</h2>
                  <Items />
                </div>
              </section>
              <section id="terms" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.terms')}</h2>
                  <Terms />
                </div>
              </section>
              <section id="instagram" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">Instagram</h2>
                  <InstagramFeed />
                </div>
              </section>
              <section id="faq" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <FAQ />
                </div>
              </section>
              <Footer />
            </main>
          }
        />
        <Route
          path="/auctions"
          element={
            <main>
              <section className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.auctions')}</h2>
                  <Auctions />
                </div>
              </section>
              <Footer />
            </main>
          }
        />
        <Route
          path="/items"
          element={
            <main>
              <section className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.items')}</h2>
                  <Items />
                </div>
              </section>
              <Footer />
            </main>
          }
        />
        <Route
          path="/terms"
          element={
            <main>
              <section className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.terms')}</h2>
                  <Terms />
                </div>
              </section>
              <Footer />
            </main>
          }
        />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<div className="p-8">Not Found. <Link to="/" className="underline">{t('nav.home')}</Link></div>} />
      </Routes>
      <ChatWidget />
      <ShareMenu />
    </div>
  )
}
