import '../styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'MirrorMoney — See what your spending could’ve become',
  description: 'MirrorMoney turns past purchases into a risk-free, “what-if” portfolio—learn investing by reflection, not regret.',
  openGraph: {
    title: 'MirrorMoney',
    description: 'See what your spending could’ve become.',
    url: 'https://www.money-mirror.com',
    siteName: 'MirrorMoney',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
