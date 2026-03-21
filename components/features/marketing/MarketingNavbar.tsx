'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';

/**
 * MarketingNavbar — Minimal, transparent, disappears into the page.
 *
 * PRISMA-style: Logo + CTA only in desktop. No nav links cluttering the view.
 * On scroll: subtle backdrop blur.
 */
export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ${
        scrolled
          ? 'border-b border-white/[0.04] bg-black/70 backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-10">
        {/* Wordmark — no icon, just text */}
        <Link href="/" className="text-[18px] font-semibold tracking-[-0.02em] text-white">
          INNIS
        </Link>

        {/* Desktop: minimal links + CTA */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/features" className="text-[13px] text-zinc-500 transition-colors hover:text-white">
            Features
          </Link>
          <Link href="/pricing" className="text-[13px] text-zinc-500 transition-colors hover:text-white">
            Preise
          </Link>
          <TrackedCtaLink
            href="/auth/login"
            eventName="landing_cta_secondary_clicked"
            eventPayload={{ source: 'navbar', variant: 'login' }}
            className="text-[13px] text-zinc-500 transition-colors hover:text-white"
          >
            Login
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'navbar', variant: 'primary' }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black transition-all duration-300 hover:bg-zinc-200 active:scale-[0.97]"
          >
            Starten
            <ArrowRight className="h-3 w-3" />
          </TrackedCtaLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-zinc-500 transition hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Navigation"
          aria-expanded={mobileOpen}
          aria-controls="marketing-mobile-nav"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="marketing-mobile-nav"
          className="border-t border-white/[0.04] bg-black/95 px-6 py-5 backdrop-blur-2xl md:hidden"
        >
          <div className="space-y-1">
            <Link
              href="/features"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-[15px] text-zinc-500 transition hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-[15px] text-zinc-500 transition hover:text-white"
            >
              Preise
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.04] pt-4">
            <TrackedCtaLink
              href="/auth/login"
              eventName="landing_cta_secondary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'login' }}
              className="rounded-lg py-3 text-center text-[15px] text-zinc-500 transition hover:text-white"
            >
              Login
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'primary' }}
              className="rounded-lg bg-white py-3 text-center text-[14px] font-semibold text-black transition hover:bg-zinc-200"
            >
              Kostenlos starten →
            </TrackedCtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
