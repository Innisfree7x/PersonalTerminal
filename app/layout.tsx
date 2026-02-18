import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import CommandPaletteProvider from "@/components/shared/CommandPaletteProvider";
import { FocusTimerProvider } from "@/components/providers/FocusTimerProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SoundProvider } from "@/components/providers/SoundProvider";
import PerformanceMonitor from "@/components/providers/PerformanceMonitor";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

function resolveSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return new URL(raw);
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: 'INNIS | Personal Productivity System',
    template: '%s | INNIS',
  },
  description:
    'INNIS kombiniert Studium, Aufgaben, Ziele und Karriere in einem schnellen persönlichen Dashboard.',
  openGraph: {
    title: 'INNIS | Personal Productivity System',
    description:
      'INNIS kombiniert Studium, Aufgaben, Ziele und Karriere in einem schnellen persönlichen Dashboard.',
    type: 'website',
    siteName: 'INNIS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INNIS | Personal Productivity System',
    description:
      'INNIS kombiniert Studium, Aufgaben, Ziele und Karriere in einem schnellen persönlichen Dashboard.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            <SoundProvider>
              <QueryProvider>
                <FocusTimerProvider>
                  <CommandPaletteProvider>
                    {children}
                  </CommandPaletteProvider>
                  <PerformanceMonitor />
                </FocusTimerProvider>
              </QueryProvider>
            </SoundProvider>
          </ThemeProvider>
        </AuthProvider>
        <ToastProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
