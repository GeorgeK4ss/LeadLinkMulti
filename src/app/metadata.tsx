import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LeadLink CRM",
  description: "Modern CRM for managing leads and customers",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LeadLink CRM"
  },
  metadataBase: new URL('https://leadlink-crm.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'LeadLink CRM',
    description: 'Comprehensive CRM system for managing leads and customers',
    url: 'https://leadlink-crm.com',
    siteName: 'LeadLink CRM',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LeadLink CRM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadLink CRM',
    description: 'Comprehensive CRM system for managing leads and customers',
    creator: '@leadlinkcrm',
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
}; 