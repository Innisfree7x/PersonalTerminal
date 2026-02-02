import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Bloomberg Personal",
  description: "Personal productivity system for managing goals, career, and studies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
