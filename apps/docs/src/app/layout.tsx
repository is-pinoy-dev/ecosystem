import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import type { Metadata } from 'next';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

const sansFont = IBM_Plex_Sans({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-sans',
});

const monoFont = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.is-pinoy.dev'),
  title: {
    template: '%s | is-pinoy.dev docs',
    default: 'is-pinoy.dev docs',
  },
  description: 'Documentation for the is-pinoy.dev ecosystem.',
  openGraph: {
    siteName: 'is-pinoy.dev docs',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`flex flex-col min-h-screen ${pixelFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
