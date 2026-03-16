'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { TrackedCtaLink } from './TrackedCtaLink';
import { BrandLockup } from '@/components/shared/BrandLogo';

export function MarketingNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Preise' },
    { href: '/about', label: 'Über INNIS' },
  ] as const;

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? 'border-[#D4AF37]/10 bg-[#050508]/90 shadow-lg shadow-black/40' : 'border-white/[0.06] bg-[#050508]/60'}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent" />
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 h-[64px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <BrandLockup
            sizeClassName="h-8 w-8"
            className="transition-transform duration-300 group-hover:scale-[1.02]"
            wordmarkClassName="text-[#FAF0E6] font-medium text-[1.65rem] tracking-[-0.02em]"
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-1.5 text-sm transition ${
                  isActive
                    ? 'bg-white/[0.08] text-[#FAF0E6]'
                    : 'text-zinc-400 hover:bg-white/[0.06] hover:text-[#FAF0E6]'
                }`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-[#D4AF37]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          <TrackedCtaLink
            href="/auth/login"
            eventName="landing_cta_secondary_clicked"
            eventPayload={{ source: 'navbar', variant: 'login' }}
            className="inline-flex h-10 items-center rounded-full border border-white/[0.08] px-4 text-sm text-zinc-400 transition hover:border-[#D4AF37]/20 hover:text-[#FAF0E6]"
          >
            Login
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'navbar', variant: 'primary' }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-[#050508] transition-all hover:-translate-y-0.5 hover:bg-[#E0C068] hover:shadow-lg hover:shadow-[#D4AF37]/20 active:translate-y-0"
          >
            Kostenlos starten
            <ArrowRight className="w-3.5 h-3.5" />
          </TrackedCtaLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-[#FAF0E6] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Navigation öffnen"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#050508]/95 px-5 py-4 space-y-1 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-[#FAF0E6]"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3">
            <TrackedCtaLink
              href="/auth/login"
              eventName="landing_cta_secondary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'login' }}
              className="rounded-lg border border-white/[0.08] py-2.5 text-center text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-[#FAF0E6]"
            >
              Login
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'primary' }}
              className="rounded-lg bg-[#D4AF37] py-2.5 text-center text-sm font-semibold text-[#050508] transition hover:bg-[#E0C068]"
            >
              Kostenlos starten →
            </TrackedCtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
