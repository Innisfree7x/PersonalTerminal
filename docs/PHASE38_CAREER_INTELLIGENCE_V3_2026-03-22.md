# Phase 38 — Career Intelligence V3

Stand: 2026-03-22  
Status: Implementiert

## Ziel
Den Opportunity Radar von einer reinen Match-Liste zu einer echten Decision Surface weiterziehen:
- Firmenkontext statt nur Score
- Recovery-Logik statt toter Weak-/Empty-States
- klarere Action Chains vom Lead zur nächsten sinnvollen Ausführung

## Umgesetzt

### 1. Company Lens
- Neue Ableitung für bekannte Firmencluster in `lib/career/targetFirms.ts`
- Neue Lens-Logik in `lib/career/opportunityCompanyLens.ts`
- Firmen erhalten jetzt ein interpretierbares Profil:
  - Segment (`Boutique M&A`, `Deals Platform`, `Transaction Specialists`, ...)
  - Operating Style
  - Entry Signal
  - Track-Aligned vs. Track-Adjacent

### 2. Tiefere Dossier-Logik
- `lib/career/opportunityDossier.ts` erweitert
- Neues Dossier enthält jetzt zusätzlich:
  - `companyLens`
  - kontextreichere `actionStack`-Sequenzen
  - Firmen-Lens als explizites Bullet-Signal

### 3. Recovery Playbook
- Neue Recovery-Logik in `lib/career/opportunityRecovery.ts`
- Weak-Signal- und Empty-State verwenden jetzt denselben Recovery-Frame:
  - enger Query wird benannt
  - Track-/Band-/CV-Hebel werden erklärt
  - Recovery fühlt sich wie Systemverhalten an, nicht wie ein leerer Fehlerzustand

### 4. Opportunity Radar UI
- `components/features/career/OpportunityRadar.tsx`
- Änderungen:
  - `Recovery Playbook` im Empty-State
  - `Recovery mode` bei nur target/stretch-Leads
  - Dossier rendert jetzt:
    - `Warum dieser Lead jetzt Sinn macht`
    - `Company Lens`
    - `Action Stack`
    - `Top Gründe`
    - `Hauptlücken`
    - `Nächster sinnvoller Move`

## Wirkung
- Leads wirken weniger zufällig und weniger “KI-Score-Spielerei”
- bekannte Firmen erhalten glaubwürdigen Kontext
- schwache Märkte haben jetzt einen klaren operativen Rückweg
- der Nutzer kommt schneller von:
  - `Interessant`
  - zu `Warum genau`
  - zu `Was mache ich jetzt`

## Betroffene Dateien
- `components/features/career/OpportunityRadar.tsx`
- `lib/career/targetFirms.ts`
- `lib/career/opportunityDossier.ts`
- `lib/career/opportunityCompanyLens.ts`
- `lib/career/opportunityRecovery.ts`

## Tests
- `tests/unit/OpportunityRadar.test.tsx`
- `tests/unit/opportunity-dossier.test.ts`
- `tests/unit/opportunity-company-lens.test.ts`
- `tests/unit/opportunity-recovery.test.ts`
- `tests/unit/career-target-firms.test.ts`

## Verifikation
- `npm run type-check`
- `npm run lint`
- `npm run build`
- gezielte Unit-Suite für Career V3

## Offene nächste sinnvolle Schritte
1. echte `Company Dossier`-Vertiefung mit historischer/marktbezogener Firmenebene
2. `Gap -> Today` und `Gap -> Trajectory` noch direkter in der Dossier-Fläche visualisieren
3. CV-/Radar-Kopplung weiter stärken, damit Recovery-Schritte noch personalisierter werden
