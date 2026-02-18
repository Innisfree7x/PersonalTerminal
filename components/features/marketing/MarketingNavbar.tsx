'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-[#0A0A0A]/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white text-sm font-bold tracking-tight">P</span>
          </div>
          <span className="text-[#FAF0E6] font-semibold text-lg tracking-tight">Prism</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm text-zinc-400 hover:text-[#FAF0E6] transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-sm text-zinc-400 hover:text-[#FAF0E6] transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-sm text-zinc-400 hover:text-[#FAF0E6] transition-colors">
            About
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <TrackedCtaLink
            href="/auth/login"
            eventName="landing_cta_secondary_clicked"
            eventPayload={{ source: 'navbar', variant: 'login' }}
            className="text-sm text-zinc-400 hover:text-[#FAF0E6] transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Login
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'navbar', variant: 'primary' }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.97]"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </TrackedCtaLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-[#FAF0E6] rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Navigation öffnen"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0A0A0A] px-4 py-4 space-y-1">
          {[
            { href: '/features', label: 'Features' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/about', label: 'About' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-zinc-400 hover:text-[#FAF0E6] py-2.5 px-1 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            <TrackedCtaLink
              href="/auth/login"
              eventName="landing_cta_secondary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'login' }}
              className="text-sm text-zinc-400 text-center py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Login
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'primary' }}
              className="text-sm font-semibold bg-red-500 text-white text-center py-2.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Get Started →
            </TrackedCtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
