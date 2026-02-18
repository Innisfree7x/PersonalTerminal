import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/25 to-transparent" />
      <div className="marketing-container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25">
                <span className="text-white text-xs font-bold">I</span>
              </div>
              <span className="font-semibold text-[#FAF0E6]">INNIS</span>
            </Link>
            <p className="max-w-[220px] text-xs leading-relaxed text-zinc-500">
              Das persönliche Dashboard für Studenten.
            </p>
          </div>

          {/* Produkt */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Produkt</p>
            <ul className="space-y-2.5">
              {[
                { href: '/features', label: 'Features' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/about', label: 'About' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-400 transition-colors hover:text-zinc-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">App</p>
            <ul className="space-y-2.5">
              {[
                { href: '/auth/signup', label: 'Konto erstellen' },
                { href: '/auth/login', label: 'Anmelden' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-400 transition-colors hover:text-zinc-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Legal</p>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Datenschutz' },
                { href: '/terms', label: 'Nutzungsbedingungen' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-400 transition-colors hover:text-zinc-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-600">© 2026 INNIS. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-zinc-600">Built for students · WS 2025/26</p>
        </div>
      </div>
    </footer>
  );
}
