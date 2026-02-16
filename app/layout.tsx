import type { Metadata } from "next";
import { Inter } from 'next/font/google';
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

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Prism - Personal Productivity System",
  description: "Modern productivity system for managing goals, career applications, university courses, and daily tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
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
