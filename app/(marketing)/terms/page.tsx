export const metadata = {
  title: 'Nutzungsbedingungen — Prism',
  description: 'Nutzungsbedingungen für Prism.',
};

export default function TermsPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl font-bold text-[#FAF0E6] tracking-tight mb-10">Nutzungsbedingungen</h1>

        <div className="space-y-8 text-zinc-400 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">1. Nutzung</h2>
            <p>
              Prism ist ein kostenloses, persönliches Produktivitäts-Tool. Die Nutzung ist für
              Studenten kostenlos. Kommerzielle Nutzung ohne ausdrückliche Genehmigung ist nicht gestattet.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">2. Verfügbarkeit</h2>
            <p>
              Prism wird als persönliches Projekt bereitgestellt. Es gibt keine Garantie für
              ununterbrochene Verfügbarkeit. Wir behalten uns das Recht vor, den Dienst jederzeit
              zu ändern oder einzustellen.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">3. Nutzerinhalte</h2>
            <p>
              Du bist allein verantwortlich für die Inhalte, die du in Prism eingibst. Bitte
              speichere keine sensiblen personenbezogenen Daten Dritter ohne deren Zustimmung.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">4. Haftung</h2>
            <p>
              Prism wird ohne Gewährleistung bereitgestellt. Der Betreiber haftet nicht für
              Datenverluste oder Schäden, die aus der Nutzung des Dienstes entstehen.
              Wir empfehlen regelmäßige Datensicherungen.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">5. Änderungen</h2>
            <p>
              Diese Nutzungsbedingungen können jederzeit geändert werden. Wesentliche Änderungen
              werden den Nutzern mitgeteilt.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-zinc-600">Stand: Februar 2026</p>
          </div>
        </div>
      </div>
    </section>
  );
}
