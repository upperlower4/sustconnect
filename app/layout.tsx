import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeProvider from '@/components/layout/ThemeProvider' // ✅ নতুন
import PushInit from '@/components/PushInit' // ✅ নতুন

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://sustconnect.vercel.app'),
  title: { default: 'SUST Connect', template: '%s | SUST Connect' },
  description: 'শাহজালাল বিশ্ববিদ্যালয়ের নিজস্ব সোশ্যাল নেটওয়ার্ক',
  keywords: ['SUST', 'Shahjalal University', 'SUST Connect', 'SUST job', 'SUST notice'],
  openGraph: {
    type: 'website',
    siteName: 'SUST Connect',
    title: 'SUST Connect',
    description: 'শাহজালাল বিশ্ববিদ্যালয়ের নিজস্ব সোশ্যাল নেটওয়ার্ক',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e8187a" />
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const t = localStorage.getItem('sust-theme');
              const theme = t ? JSON.parse(t).state?.theme : 'dark';
              if (theme === 'light') document.documentElement.classList.add('light');
            } catch(e) {}
          `
        }} />
      </head>
      <body>
        <ThemeProvider> {/* ✅ এটা আগে ছিল না */}
          <PushInit /> {/* ✅ এটা আগে ছিল না */}
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--surf)',
                color: 'var(--txt)',
                border: '1px solid var(--bdr)',
                fontSize: '13px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}