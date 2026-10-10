import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { generateWebApplicationSchema } from "@/lib/structuredData";

// Inter is only the fallback: Apple devices render the system font (SF Pro) first.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'CrankDoc — Motorcycle Diagnostic Troubleshooting',
    template: '%s | CrankDoc',
  },
  description: 'Step-by-step motorcycle diagnostic troubleshooting guides for Honda, Yamaha, Kawasaki, Harley-Davidson, and BMW. Interactive decision trees, DTC code lookup, VIN decoder, and service intervals.',
  metadataBase: new URL('https://crankdoc.vercel.app'),
  openGraph: {
    title: 'CrankDoc — Motorcycle Diagnostic Troubleshooting',
    description: 'Interactive diagnostic decision trees for motorcycle mechanics',
    url: 'https://crankdoc.vercel.app',
    siteName: 'CrankDoc',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CrankDoc',
    description: 'Motorcycle diagnostic troubleshooting guides',
  },
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="antialiased bg-background text-foreground"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[12px] focus:bg-inverse focus:px-4 focus:py-2 focus:text-inverse-foreground"
        >
          Skip to main content
        </a>
        <JsonLd data={generateWebApplicationSchema()} />
        <OfflineIndicator />
        <div className="flex min-h-screen flex-col">
          <Navigation />
          <main id="main-content" className="flex-1 pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
        </div>
        <InstallPrompt />
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}
