import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import CommandPaletteProvider from "@/components/shared/CommandPaletteProvider";
import { Analytics } from "@vercel/analytics/react";

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
        <QueryProvider>
          <CommandPaletteProvider>
            {children}
          </CommandPaletteProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
