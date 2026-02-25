# Agent Task Template

Nutze dieses Template fuer jeden neuen Task im 3-Agent Setup.

```md
# Task [ID]

## Outcome
[1 Satz: Was ist nachher fuer den User besser?]

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

## Validation
- Required commands:
  - `npm run type-check`
  - `npm run lint`
  - [targeted tests]
- Manual QA:
  - [user flow 1]
  - [user flow 2]

## Risks
- [risk] -> mitigation

## Handoff
- Commit:
- Changed files:
- Checks:
- Follow-up:
```

