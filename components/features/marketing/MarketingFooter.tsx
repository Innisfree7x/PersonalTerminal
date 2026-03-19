import Link from 'next/link';
import { BrandLockup } from '@/components/shared/BrandLogo';

export function MarketingFooter() {
  const linkClass = 'marketing-footer-link text-[14px] text-zinc-600 transition-colors hover:text-zinc-300';

  return (
    <footer className="relative">
      <div className="premium-divider" />
      <div className="marketing-container py-20">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 md:gap-16 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-6 inline-flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80">
              <BrandLockup
                sizeClassName="h-7 w-7"
                className="gap-2.5"
                wordmarkClassName="font-medium text-[#FAF0E6] tracking-tight text-lg"
              />
            </Link>
            <p className="max-w-[220px] text-[13px] leading-relaxed text-zinc-600">
              Das persoenliche Dashboard fuer Studenten mit parallelen High-Stakes-Zielen.
            </p>
          </div>

          {/* Produkt */}
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Produkt</p>
            <ul className="space-y-3.5">
              {[
                { href: '/features', label: 'Features' },
                { href: '/pricing', label: 'Preise' },
                { href: '/about', label: 'Ueber INNIS' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App */}
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">App</p>
            <ul className="space-y-3.5">
              {[
                { href: '/auth/signup', label: 'Konto erstellen' },
                { href: '/auth/login', label: 'Anmelden' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Legal</p>
            <ul className="space-y-3.5">
              {[
                { href: '/privacy', label: 'Datenschutz' },
                { href: '/terms', label: 'Nutzungsbedingungen' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-10 sm:flex-row">
          <p className="text-[12px] text-zinc-600">&copy; 2026 INNIS. Alle Rechte vorbehalten.</p>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-[12px] text-zinc-600">Fuer Studenten gebaut &middot; WS 2025/26</p>
            <a
              href="mailto:vietdobusiness@gmail.com"
              className="marketing-footer-link text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              vietdobusiness@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
