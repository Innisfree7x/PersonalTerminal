import Link from 'next/link';
import { BrandLockup } from '@/components/shared/BrandLogo';

export function MarketingFooter() {
  return (
    <footer className="relative">
      <div className="premium-divider" />
      <div className="marketing-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-5 flex items-center gap-2.5">
              <BrandLockup
                sizeClassName="h-7 w-7"
                className="gap-2.5"
                wordmarkClassName="font-medium text-[#FAF0E6] tracking-tight text-lg"
              />
            </Link>
            <p className="max-w-[200px] text-[13px] leading-relaxed text-zinc-600">
              Das persönliche Dashboard für Studenten.
            </p>
          </div>

          {/* Produkt */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Produkt</p>
            <ul className="space-y-3">
              {[
                { href: '/features', label: 'Features' },
                { href: '/pricing', label: 'Preise' },
                { href: '/about', label: 'Über INNIS' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-zinc-600 transition-colors hover:text-zinc-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">App</p>
            <ul className="space-y-3">
              {[
                { href: '/auth/signup', label: 'Konto erstellen' },
                { href: '/auth/login', label: 'Anmelden' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-zinc-600 transition-colors hover:text-zinc-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Legal</p>
            <ul className="space-y-3">
              {[
                { href: '/privacy', label: 'Datenschutz' },
                { href: '/terms', label: 'Nutzungsbedingungen' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-zinc-600 transition-colors hover:text-zinc-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row">
          <p className="text-[12px] text-zinc-600">© 2026 INNIS. Alle Rechte vorbehalten.</p>
          <div className="flex flex-col items-center gap-1.5 sm:items-end">
            <p className="text-[12px] text-zinc-600">Für Studenten gebaut · WS 2025/26</p>
            <a
              href="mailto:vietdobusiness@gmail.com"
              className="text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              vietdobusiness@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
