export const metadata = {
  title: 'Datenschutz — INNIS',
  description: 'Datenschutzerklärung für INNIS.',
};

export default function PrivacyPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl font-bold text-[#FAF0E6] tracking-tight mb-10">Datenschutzerklärung</h1>

        <div className="space-y-8 text-zinc-400 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">1. Verantwortlicher</h2>
            <p>
              INNIS ist ein persönliches Projekt ohne kommerzielle Absicht.
              Verantwortlich: Viet Duc Do.
              Kontakt: vietdobusiness@gmail.com
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">2. Erhobene Daten</h2>
            <p>
              INNIS erhebt ausschließlich Daten, die du aktiv eingibst: Aufgaben, Kurse, Ziele,
              Bewerbungen und Profileinformationen. Es werden keine Verhaltensdaten an Dritte
              weitergegeben.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">3. Datenspeicherung</h2>
            <p>
              Alle Daten werden verschlüsselt in Supabase (PostgreSQL) gespeichert. Supabase ist
              DSGVO-konform und bietet Datenzentren in der EU. Deine Daten verlassen nie die
              Supabase-Infrastruktur ohne deine Zustimmung.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">4. Google Calendar</h2>
            <p>
              Die Google Calendar Integration ist vollständig optional. Wenn du sie aktivierst,
              werden OAuth-Tokens sicher gespeichert und ausschließlich für den Kalender-Datenabruf
              genutzt. Du kannst die Verbindung jederzeit in den Einstellungen trennen.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#FAF0E6] mb-3">5. Deine Rechte</h2>
            <p>
              Du hast jederzeit das Recht auf Auskunft, Berichtigung und Löschung deiner Daten.
              Für Anfragen kontaktiere uns unter vietdobusiness@gmail.com.
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
