import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { generateWebApplicationSchema } from "@/lib/structuredData";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
    'theme-color': '#F2E8D8',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <JsonLd data={generateWebApplicationSchema()} />
        <div className="flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
        <InstallPrompt />
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}
