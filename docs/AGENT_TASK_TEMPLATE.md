# Agent Task Template

Nutze dieses Template fuer jeden neuen Task im 3-Agent Setup.

```md
# Task [ID]

## Outcome
[1 Satz: Was ist nachher fuer den User besser?]

## Wave / Scope Lock
- Wave:
- Warum jetzt (Impact):
- Nicht-Ziele (hart):

## Owner
- Primary Agent: [A core | B ui | C qa]
- Reviewer Agent: [A/B/C]

## Scope
- In scope:
  - [konkrete changes]
- Out of scope:
  - [explizit ausschliessen]

## Files
- Expected:
  - [pfad]
  - [pfad]
- Must not touch:
  - [pfad]

## Acceptance Criteria
1. [messbares kriterium]
2. [messbares kriterium]
3. [messbares kriterium]

## UX/Design Quality (falls UI betroffen)
- [ ] Theme-konsistent (keine hardcoded Fremdfarben ohne Grund)
- [ ] Lesbarkeit in allen aktiven Themes geprueft
- [ ] Above-the-fold Prioritaet verbessert oder mindestens gehalten
- [ ] Keine irrefuehrenden/toten CTAs

## Performance/Reliability Quality
- [ ] Keine redundanten Requests eingefuehrt
- [ ] Keine Query-Key-Kollision
- [ ] Fallback-/Error-Pfade abgedeckt
- [ ] Keine stillen Runtime-Fehler (optional/null/storage/env)

## Validation
- Required commands:
  - `npm run type-check`
  - `npm run lint`
  - [targeted tests]
- Manual QA:
  - [user flow 1]
  - [user flow 2]

## Audit Output (Pflicht)
- Findings:
  - P0:
  - P1:
  - P2:
- Entscheidung:
  - [ ] GO
  - [ ] NO-GO
- Begruendung:

## Risks
- [risk] -> mitigation

## Handoff
- Commit:
- Changed files:
- Checks:
- Follow-up:
- Docs updated:
- Known risks:
```
