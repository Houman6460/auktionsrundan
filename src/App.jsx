import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { trackPageView, trackSectionView } from './services/analytics'
import { useTranslation } from 'react-i18next'
import Header from './components/Header.jsx'
import SeoHead from './components/SeoHead.jsx'
import NewsletterPopup from './components/NewsletterPopup.jsx'
import Loader from './components/Loader.jsx'
import LazySection from './components/LazySection.jsx'
const Hero = React.lazy(() => import('./sections/Hero.jsx'))
const Auctions = React.lazy(() => import('./sections/Auctions.jsx'))
const Items = React.lazy(() => import('./sections/Items.jsx'))
const Testimonials = React.lazy(() => import('./sections/Testimonials.jsx'))
const Terms = React.lazy(() => import('./sections/Terms.jsx'))
const Contact = React.lazy(() => import('./sections/Contact.jsx'))
const InstagramFeed = React.lazy(() => import('./sections/InstagramFeed.jsx'))
const FAQ = React.lazy(() => import('./sections/FAQ.jsx'))
const FAQPreview = React.lazy(() => import('./sections/FAQPreview.jsx'))
const LiveAction = React.lazy(() => import('./sections/LiveAction.jsx'))
const ActionsHistory = React.lazy(() => import('./sections/ActionsHistory.jsx'))
const Footer = React.lazy(() => import('./components/Footer.jsx'))
const Admin = React.lazy(() => import('./admin/Admin.jsx'))
const ChatWidget = React.lazy(() => import('./components/ChatWidget.jsx'))
const ShareMenu = React.lazy(() => import('./components/ShareMenu.jsx'))

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
  const location = useLocation()
  // Track page views
  React.useEffect(() => {
    try { trackPageView(location.pathname + (location.hash || '')) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash])
  // Track section views on home page
  React.useEffect(() => {
    if (location.pathname !== '/') return
    const ids = ['auctions','items','testimonials','terms','instagram','faq']
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!els.length) return
    const seen = new Set()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = en.target.id
          if (!seen.has(id)) {
            seen.add(id)
            try { trackSectionView(id) } catch {}
          }
        }
      })
    }, { threshold: 0.4 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])
  return (
    <div className="min-h-screen bg-vintage-cream text-vintage-black">
      <Header />
      <SeoHead />
      <NewsletterPopup />
      <ScrollToHash />
      <React.Suspense fallback={<Loader variant="page" label={t('loading') || 'Laddar…'} />}>
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
              <section id="testimonials" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <LazySection><Testimonials /></LazySection>
                </div>
              </section>
              <section id="terms" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">{t('nav.terms')}</h2>
                  <Terms />
                </div>
              </section>
              <section className="scroll-mt-24">
                <div className="container mx-auto px-4 py-8">
                  <LazySection><FAQPreview /></LazySection>
                </div>
              </section>
              <section id="instagram" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <h2 className="text-3xl font-serif mb-6">Instagram</h2>
                  <LazySection><InstagramFeed /></LazySection>
                </div>
              </section>
              <section id="faq" className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <LazySection><FAQ /></LazySection>
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
          path="/actions"
          element={
            <main>
              <section className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <ActionsHistory />
                </div>
              </section>
              <Footer />
            </main>
          }
        />
        <Route
          path="/action/:id"
          element={
            <main>
              <section className="scroll-mt-24">
                <div className="container mx-auto px-4 py-16">
                  <LiveAction />
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
        <Route
          path="/contact"
          element={
            <main>
              <section className="scroll-mt-24">
                <Contact />
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
      </React.Suspense>
    </div>
  )
}
