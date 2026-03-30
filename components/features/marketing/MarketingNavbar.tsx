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
export function MarketingNavbar({ activeStop }: { activeStop?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (activeStop !== undefined) return;

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeStop]);

  const isElevated = mobileOpen || (activeStop !== undefined ? activeStop > 0 : scrolled);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ${
        isElevated
          ? 'border-b border-white/[0.03] bg-[#020204]/80 backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-10">
        {/* Wordmark — OS style */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="font-mono text-[16px] font-bold tracking-[-0.02em] text-white">
            INNIS
          </span>
        </Link>

        {/* Desktop: minimal links + CTA */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/features" className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-white">
            Features
          </Link>
          <Link href="/pricing" className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-white">
            Preise
          </Link>
          <TrackedCtaLink
            href="/auth/login"
            eventName="landing_cta_secondary_clicked"
            eventPayload={{ source: 'navbar', variant: 'login' }}
            className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
          >
            Login
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'navbar', variant: 'primary' }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-5 font-mono text-[11px] uppercase tracking-widest font-bold text-white transition-all duration-300 hover:shadow-glow active:scale-[0.97]"
          >
            Initialize
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
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-400 transition hover:border-white/[0.12] hover:text-white"
            >
              Login
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'primary' }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[0.18em] font-semibold text-white shadow-[0_0_24px_rgba(232,185,48,0.2)] transition hover:shadow-[0_0_32px_rgba(232,185,48,0.28)]"
            >
              Initialize
              <ArrowRight className="h-3.5 w-3.5" />
            </TrackedCtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
