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
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'border-b border-white/[0.05] bg-[#0A0A0C]/85 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl' : 'bg-transparent'}`}>
      <div className={`mx-auto w-full max-w-7xl px-6 sm:px-10 flex items-center justify-between transition-all duration-500 ${scrolled ? 'h-14' : 'h-16'}`}>
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <BrandLockup
            sizeClassName="h-7 w-7"
            className="transition-transform duration-300 group-hover:scale-[1.02]"
            wordmarkClassName="text-[#FAF0E6] font-medium text-[1.5rem] tracking-[-0.02em]"
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-2 text-[14px] transition-colors duration-200 ${
                  isActive
                    ? 'text-[#FAF0E6]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[#E8B930]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <TrackedCtaLink
            href="/auth/login"
            eventName="landing_cta_secondary_clicked"
            eventPayload={{ source: 'navbar', variant: 'login' }}
            className="px-4 py-2 text-[14px] text-zinc-500 transition-colors hover:text-[#FAF0E6]"
          >
            Login
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/auth/signup"
            eventName="landing_cta_primary_clicked"
            eventPayload={{ source: 'navbar', variant: 'primary' }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#E8B930] px-5 text-[13px] font-semibold text-[#0A0A0C] transition-all duration-300 hover:bg-[#F0CA50] hover:shadow-lg hover:shadow-[#E8B930]/15 active:scale-[0.97]"
          >
            Starten
            <ArrowRight className="w-3 h-3" />
          </TrackedCtaLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-zinc-500 transition hover:text-[#FAF0E6] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Navigation öffnen"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.04] bg-[#0A0A0C]/95 backdrop-blur-2xl px-6 py-5 space-y-1 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-[15px] text-zinc-500 transition hover:text-[#FAF0E6]"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-4 mt-2">
            <TrackedCtaLink
              href="/auth/login"
              eventName="landing_cta_secondary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'login' }}
              className="rounded-lg py-3 text-center text-[15px] text-zinc-500 transition hover:text-[#FAF0E6]"
            >
              Login
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/auth/signup"
              eventName="landing_cta_primary_clicked"
              eventPayload={{ source: 'navbar_mobile', variant: 'primary' }}
              className="rounded-lg bg-[#E8B930] py-3 text-center text-[14px] font-semibold text-[#0A0A0C] transition hover:bg-[#F0CA50]"
            >
              Kostenlos starten →
            </TrackedCtaLink>
          </div>
        </div>
      )}
    </header>
  );
}
