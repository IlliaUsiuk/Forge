import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Forge',
  description: 'Куй себя каждый день',
  icons: {
    icon: '/forge-logo.svg',
    apple: '/forge-logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DZT1CCGPVQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DZT1CCGPVQ');
          `}
        </Script>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
