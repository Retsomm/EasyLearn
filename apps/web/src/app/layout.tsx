import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import '@/index.css'

export const metadata: Metadata = {
  title: 'EasyLearn — 邊玩邊學 JavaScript 與 React',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EasyLearn',
  },
  icons: {
    icon: [
      { url: '/icon-40.png', sizes: '40x40', type: 'image/png' },
      { url: '/icon-87.png', sizes: '87x87', type: 'image/png' },
      { url: '/icon-120.png', sizes: '120x120', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#04070a',
}

// 在 hydrate 前就先把使用者選過的主題套到 <html data-theme>，避免畫面先閃一下預設主題
// 才變成使用者實際選的主題。<html> 因此需要 suppressHydrationWarning：這個 script 執行完
// 之後 <html> 的屬性會跟伺服器端算出來的初始 HTML 不一樣，那是預期中的行為。
const themeInitScript = `
try {
  var t = localStorage.getItem('easylearn-theme-v1');
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}
`

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="zh-TW" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Grotesk:wght@500;600;700;800&family=Rajdhani:wght@500;600;700&family=Cinzel:wght@500;600;700&family=Orbitron:wght@600;700;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
            rel="stylesheet"
          />
          {/* eslint-disable-next-line react/no-danger */}
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

export default RootLayout
