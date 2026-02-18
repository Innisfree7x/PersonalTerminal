import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="text-[#FAF0E6] font-semibold">Prism</span>
            </Link>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-[180px]">
              Das persönliche Dashboard für Studenten.
            </p>
          </div>

          {/* Produkt */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Produkt</p>
            <ul className="space-y-2.5">
              {[
                { href: '/features', label: 'Features' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/about', label: 'About' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">App</p>
            <ul className="space-y-2.5">
              {[
                { href: '/auth/signup', label: 'Konto erstellen' },
                { href: '/auth/login', label: 'Anmelden' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Legal</p>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Datenschutz' },
                { href: '/terms', label: 'Nutzungsbedingungen' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-700">© 2026 Prism. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-zinc-700">Built for students · WS 2025/26</p>
        </div>
      </div>
    </footer>
  );
}
