import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import '../index.css'

export const metadata: Metadata = {
  title: 'EasyLearn — 邊玩邊學 JavaScript 與 React',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EasyLearn',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐣</text></svg>',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#201d29',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="zh-TW">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

export default RootLayout
