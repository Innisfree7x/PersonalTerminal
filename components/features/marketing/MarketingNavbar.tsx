'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/60 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/35 to-transparent" />
      <div className="marketing-container h-[74px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25 transition-transform duration-300 group-hover:scale-105">
            <span className="text-white text-sm font-bold tracking-tight">P</span>
            <div className="absolute -inset-px rounded-xl border border-white/30 mix-blend-overlay" />
          </div>
          <span className="text-[#FAF0E6] font-semibold text-lg tracking-tight">Prism</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] p-1">
          <Link href="/features" className="rounded-full px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-[#FAF0E6]">
            Features
          </Link>
          <Link href="/pricing" className="rounded-full px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-[#FAF0E6]">
            Pricing
          </Link>
          <Link href="/about" className="rounded-full px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-[#FAF0E6]">
            About
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <TrackedCtaLink
            href="/auth/login"
            eventName="landing_cta_secondary_clicked"
            eventPayload={{ source: 'navbar', variant: 'login' }}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-[#FAF0E6]"
          >
            Login
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'navbar', variant: 'primary' }}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 active:translate-y-0"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </TrackedCtaLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-zinc-300 transition hover:bg-white/10 hover:text-[#FAF0E6] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Navigation öffnen"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0A0A0A]/95 px-5 py-4 space-y-1 md:hidden">
          {[
            { href: '/features', label: 'Features' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/about', label: 'About' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-[#FAF0E6]"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
            <TrackedCtaLink
              href="/auth/login"
              eventName="landing_cta_secondary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'login' }}
              className="rounded-lg border border-white/10 py-2.5 text-center text-sm text-zinc-300 transition hover:bg-white/10 hover:text-[#FAF0E6]"
            >
              Login
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'primary' }}
              className="rounded-lg bg-red-500 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Get Started →
            </TrackedCtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
